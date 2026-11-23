"use client";

// Frontend data layer. Every exported action here maps 1:1 to a future
// Server Action backed by Drizzle + Neon (PRD §8–9). Until the backend exists,
// state lives in this browser's localStorage so the whole UI is usable.

import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import { splitAmount } from "./money";
import type { Barber, Category, DB, PaymentMethod, Payout, Sale, Service, Settings } from "./types";

const DB_KEY = "salon.db.v1";
const SHOP_KEY = "salon.shop.v1"; // stores the shopCodeVersion this device unlocked
const ADMIN_KEY = "salon.admin.v1"; // stores admin session expiry (ms)

export const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;
export const BARBER_VOID_WINDOW_MS = 10 * 60 * 1000;
export const PAYOUT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface State {
  db: DB;
  shopVersion: number | null;
  adminUntil: number;
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
  const shop = Number(read(SHOP_KEY));
  const admin = Number(read(ADMIN_KEY));
  return {
    db,
    shopVersion: Number.isFinite(shop) && shop > 0 ? shop : null,
    adminUntil: Number.isFinite(admin) ? admin : 0,
  };
}

function ensure(): State {
  if (!state) {
    state = loadState();
    window.addEventListener("storage", (e) => {
      if (e.key === DB_KEY || e.key === SHOP_KEY || e.key === ADMIN_KEY) {
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
  if (!prev || prev.shopVersion !== next.shopVersion)
    write(SHOP_KEY, next.shopVersion === null ? null : String(next.shopVersion));
  if (!prev || prev.adminUntil !== next.adminUntil) write(ADMIN_KEY, String(next.adminUntil));
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

export const isShopUnlocked = (s: State) => s.shopVersion === s.db.settings.shopCodeVersion;
export const isAdmin = (s: State) => s.adminUntil > Date.now();

export function unlockShop(code: string): boolean {
  const s = ensure();
  if (code.trim() !== s.db.settings.shopCode) return false;
  commit({ ...s, shopVersion: s.db.settings.shopCodeVersion });
  return true;
}

export function loginAdmin(pin: string): boolean {
  const s = ensure();
  if (pin.trim() !== s.db.settings.adminPin) return false;
  // An admin login also unlocks this device for the barber screens.
  commit({ ...s, adminUntil: Date.now() + ADMIN_TTL_MS, shopVersion: s.db.settings.shopCodeVersion });
  return true;
}

export function logoutAdmin() {
  commit({ ...ensure(), adminUntil: 0 });
}

function requireAdmin() {
  if (!isAdmin(ensure())) throw new ActionError("এডমিন হিসেবে আবার লগইন করুন");
}

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
  if (by === "ADMIN") requireAdmin();
  else if (!canBarberVoid(sale)) throw new ActionError("১০ মিনিট পার হয়ে গেছে — এডমিনকে বলুন");
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
  requireAdmin();
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
  requireAdmin();
  const { db } = ensure();
  const cur = db.barbers.find((b) => b.id === id);
  if (!cur) throw new ActionError("নাপিত পাওয়া যায়নি");
  const next = { ...cur, ...patch, name: (patch.name ?? cur.name).trim() };
  if (next.active) validateBarber(db, next.name, next.commissionPct, id);
  updateDb((d) => ({ ...d, barbers: d.barbers.map((b) => (b.id === id ? next : b)) }));
}

// ---------- categories & services ----------

export function addCategory(name: string) {
  requireAdmin();
  if (!name.trim()) throw new ActionError("ক্যাটাগরির নাম লিখুন");
  const { db } = ensure();
  const cat: Category = { id: nextId(db.categories), name: name.trim(), sortOrder: db.categories.length, active: true };
  updateDb((d) => ({ ...d, categories: [...d.categories, cat] }));
}

export function updateCategory(id: number, patch: Partial<Omit<Category, "id">>) {
  requireAdmin();
  if (patch.name !== undefined && !patch.name.trim()) throw new ActionError("ক্যাটাগরির নাম লিখুন");
  updateDb((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}

function validateService(name: string, price: number) {
  if (!name.trim()) throw new ActionError("সার্ভিসের নাম লিখুন");
  if (!Number.isInteger(price) || price <= 0) throw new ActionError("দাম ০ এর বেশি পূর্ণ সংখ্যা হবে");
}

export function addService(categoryId: number, name: string, price: number) {
  requireAdmin();
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
  requireAdmin();
  const { db } = ensure();
  const cur = db.services.find((s) => s.id === id);
  if (!cur) throw new ActionError("সার্ভিস পাওয়া যায়নি");
  const next = { ...cur, ...patch, name: (patch.name ?? cur.name).trim() };
  validateService(next.name, next.price);
  updateDb((d) => ({ ...d, services: d.services.map((s) => (s.id === id ? next : s)) }));
}

// ---------- payouts ----------

export function addPayout(barberId: number, amount: number, paidAt: string, note: string) {
  requireAdmin();
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
  requireAdmin();
  const p = ensure().db.payouts.find((x) => x.id === id);
  if (!p) return;
  if (!canDeletePayout(p)) throw new ActionError("২৪ ঘণ্টা পার হওয়া পেমেন্ট মুছা যাবে না");
  updateDb((d) => ({ ...d, payouts: d.payouts.filter((x) => x.id !== id) }));
}

// ---------- settings ----------

export function updateSettings(
  patch: Partial<Pick<Settings, "shopName" | "shopAddress" | "shopPhone" | "receiptFooter" | "paperWidth">>,
) {
  requireAdmin();
  if (patch.shopName !== undefined && !patch.shopName.trim()) throw new ActionError("দোকানের নাম লিখুন");
  updateDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

export function changeAdminPin(current: string, next: string) {
  requireAdmin();
  const { db } = ensure();
  if (current !== db.settings.adminPin) throw new ActionError("বর্তমান পিন ভুল");
  if (!/^\d{4,8}$/.test(next)) throw new ActionError("নতুন পিন ৪–৮ সংখ্যার হতে হবে");
  updateDb((d) => ({ ...d, settings: { ...d.settings, adminPin: next } }));
}

/** FR-21: bumping the version logs every shop device out. */
export function changeShopCode(next: string) {
  requireAdmin();
  if (!/^\d{4,8}$/.test(next)) throw new ActionError("শপ কোড ৪–৮ সংখ্যার হতে হবে");
  const s = ensure();
  const version = s.db.settings.shopCodeVersion + 1;
  commit({
    ...s,
    shopVersion: version, // keep this (admin) device unlocked
    db: { ...s.db, settings: { ...s.db.settings, shopCode: next, shopCodeVersion: version } },
  });
}

export function exportAll(): string {
  requireAdmin();
  const { db } = ensure();
  const { adminPin: _pin, shopCode: _code, ...settings } = db.settings;
  void _pin;
  void _code;
  return JSON.stringify({ ...db, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export function resetDemoData() {
  requireAdmin();
  const s = ensure();
  const seed = createSeed();
  commit({ ...s, db: seed, shopVersion: seed.settings.shopCodeVersion });
}
