import "server-only";

import { daySlots, resolveSlot } from "./booking";
import type { Appointment, Barber, Category, Payout, PublicMenu, Sale, Service, Settings } from "./types";

// PREVIEW MODE: lets the frontend run with no backend, for design work. Set PREVIEW_MODE=1 on the
// frontend and every API call is answered from the sample data below instead of BACKEND_URL.
// Nothing is validated and nothing is saved for real: changes live in this server process's memory
// and vanish on restart. Remove the variable (and set BACKEND_URL) to use the real API.

export const PREVIEW = process.env.PREVIEW_MODE === "1";

type Json = Record<string, unknown>;
type Reply = { status: number; body: unknown };

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const dhakaDay = (t: number) => new Date(t + 6 * HOUR).toISOString().slice(0, 10);

const categories: Category[] = [
  { id: 1, name: "চুল কাটা", sortOrder: 1, active: true },
  { id: 2, name: "হেয়ার কালার", sortOrder: 2, active: true },
  { id: 3, name: "ফেসিয়াল", sortOrder: 3, active: true },
  { id: 4, name: "হেয়ার ট্রিটমেন্ট", sortOrder: 4, active: true },
  { id: 5, name: "বডি ম্যাসাজ চেয়ার", sortOrder: 5, active: true },
];

// The shop's printed price list.
const services: Service[] = [
  { id: 1, categoryId: 1, name: "হেয়ার কাট", price: 150, sortOrder: 1, active: true },
  { id: 2, categoryId: 1, name: "হেয়ার ওয়াশ", price: 50, sortOrder: 2, active: true },
  { id: 3, categoryId: 1, name: "দাড়ি ট্রিম", price: 100, sortOrder: 3, active: true },
  { id: 4, categoryId: 1, name: "হেয়ার সেটআপ", price: 100, sortOrder: 4, active: true },
  { id: 5, categoryId: 2, name: "হেয়ার শাইনিং", price: 400, sortOrder: 1, active: true },
  { id: 6, categoryId: 2, name: "হেয়ার কালার ব্ল্যাক রেভলন", price: 600, sortOrder: 2, active: true },
  { id: 7, categoryId: 2, name: "হেয়ার কালার ব্রাউন", price: 600, sortOrder: 3, active: true },
  { id: 8, categoryId: 2, name: "হেয়ার কালার বিগিন", price: 600, sortOrder: 4, active: true },
  { id: 9, categoryId: 2, name: "হাইলাইট কালার (প্রতি স্টেপ)", price: 200, sortOrder: 5, active: true },
  { id: 10, categoryId: 3, name: "ব্রাইটেনিং ফেসিয়াল", price: 300, sortOrder: 1, active: true },
  { id: 11, categoryId: 3, name: "গোল্ড ফেসিয়াল", price: 600, sortOrder: 2, active: true },
  { id: 12, categoryId: 3, name: "ডায়মন্ড ফেসিয়াল", price: 700, sortOrder: 3, active: true },
  { id: 13, categoryId: 3, name: "সিলভার ফেসিয়াল", price: 600, sortOrder: 4, active: true },
  { id: 14, categoryId: 3, name: "একনে ফেসিয়াল", price: 600, sortOrder: 5, active: true },
  { id: 15, categoryId: 3, name: "ফ্রুট ফেসিয়াল", price: 600, sortOrder: 6, active: true },
  { id: 16, categoryId: 3, name: "হাইড্রা ফেসিয়াল (মিনি)", price: 1200, sortOrder: 7, active: true },
  { id: 17, categoryId: 3, name: "হাইড্রা ফেসিয়াল (ফুল)", price: 1800, sortOrder: 8, active: true },
  { id: 18, categoryId: 4, name: "হেয়ার ট্রিটমেন্ট", price: 600, sortOrder: 1, active: true },
  { id: 19, categoryId: 4, name: "হেয়ার স্পা", price: 600, sortOrder: 2, active: true },
  { id: 20, categoryId: 4, name: "হেয়ার স্ট্রেট", price: 2000, sortOrder: 3, active: true },
  { id: 21, categoryId: 4, name: "হেয়ার রিবন্ডিং", price: 2500, sortOrder: 4, active: true },
  { id: 22, categoryId: 5, name: "ম্যাসাজ চেয়ার ১০ মিনিট", price: 100, sortOrder: 1, active: true },
  { id: 23, categoryId: 5, name: "ম্যাসাজ চেয়ার ২০ মিনিট", price: 200, sortOrder: 2, active: true },
  { id: 24, categoryId: 5, name: "ম্যাসাজ চেয়ার ৩০ মিনিট", price: 250, sortOrder: 3, active: true },
  { id: 25, categoryId: 5, name: "ম্যাসাজ চেয়ার ৬০ মিনিট", price: 400, sortOrder: 4, active: true },
];

