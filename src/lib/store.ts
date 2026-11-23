"use client";

// Frontend data layer. Every exported action here maps 1:1 to a future
// Server Action backed by Drizzle + Neon (PRD §8–9). Until the backend exists,
// state lives in this browser's localStorage so the whole UI is usable.

import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import { splitAmount } from "./money";
import type { Barber, Category, DB, PaymentMethod, Payout, Sale, Service, Settings } from "./types";

const DB_KEY = "salon.db.v1";

export const BARBER_VOID_WINDOW_MS = 10 * 60 * 1000;
export const PAYOUT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface State {
  db: DB;
}

let state: State | null = null;
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked — state still works for this tab */
  }
}

function loadState(): State {
  let db: DB;
  try {
    const raw = read(DB_KEY);
    db = raw ? (JSON.parse(raw) as DB) : createSeed();
  } catch {
    db = createSeed();
  }
  // Older demo data kept the PIN and shop code in plaintext here. Auth is server-side now: drop them.
  const s = db.settings as unknown as Record<string, unknown>;
  delete s.adminPin;
  delete s.shopCode;
  delete s.shopCodeVersion;
  write("salon.shop.v1", null);
  write("salon.admin.v1", null);
  return { db };
}

function ensure(): State {
  if (!state) {
    state = loadState();
    window.addEventListener("storage", (e) => {
      if (e.key === DB_KEY) {
        state = loadState();
        listeners.forEach((l) => l());
      }
    });
  }
  return state;
}

function commit(next: State) {
  const prev = state;
  state = next;
  if (!prev || prev.db !== next.db) write(DB_KEY, JSON.stringify(next.db));
  listeners.forEach((l) => l());
}

function updateDb(fn: (db: DB) => DB) {
  const s = ensure();
  commit({ ...s, db: fn(s.db) });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Returns null during SSR / first hydration pass, then the live state. */
export function useStore(): State | null {
  return useSyncExternalStore(subscribe, ensure, () => null);
}

const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

export class ActionError extends Error {}

// ---------- access ----------
// Shop unlock and admin login/PIN/shop-code live in src/app/actions/auth.ts (server-side, bcrypt +
// signed cookies). Admin pages are guarded by proxy.ts. When each action below becomes a Server
// Action it must call requireAdmin()/requireShop() from "@/lib/auth" on the server (PRD FR-4).

// ---------- sales ----------

export interface NewSale {
  barberId: number;
  items: { serviceId: number; qty: number }[];
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export function createSale(input: NewSale): Sale {
  const { db } = ensure();
  const dup = db.sales.find((x) => x.idempotencyKey === input.idempotencyKey);
  if (dup) return dup; // FR-9

  const barber = db.barbers.find((b) => b.id === input.barberId && b.active);
  if (!barber) throw new ActionError("নাপিত পাওয়া যায়নি");

  // FR-8: prices always come from the stored service list, never the client cart.
  const items = input.items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const svc = db.services.find((x) => x.id === i.serviceId && x.active);
      if (!svc) throw new ActionError("একটি সার্ভিস আর পাওয়া যাচ্ছে না");
      return {
        serviceId: svc.id,
        nameSnapshot: svc.name,
        priceSnapshot: svc.price,
        qty: Math.min(20, Math.max(1, Math.round(i.qty))),
      };
    });
  if (items.length === 0) throw new ActionError("কোনো সার্ভিস বাছাই করা হয়নি");

  const total = items.reduce((n, i) => n + i.priceSnapshot * i.qty, 0);
  const { barberShare, ownerShare } = splitAmount(total, barber.commissionPct);
  const sale: Sale = {
    id: nextId(db.sales),
    idempotencyKey: input.idempotencyKey,
    barberId: barber.id,
    total,
    barberShare,
    ownerShare,
    commissionPctSnapshot: barber.commissionPct,
    paymentMethod: input.paymentMethod,
    createdAt: new Date().toISOString(),
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    items,
  };
  updateDb((d) => ({ ...d, sales: [...d.sales, sale] }));
  return sale;
}

export const canBarberVoid = (sale: Sale) =>
  !sale.voidedAt && Date.now() - Date.parse(sale.createdAt) <= BARBER_VOID_WINDOW_MS;

export function voidSale(id: number, by: "BARBER" | "ADMIN", reason: string) {
  const { db } = ensure();
  const sale = db.sales.find((x) => x.id === id);
  if (!sale) throw new ActionError("বিক্রি পাওয়া যায়নি");
  if (sale.voidedAt) return;
  if (by !== "ADMIN" && !canBarberVoid(sale)) throw new ActionError("১০ মিনিট পার হয়ে গেছে — এডমিনকে বলুন");
  if (!reason.trim()) throw new ActionError("বাতিলের কারণ লিখুন");
  updateDb((d) => ({
    ...d,
    sales: d.sales.map((x) =>
      x.id === id ? { ...x, voidedAt: new Date().toISOString(), voidedBy: by, voidReason: reason.trim() } : x,
    ),
  }));
}

