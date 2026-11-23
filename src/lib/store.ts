"use client";

// Frontend data layer. Every exported action here maps 1:1 to a future
// Server Action backed by Drizzle + Neon (PRD §8–9). Until the backend exists,
// state lives in this browser's localStorage so the whole UI is usable.

import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import { splitAmount } from "./money";
import type { DB, PaymentMethod, Payout, Sale } from "./types";

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

// `catalog` is TRANSITIONAL (removed with this function in the createSale phase): barbers and
// services now live in Neon, so the caller passes the server-loaded ones for the price lookup.
export function createSale(input: NewSale, catalog?: Pick<DB, "barbers" | "services">): Sale {
  const { db } = ensure();
  const dup = db.sales.find((x) => x.idempotencyKey === input.idempotencyKey);
  if (dup) return dup; // FR-9

  const lookup = catalog ?? db;
  const barber = lookup.barbers.find((b) => b.id === input.barberId && b.active);
  if (!barber) throw new ActionError("নাপিত পাওয়া যায়নি");

  // FR-8: prices always come from the stored service list, never the client cart.
  const items = input.items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const svc = lookup.services.find((x) => x.id === i.serviceId && x.active);
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

export function exportAll(): string {
  const { db } = ensure();
  return JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 2);
}

export function resetDemoData() {
  commit({ db: createSeed() });
}
