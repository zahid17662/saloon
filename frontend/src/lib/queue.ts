"use client";

import { useSyncExternalStore } from "react";

// Demo queue store (frontend-only, no backend yet). State lives in localStorage so the landing page,
// the shop board and the tracker stay in sync across tabs, the way the real backend (SSE) will later.

export type Source = "online" | "walkin" | "advance";
export type Ticket = { serial: number; name: string; service: string; price: number; source: Source; phone?: string; note?: string };
export type Lane = { id: number; name: string; initial: string; photo?: string; current: Ticket | null; waiting: Ticket[]; lastSerial: number; doneToday: number; earned: number };
export type QueueState = { lanes: Lane[]; mine: { barberId: number; serial: number } | null };

const KEY = "nir-queue-v1";
export const MIN_PER_CUT = 25;

const seed = (): QueueState => ({
  mine: null,
  lanes: [
    { id: 1, name: "[কারিগর ১]", initial: "র", lastSerial: 15, doneToday: 4, earned: 920,
      current: { serial: 12, name: "[কাস্টমার]", service: "হেয়ার কাট + দাড়ি ট্রিম", price: 230, source: "online" },
      waiting: [
        { serial: 13, name: "[কাস্টমার]", service: "ফেসিয়াল", price: 400, source: "online" },
        { serial: 14, name: "[কাস্টমার]", service: "হেয়ার কাট", price: 150, source: "walkin" },
        { serial: 15, name: "[কাস্টমার]", service: "দাড়ি ট্রিম", price: 80, source: "online" },
      ] },
    { id: 2, name: "[কারিগর ২]", initial: "স", lastSerial: 9, doneToday: 3, earned: 1100,
      current: { serial: 8, name: "[কাস্টমার]", service: "গ্রুমিং প্যাকেজ", price: 550, source: "online" },
      waiting: [{ serial: 9, name: "[কাস্টমার]", service: "হেয়ার কাট", price: 150, source: "advance" }] },
    { id: 3, name: "[কারিগর ৩]", initial: "ম", lastSerial: 5, doneToday: 5, earned: 1250, current: null, waiting: [] },
  ],
});

let state: QueueState | null = null;
const subs = new Set<() => void>();

function load(): QueueState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as QueueState) : seed();
  } catch {
    state = seed();
  }
  return state;
}
function commit(next: QueueState) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  subs.forEach((f) => f());
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try { state = e.newValue ? JSON.parse(e.newValue) : seed(); } catch { state = seed(); }
    subs.forEach((f) => f());
  });
}

const server = seed();
export function useQueue(): QueueState {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    load,
    () => server,
  );
}

export const aheadOf = (l: Lane) => l.waiting.length + (l.current ? 1 : 0);
export const etaMin = (l: Lane) => aheadOf(l) * MIN_PER_CUT;
export const isFree = (l: Lane) => !l.current;

/** Join: a free barber serves directly; otherwise the ticket goes to the back of his queue. "any" picks the shortest lane. */
export function join(barberId: number | "any", t: { name: string; service: string; price: number; source: Source; phone?: string; note?: string }): { barberId: number; serial: number; direct: boolean } {
  const s = load();
  const lanes = s.lanes.map((l) => ({ ...l, waiting: [...l.waiting] }));
  const lane = barberId === "any" ? [...lanes].sort((a, b) => aheadOf(a) - aheadOf(b))[0] : lanes.find((l) => l.id === barberId)!;
  const serial = lane.lastSerial + 1;
  lane.lastSerial = serial;
  const ticket: Ticket = { serial, ...t };
  const direct = !lane.current;
  if (direct) lane.current = ticket; else lane.waiting.push(ticket);
  commit({ lanes, mine: t.source === "online" ? { barberId: lane.id, serial } : s.mine });
  return { barberId: lane.id, serial, direct };
}

/** Finish the current service and call the next waiting ticket. */
export function finish(barberId: number) {
  const s = load();
  const lanes = s.lanes.map((l) => {
    if (l.id !== barberId || !l.current) return l;
    const [next, ...rest] = l.waiting;
    return { ...l, current: next ?? null, waiting: rest, doneToday: l.doneToday + 1, earned: l.earned + l.current.price };
  });
  commit({ ...s, lanes });
}

/** Barber profile picture (small data URL while there is no backend); undefined removes it. */
export function setPhoto(barberId: number, photo: string | undefined) {
  const s = load();
  commit({ ...s, lanes: s.lanes.map((l) => (l.id === barberId ? { ...l, photo } : l)) });
}

/** Shop side: take a waiting ticket out of a barber's queue. */
export function removeTicket(barberId: number, serial: number) {
  const s = load();
  const lanes = s.lanes.map((l) => (l.id === barberId ? { ...l, waiting: l.waiting.filter((w) => w.serial !== serial) } : l));
  const mine = s.mine && s.mine.barberId === barberId && s.mine.serial === serial ? null : s.mine;
  commit({ lanes, mine });
}

export function cancelMine() {
  const s = load();
  if (!s.mine) return;
  const lanes = s.lanes.map((l) => (l.id === s.mine!.barberId ? { ...l, waiting: l.waiting.filter((w) => w.serial !== s.mine!.serial) } : l));
  commit({ lanes, mine: null });
}

export function resetDemo() { commit(seed()); }
