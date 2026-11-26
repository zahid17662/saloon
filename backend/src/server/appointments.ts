// Customer appointments. Customers book without an account (name + phone); the Hairdresser confirms or
// cancels (the admin only sees them). A barber cannot be double-booked at the same start time: a partial unique index enforces it,
// so two customers racing for one slot cannot both win. Prices are snapshotted into the booking.

import { and, asc, eq, gte, inArray, isNull, lt, ne, or } from "drizzle-orm";
import { appointments, barbers, categories, services } from "../db/schema";
import { resolveSlot } from "../lib/booking";
import type { AppointmentInput, AppointmentsQuery } from "../lib/schemas";
import { dhakaDayStart, todayKey } from "../lib/time";
import type { Appointment, AppointmentStatus } from "../lib/types";
import type { Db } from "./db-types";
import { DomainError } from "./errors";
import { getSettings } from "./catalog";

const MSG = {
  noBarber: "এই barber পাওয়া যায়নি",
  noService: "বেছে নেওয়া সেবা এখন পাওয়া যাচ্ছে না",
  slotTaken: "এই সময়টি আগেই বুক হয়ে গেছে, অন্য সময় বেছে নিন",
  noAppointment: "অ্যাপয়েন্টমেন্ট পাওয়া যায়নি",
  notYours: "এই বুকিং অন্য Hairdresser-এর",
  badMove: "এই বুকিংয়ের অবস্থা আর বদলানো যাবে না",
  clash: "এই সময়ে আপনার আরেকটি বুকিং আছে",
} as const;

/** Each customer phone may hold only a few open future bookings, so one person cannot flood the book. */
export const MAX_OPEN_PER_PHONE = 3;
const TOO_MANY = "এই নম্বর দিয়ে এখনই আর বুকিং নেওয়া যাচ্ছে না, দোকানে ফোন করুন";

type Row = typeof appointments.$inferSelect;
const toAppointment = (r: Row): Appointment => ({
  id: r.id,
  customerName: r.customerName,
  phone: r.phone,
  barberId: r.barberId,
  services: r.services,
  total: r.total,
  startsAt: r.startsAt.toISOString(),
  note: r.note,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
});

function isUniqueViolation(e: unknown): boolean {
  for (let cur: unknown = e, depth = 0; cur && depth < 4; depth++) {
    if (typeof cur === "object" && (cur as { code?: unknown }).code === "23505") return true;
    cur = (cur as { cause?: unknown } | null)?.cause;
  }
  return false;
}

/** Phone numbers are stored as 01XXXXXXXXX (no +88 / 88 prefix). */
export const normalizePhone = (p: string) => p.replace(/^\+?88/, "");

export async function createAppointment(db: Db, input: AppointmentInput, now: Date = new Date()): Promise<Appointment> {
  const slot = resolveSlot(input.date, input.time, now);
  if (!slot.ok) throw new DomainError(slot.error);
  const phone = normalizePhone(input.phone);

  const picked = await db
    .select({ id: services.id, name: services.name, price: services.price })
    .from(services)
    .innerJoin(categories, eq(categories.id, services.categoryId))
    .where(and(inArray(services.id, input.serviceIds), eq(services.active, true), eq(categories.active, true)));
  if (picked.length !== input.serviceIds.length) throw new DomainError(MSG.noService);

  if (input.barberId != null) {
    const [b] = await db.select({ id: barbers.id }).from(barbers).where(and(eq(barbers.id, input.barberId), eq(barbers.active, true)));
    if (!b) throw new DomainError(MSG.noBarber);
  }

  const open = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.phone, phone), inArray(appointments.status, ["PENDING", "CONFIRMED"]), gte(appointments.startsAt, now)));
  if (open.length >= MAX_OPEN_PER_PHONE) throw new DomainError(TOO_MANY);

  const snapshot = input.serviceIds.map((id) => {
    const s = picked.find((x) => x.id === id)!;
    return { serviceId: s.id, name: s.name, price: s.price };
  });
  try {
    const [row] = await db
      .insert(appointments)
      .values({
        customerName: input.customerName,
        phone,
        barberId: input.barberId ?? null,
        services: snapshot,
        total: snapshot.reduce((n, s) => n + s.price, 0),
        startsAt: slot.startsAt,
        note: input.note,
        status: "PENDING",
        createdAt: now,
      })
      .returning();
    return toAppointment(row);
  } catch (e) {
    if (isUniqueViolation(e)) throw new DomainError(MSG.slotTaken);
    throw e;
  }
}