const barbers: Barber[] = [
  { id: 1, name: "রাকিব", commissionPct: 50, sortOrder: 1, active: true, createdAt: new Date(Date.now() - 90 * DAY).toISOString() },
  { id: 2, name: "সুমন", commissionPct: 45, sortOrder: 2, active: true, createdAt: new Date(Date.now() - 60 * DAY).toISOString() },
  { id: 3, name: "জুয়েল", commissionPct: 40, sortOrder: 3, active: true, createdAt: new Date(Date.now() - 30 * DAY).toISOString() },
];

const settings: Settings = {
  shopName: "NIR SMART GENTS PARLOUR",
  shopAddress: "মেইন রোড, দিনাজপুর",
  shopPhone: "01700000000",
  receiptFooter: "ধন্যবাদ, আবার আসবেন",
  paperWidth: "58",
};

const PAYMENTS = ["CASH", "CASH", "CASH", "BKASH", "NAGAD"] as const;

function makeSale(id: number, barberId: number, serviceIds: number[], at: number, pay: Sale["paymentMethod"], voided = false): Sale {
  const barber = barbers.find((b) => b.id === barberId)!;
  const items = serviceIds.map((sid) => {
    const s = services.find((x) => x.id === sid)!;
    return { serviceId: s.id, nameSnapshot: s.name, priceSnapshot: s.price, qty: 1 };
  });
  const total = items.reduce((n, i) => n + i.priceSnapshot * i.qty, 0);
  const barberShare = Math.round((total * barber.commissionPct) / 100);
  return {
    id,
    idempotencyKey: `preview-${id}-key`,
    barberId,
    total,
    barberShare,
    ownerShare: total - barberShare,
    commissionPctSnapshot: barber.commissionPct,
    paymentMethod: pay,
    createdAt: new Date(at).toISOString(),
    voidedAt: voided ? new Date(at + 5 * 60_000).toISOString() : null,
    voidedBy: voided ? "BARBER" : null,
    voidReason: voided ? "ভুল এন্ট্রি" : null,
    enteredByAdmin: false,
    items,
  };
}

// State is kept on globalThis so dev reloads and route handlers share it.
interface State {
  appointments: Appointment[];
  sales: Sale[];
  payouts: Payout[];
  nextSale: number;
  nextId: number;
}
const g = globalThis as unknown as { __salonPreview?: State };