// ---------- barbers ----------

function validateBarber(db: DB, name: string, pct: number, selfId?: number) {
  if (!name.trim()) throw new ActionError("নাম লিখুন");
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) throw new ActionError("কমিশন ০ থেকে ১০০ এর মধ্যে হবে");
  const clash = db.barbers.some((b) => b.active && b.id !== selfId && b.name.trim() === name.trim());
  if (clash) throw new ActionError("এই নামে একজন নাপিত আগে থেকেই আছে");
}

export function addBarber(name: string, commissionPct = 50) {
  const { db } = ensure();
  validateBarber(db, name, commissionPct);
  const barber: Barber = {
    id: nextId(db.barbers),
    name: name.trim(),
    commissionPct,
    sortOrder: db.barbers.length,
    active: true,
    createdAt: new Date().toISOString(),
  };
  updateDb((d) => ({ ...d, barbers: [...d.barbers, barber] }));
}

export function updateBarber(id: number, patch: Partial<Omit<Barber, "id" | "createdAt">>) {
  const { db } = ensure();
  const cur = db.barbers.find((b) => b.id === id);
  if (!cur) throw new ActionError("নাপিত পাওয়া যায়নি");
  const next = { ...cur, ...patch, name: (patch.name ?? cur.name).trim() };
  if (next.active) validateBarber(db, next.name, next.commissionPct, id);
  updateDb((d) => ({ ...d, barbers: d.barbers.map((b) => (b.id === id ? next : b)) }));
}

// ---------- categories & services ----------

export function addCategory(name: string) {
  if (!name.trim()) throw new ActionError("ক্যাটাগরির নাম লিখুন");
  const { db } = ensure();
  const cat: Category = { id: nextId(db.categories), name: name.trim(), sortOrder: db.categories.length, active: true };
  updateDb((d) => ({ ...d, categories: [...d.categories, cat] }));
}

export function updateCategory(id: number, patch: Partial<Omit<Category, "id">>) {
  if (patch.name !== undefined && !patch.name.trim()) throw new ActionError("ক্যাটাগরির নাম লিখুন");
  updateDb((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}

function validateService(name: string, price: number) {
  if (!name.trim()) throw new ActionError("সার্ভিসের নাম লিখুন");
  if (!Number.isInteger(price) || price <= 0) throw new ActionError("দাম ০ এর বেশি পূর্ণ সংখ্যা হবে");
}

export function addService(categoryId: number, name: string, price: number) {
  validateService(name, price);
  const { db } = ensure();
  const svc: Service = {
    id: nextId(db.services),
    categoryId,
    name: name.trim(),
    price,
    sortOrder: db.services.filter((s) => s.categoryId === categoryId).length,
    active: true,
  };
  updateDb((d) => ({ ...d, services: [...d.services, svc] }));
}

export function updateService(id: number, patch: Partial<Omit<Service, "id">>) {
  const { db } = ensure();
  const cur = db.services.find((s) => s.id === id);
  if (!cur) throw new ActionError("সার্ভিস পাওয়া যায়নি");
  const next = { ...cur, ...patch, name: (patch.name ?? cur.name).trim() };
  validateService(next.name, next.price);
  updateDb((d) => ({ ...d, services: d.services.map((s) => (s.id === id ? next : s)) }));
}

// ---------- payouts ----------

export function addPayout(barberId: number, amount: number, paidAt: string, note: string) {
  if (!Number.isInteger(amount) || amount <= 0) throw new ActionError("টাকার পরিমাণ সঠিক নয়");
  const { db } = ensure();
  const payout: Payout = {
    id: nextId(db.payouts),
    barberId,
    amount,
    note: note.trim(),
    paidAt,
    createdAt: new Date().toISOString(),
  };
  updateDb((d) => ({ ...d, payouts: [...d.payouts, payout] }));
}

export const canDeletePayout = (p: Payout) => Date.now() - Date.parse(p.createdAt) <= PAYOUT_DELETE_WINDOW_MS;

export function deletePayout(id: number) {
  const p = ensure().db.payouts.find((x) => x.id === id);
  if (!p) return;
  if (!canDeletePayout(p)) throw new ActionError("২৪ ঘণ্টা পার হওয়া পেমেন্ট মুছা যাবে না");
  updateDb((d) => ({ ...d, payouts: d.payouts.filter((x) => x.id !== id) }));
}

// ---------- settings ----------

export function updateSettings(
  patch: Partial<Pick<Settings, "shopName" | "shopAddress" | "shopPhone" | "receiptFooter" | "paperWidth">>,
) {
  if (patch.shopName !== undefined && !patch.shopName.trim()) throw new ActionError("দোকানের নাম লিখুন");
  updateDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

export function exportAll(): string {
  const { db } = ensure();
  return JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 2);
}

export function resetDemoData() {
  commit({ db: createSeed() });
}