/** Admin list, oldest start first. `from` / `to` are Dhaka date keys, both inclusive. */
export async function listAppointments(db: Db, q: AppointmentsQuery): Promise<Appointment[]> {
  const start = dhakaDayStart(q.from);
  const end = new Date(dhakaDayStart(q.to).getTime() + 24 * 3600_000);
  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        gte(appointments.startsAt, start),
        lt(appointments.startsAt, end),
        q.status && q.status !== "all" ? eq(appointments.status, q.status) : undefined,
      ),
    )
    .orderBy(asc(appointments.startsAt), asc(appointments.id));
  return rows.map(toAppointment);
}

/** A Hairdresser's open bookings from today on: their own, plus "any Hairdresser" ones nobody has taken yet. */
export async function listForBarber(db: Db, barberId: number, now: Date = new Date()): Promise<Appointment[]> {
  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        gte(appointments.startsAt, dhakaDayStart(todayKey(now))),
        inArray(appointments.status, ["PENDING", "CONFIRMED"]),
        or(eq(appointments.barberId, barberId), isNull(appointments.barberId)),
      ),
    )
    .orderBy(asc(appointments.startsAt), asc(appointments.id));
  return rows.map(toAppointment);
}

const MOVES: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DONE", "CANCELLED"],
  CANCELLED: [],
  DONE: [],
};

/**
 * The Hairdresser decides: confirm or cancel a new booking, then mark it done. Only the booked
 * Hairdresser may touch it; an "any Hairdresser" booking goes to whoever confirms it first.
 */
export async function setAppointmentStatusAs(db: Db, id: number, barberId: number, status: Exclude<AppointmentStatus, "PENDING">): Promise<Appointment> {
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!row) throw new DomainError(MSG.noAppointment);
  if (row.barberId != null && row.barberId !== barberId) throw new DomainError(MSG.notYours);
  if (!MOVES[row.status].includes(status)) throw new DomainError(MSG.badMove);
  const takeIt = row.barberId == null && status === "CONFIRMED";
  try {
    const [done] = await db
      .update(appointments)
      .set(takeIt ? { status, barberId } : { status })
      .where(and(eq(appointments.id, id), eq(appointments.status, row.status)))
      .returning();
    if (!done) throw new DomainError(MSG.badMove); // someone else changed it a moment ago
    return toAppointment(done);
  } catch (e) {
    if (isUniqueViolation(e)) throw new DomainError(MSG.clash);
    throw e;
  }
}

/** "HH:MM" start times already taken on a Dhaka day for one barber (public, so customers can skip them). */
export async function bookedTimes(db: Db, date: string, barberId: number): Promise<string[]> {
  const start = dhakaDayStart(date);
  const end = new Date(start.getTime() + 24 * 3600_000);
  const rows = await db
    .select({ startsAt: appointments.startsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.barberId, barberId),
        ne(appointments.status, "CANCELLED"),
        ne(appointments.status, "DONE"),
        gte(appointments.startsAt, start),
        lt(appointments.startsAt, end),
      ),
    );
  return rows.map((r) => new Date(r.startsAt.getTime() + 6 * 3600_000).toISOString().slice(11, 16));
}

export interface PublicMenu {
  shop: { name: string; address: string; phone: string };
  categories: { id: number; name: string }[];
  services: { id: number; categoryId: number; name: string; price: number }[];
  barbers: { id: number; name: string }[];
}

/** Everything a customer may see: active items only, and never commission or any internal field. */
export async function publicMenu(db: Db): Promise<PublicMenu> {
  const [settings, cats, svcs, bars] = await Promise.all([
    getSettings(db),
    db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder), asc(services.id)),
    db.select().from(barbers).where(eq(barbers.active, true)).orderBy(asc(barbers.sortOrder), asc(barbers.id)),
  ]);
  const activeCats = new Set(cats.map((c) => c.id));
  return {
    shop: { name: settings.shopName, address: settings.shopAddress, phone: settings.shopPhone },
    categories: cats.map((c) => ({ id: c.id, name: c.name })),
    services: svcs.filter((s) => activeCats.has(s.categoryId)).map((s) => ({ id: s.id, categoryId: s.categoryId, name: s.name, price: s.price })),
    barbers: bars.map((b) => ({ id: b.id, name: b.name })),
  };
}