function seed(): State {
  const now = Date.now();
  const combos = [[1], [2], [1, 4], [4], [3], [2, 4], [6], [1, 7], [5], [2, 5]];
  const sales: Sale[] = [];
  let id = 1;
  for (let d = 14; d >= 0; d--) {
    const count = d === 0 ? 5 : 3 + ((d * 7) % 4);
    for (let k = 0; k < count; k++) {
      const at = now - d * DAY - ((k * 97) % 9) * HOUR - k * 11 * 60_000;
      if (d === 0 && at > now) continue;
      sales.push(makeSale(id++, ((id + k) % 3) + 1, combos[(id * 3 + k) % combos.length], at, PAYMENTS[(id + k) % PAYMENTS.length], id % 13 === 0));
    }
  }
  sales.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const payouts: Payout[] = [
    { id: 1, barberId: 1, amount: 1500, note: "সাপ্তাহিক", paidAt: new Date(now - 6 * DAY).toISOString(), createdAt: new Date(now - 6 * DAY).toISOString() },
    { id: 2, barberId: 2, amount: 1000, note: "অগ্রিম", paidAt: new Date(now - 3 * DAY).toISOString(), createdAt: new Date(now - 3 * DAY).toISOString() },
  ];
  const day = (n: number) => dhakaDay(now + n * DAY);
  const at = (date: string, time: string) => new Date(`${date}T${time}:00+06:00`).toISOString();
  const appt = (id: number, name: string, phone: string, barberId: number | null, sids: number[], date: string, time: string, status: Appointment["status"]): Appointment => {
    const picked = sids.map((s) => services.find((x) => x.id === s)!);
    return { id, customerName: name, phone, barberId, services: picked.map((s) => ({ serviceId: s.id, name: s.name, price: s.price })), total: picked.reduce((n, s) => n + s.price, 0), startsAt: at(date, time), note: "", status, createdAt: new Date(now - HOUR).toISOString() };
  };
  const appointments: Appointment[] = [
    appt(1, "করিম উদ্দিন", "01712345678", 1, [1, 4], day(1), "11:00", "PENDING"),
    appt(2, "রহিম", "01812345678", 2, [2], day(1), "15:30", "CONFIRMED"),
    appt(3, "সাকিব", "01912345678", null, [6], day(2), "17:00", "PENDING"),
  ];
  return { appointments, sales, payouts, nextSale: id, nextId: 100 };
}

const state = () => (g.__salonPreview ??= seed());

const ok = (data: unknown): Reply => ({ status: 200, body: { ok: true, data } });
const bad = (error: string): Reply => ({ status: 400, body: { ok: false, error } });

function todaySales(barberId?: number) {
  const today = dhakaDay(Date.now());
  return state().sales.filter((s) => dhakaDay(Date.parse(s.createdAt)) === today && (barberId === undefined || s.barberId === barberId));
}

/** One mock API call. `path` is the API path without the /api prefix, for example "/sales/today-stats". */
export function previewApi(method: string, path: string, query: URLSearchParams, body: Json = {}): Reply {
  const st = state();
  let m: RegExpMatchArray | null;

  if (method === "GET") {
    if (path === "/health") return ok({ status: "preview" });
    if (path === "/auth/session") return ok({ shop: true, admin: true });
    if (path === "/public/shop-name") return ok({ shopName: settings.shopName });
    if (path === "/catalog") return ok({ categories, services, barbers, settings });
    if (path === "/public/menu") {
      const menu: PublicMenu = {
        shop: { name: settings.shopName, address: settings.shopAddress, phone: settings.shopPhone },
        categories: categories.filter((c) => c.active).map((c) => ({ id: c.id, name: c.name })),
        services: services.filter((s) => s.active).map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name, price: s.price })),
        barbers: barbers.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name })),
      };
      return ok(menu);
    }
    if (path === "/public/slots") {
      const date = query.get("date") ?? "";
      const barberId = Number(query.get("barberId"));
      return ok(
        st.appointments
          .filter((a) => a.barberId === barberId && (a.status === "PENDING" || a.status === "CONFIRMED") && dhakaDay(Date.parse(a.startsAt)) === date)
          .map((a) => new Date(Date.parse(a.startsAt) + 6 * HOUR).toISOString().slice(11, 16)),
      );
    }
    if (path === "/appointments") {
      const from = query.get("from");
      const to = query.get("to");
      const status = query.get("status") ?? "all";
      return ok(
        st.appointments
          .filter((a) => {
            const d = dhakaDay(Date.parse(a.startsAt));
            return (!from || d >= from) && (!to || d <= to) && (status === "all" || a.status === status);
          })
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      );
    }
    if (path === "/sales/today-stats") {
      return ok(
        barbers.map((b) => {
          const mine = todaySales(b.id).filter((s) => !s.voidedAt);
          return { barberId: b.id, count: mine.length, barberShare: mine.reduce((n, s) => n + s.barberShare, 0) };
        }),
      );
    }
    if ((m = path.match(/^\/sales\/barber\/(\d+)\/today$/))) return ok(todaySales(Number(m[1])));
    if (path === "/sales") {
      const from = query.get("from");
      const to = query.get("to");
      const status = query.get("status") ?? "all";
      const barberId = query.get("barberId");
      const rows = st.sales
        .filter((s) => {
          const day = dhakaDay(Date.parse(s.createdAt));
          if (from && day < from) return false;
          if (to && day > to) return false;
          if (barberId && s.barberId !== Number(barberId)) return false;
          if (status === "live" && s.voidedAt) return false;
          if (status === "void" && !s.voidedAt) return false;
          return true;
        })
        .reverse();
      return ok(rows);
    }
    if ((m = path.match(/^\/sales\/(\d+)$/))) return ok(st.sales.find((s) => s.id === Number(m![1])) ?? null);
    if (path === "/payouts") {
      const balances = barbers.map((b) => {
        const live = st.sales.filter((s) => s.barberId === b.id && !s.voidedAt);
        const earned = live.reduce((n, s) => n + s.barberShare, 0);
        const paid = st.payouts.filter((p) => p.barberId === b.id).reduce((n, p) => n + p.amount, 0);
        return { barberId: b.id, earned, paid, balance: earned - paid, salesCount: live.length };
      });
      return ok({ payouts: [...st.payouts].reverse(), balances });
    }
    if (path === "/admin/backup") return ok({ note: "preview mode has no backup" });
    return { status: 404, body: { ok: false, error: "পাওয়া যায়নি" } };
  }

  // ---- writes: accepted and applied in memory, no validation ----
  if (path.startsWith("/auth/")) return path === "/auth/check" ? ok({ valid: true }) : { status: 200, body: { ok: true } };

  if (path === "/public/appointments" && method === "POST") {
    const ids = Array.isArray(body.serviceIds) ? (body.serviceIds as number[]).map(Number) : [];
    const picked = services.filter((s) => ids.includes(s.id));
    if (!picked.length) return bad("কমপক্ষে একটি সেবা বেছে নিন");
    if (!String(body.customerName ?? "").trim()) return bad("আপনার নাম লিখুন");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(String(body.phone ?? "").trim())) return bad("সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)");
    const slot = resolveSlot(String(body.date), String(body.time));
    if (!slot.ok || !daySlots().includes(String(body.time))) return bad(slot.ok ? "সঠিক সময় বেছে নিন" : slot.error);
    const barberId = body.barberId == null ? null : Number(body.barberId);
    const iso = slot.startsAt.toISOString();
    if (barberId != null && st.appointments.some((a) => a.barberId === barberId && a.startsAt === iso && (a.status === "PENDING" || a.status === "CONFIRMED"))) {
      return bad("এই সময়টি আগেই বুক হয়ে গেছে, অন্য সময় বেছে নিন");
    }
    const a: Appointment = {
      id: st.nextId++,
      customerName: String(body.customerName).trim(),
      phone: String(body.phone).trim().replace(/^\+?88/, ""),
      barberId,
      services: picked.map((s) => ({ serviceId: s.id, name: s.name, price: s.price })),
      total: picked.reduce((n, s) => n + s.price, 0),
      startsAt: iso,
      note: String(body.note ?? ""),
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    st.appointments.push(a);
    return ok(a);
  }
  if ((m = path.match(/^\/appointments\/(\d+)$/)) && method === "PATCH") {
    const a = st.appointments.find((x) => x.id === Number(m![1]));
    if (!a) return bad("অ্যাপয়েন্টমেন্ট পাওয়া যায়নি");
    a.status = body.status as Appointment["status"];
    return ok(a);
  }
  if (path === "/sales" || path === "/sales/past") {
    const items = Array.isArray(body.items) ? (body.items as { serviceId: number; qty?: number }[]) : [];
    if (!items.length) return bad("কমপক্ষে একটি সেবা বেছে নিন");
    const barberId = Number(body.barberId) || 1;
    const ids = items.flatMap((i) => Array.from({ length: Math.max(1, Number(i.qty) || 1) }, () => Number(i.serviceId)));
    const key = String(body.idempotencyKey ?? "");
    const dup = st.sales.find((s) => s.idempotencyKey === key);
    if (dup) return ok(dup);
    let at = Date.now();
    if (path === "/sales/past" && typeof body.date === "string" && typeof body.time === "string") {
      at = Date.parse(`${body.date}T${body.time}:00+06:00`) || at;
    }
    const sale = makeSale(st.nextSale++, barberId, ids.filter((x) => services.some((s) => s.id === x)), at, (body.paymentMethod as Sale["paymentMethod"]) ?? "CASH");
    sale.idempotencyKey = key || sale.idempotencyKey;
    sale.enteredByAdmin = path === "/sales/past";
    st.sales.push(sale);
    return ok(sale);
  }
  if (path === "/sales/void-mine" || path === "/sales/admin-void") {
    const sale = st.sales.find((s) => s.id === Number(body.saleId));
    if (!sale) return bad("বিক্রি পাওয়া যায়নি");
    sale.voidedAt = new Date().toISOString();
    sale.voidedBy = path === "/sales/admin-void" ? "ADMIN" : "BARBER";
    sale.voidReason = String(body.reason ?? "");
    return ok(sale);
  }
  if (path === "/payouts" && method === "POST") {
    const p: Payout = {
      id: st.nextId++,
      barberId: Number(body.barberId),
      amount: Number(body.amount) || 0,
      note: String(body.note ?? ""),
      paidAt: typeof body.date === "string" ? new Date(`${body.date}T12:00:00+06:00`).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    st.payouts.push(p);
    return ok(p);
  }
  if ((m = path.match(/^\/payouts\/(\d+)$/)) && method === "DELETE") {
    st.payouts = st.payouts.filter((p) => p.id !== Number(m![1]));
    return ok(null);
  }
  if (path === "/barbers" && method === "POST") {
    const b: Barber = { id: st.nextId++, name: String(body.name ?? "নতুন"), commissionPct: Number(body.commissionPct) || 0, sortOrder: barbers.length + 1, active: true, createdAt: new Date().toISOString() };
    barbers.push(b);
    return ok(b);
  }
  if ((m = path.match(/^\/barbers\/(\d+)$/)) && method === "PATCH") {
    const b = barbers.find((x) => x.id === Number(m![1]));
    if (!b) return bad("পাওয়া যায়নি");
    Object.assign(b, body);
    return ok(b);
  }
  if (path === "/categories" && method === "POST") {
    const c: Category = { id: st.nextId++, name: String(body.name ?? ""), sortOrder: categories.length + 1, active: true };
    categories.push(c);
    return ok(c);
  }
  if ((m = path.match(/^\/categories\/(\d+)$/)) && method === "PATCH") {
    const c = categories.find((x) => x.id === Number(m![1]));
    if (!c) return bad("পাওয়া যায়নি");
    Object.assign(c, body);
    return ok(c);
  }
  if (path === "/services" && method === "POST") {
    const s: Service = { id: st.nextId++, categoryId: Number(body.categoryId), name: String(body.name ?? ""), price: Number(body.price) || 0, sortOrder: services.length + 1, active: true };
    services.push(s);
    return ok(s);
  }
  if ((m = path.match(/^\/services\/(\d+)$/)) && method === "PATCH") {
    const s = services.find((x) => x.id === Number(m![1]));
    if (!s) return bad("পাওয়া যায়নি");
    Object.assign(s, body);
    return ok(s);
  }
  if (path === "/settings" && method === "PATCH") {
    Object.assign(settings, body);
    return ok(settings);
  }
  return { status: 404, body: { ok: false, error: "পাওয়া যায়নি" } };
}
