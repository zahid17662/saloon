import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { appointments, barbers, categories, services } from "../db/schema";
import type { AppointmentInput } from "../lib/schemas";
import { bookedTimes, createAppointment, listAppointments, listForBarber, MAX_OPEN_PER_PHONE, publicMenu, setAppointmentStatusAs } from "./appointments";
import { DomainError } from "./errors";
import { createTestDb, type TestDb } from "./test-db";

const NOW = new Date("2026-03-10T06:00:00Z"); // 12:00 Dhaka, Tuesday
const TODAY = "2026-03-10";
const TOMORROW = "2026-03-11";
let t: TestDb;
let BARBER: number;
let BARBER2: number;
let CUT: number;
let SHAVE: number;

const input = (over: Partial<AppointmentInput> = {}): AppointmentInput => ({
  customerName: "করিম",
  phone: "01712345678",
  barberId: BARBER,
  serviceIds: [CUT],
  date: TOMORROW,
  time: "15:00",
  note: "",
  ...over,
});

beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});
beforeEach(async () => {
  await t.db.delete(appointments);
  await t.db.delete(services);
  await t.db.delete(categories);
  await t.db.delete(barbers);
  const [a, b] = await t.db
    .insert(barbers)
    .values([
      { name: "রাকিব", commissionPct: 50 },
      { name: "সুমন", commissionPct: 40 },
    ])
    .returning();
  BARBER = a.id;
  BARBER2 = b.id;
  const [c] = await t.db.insert(categories).values({ name: "চুল" }).returning();
  const [s1, s2] = await t.db
    .insert(services)
    .values([
      { categoryId: c.id, name: "কাট", price: 150 },
      { categoryId: c.id, name: "শেভ", price: 100 },
    ])
    .returning();
  CUT = s1.id;
  SHAVE = s2.id;
});

describe("createAppointment", () => {
  it("books a slot, snapshots names and prices, and totals them", async () => {
    const a = await createAppointment(t.db, input({ serviceIds: [CUT, SHAVE], phone: "+8801712345678" }), NOW);
    expect(a.status).toBe("PENDING");
    expect(a.total).toBe(250);
    expect(a.phone).toBe("01712345678"); // +88 prefix removed
    expect(a.services.map((s) => s.name)).toEqual(["কাট", "শেভ"]);
    expect(a.startsAt).toBe("2026-03-11T09:00:00.000Z"); // 15:00 Dhaka
  });

  it("keeps the booked price even if the service price changes later", async () => {
    const a = await createAppointment(t.db, input(), NOW);
    await t.db.update(services).set({ price: 999 });
    const [row] = await listAppointments(t.db, { from: TOMORROW, to: TOMORROW });
    expect(row.id).toBe(a.id);
    expect(row.total).toBe(150);
  });

  it("rejects the same barber at the same time, but allows another barber or 'any barber'", async () => {
    await createAppointment(t.db, input(), NOW);
    await expect(createAppointment(t.db, input({ phone: "01812345678" }), NOW)).rejects.toThrow(DomainError);
    await expect(createAppointment(t.db, input({ phone: "01812345678", barberId: BARBER2 }), NOW)).resolves.toBeTruthy();
    await expect(createAppointment(t.db, input({ phone: "01912345678", barberId: null }), NOW)).resolves.toBeTruthy();
  });

  it("frees the slot again when the booking is cancelled", async () => {
    const a = await createAppointment(t.db, input(), NOW);
    await setAppointmentStatusAs(t.db, a.id, BARBER, "CANCELLED");
    await expect(createAppointment(t.db, input({ phone: "01812345678" }), NOW)).resolves.toBeTruthy();
  });

  it("rejects times that are not offered, past, or too far ahead", async () => {
    await expect(createAppointment(t.db, input({ time: "15:10" }), NOW)).rejects.toThrow(DomainError);
    await expect(createAppointment(t.db, input({ time: "23:00" }), NOW)).rejects.toThrow(DomainError);
    await expect(createAppointment(t.db, input({ date: TODAY, time: "12:00" }), NOW)).rejects.toThrow(DomainError); // less than 30 min ahead
    await expect(createAppointment(t.db, input({ date: "2026-05-01" }), NOW)).rejects.toThrow(DomainError);
    await expect(createAppointment(t.db, input({ date: TODAY, time: "13:00" }), NOW)).resolves.toBeTruthy();
  });

  it("rejects inactive or unknown services and barbers", async () => {
    await t.db.update(services).set({ active: false });
    await expect(createAppointment(t.db, input(), NOW)).rejects.toThrow(DomainError);
    await t.db.update(services).set({ active: true });
    await expect(createAppointment(t.db, input({ serviceIds: [CUT, 99999] }), NOW)).rejects.toThrow(DomainError);
    await expect(createAppointment(t.db, input({ barberId: 99999 }), NOW)).rejects.toThrow(DomainError);
  });

  it("limits how many open bookings one phone number can hold", async () => {
    for (let i = 0; i < MAX_OPEN_PER_PHONE; i++) {
      await createAppointment(t.db, input({ barberId: null, time: `1${i}:00` }), NOW);
    }
    await expect(createAppointment(t.db, input({ barberId: null, time: "18:00" }), NOW)).rejects.toThrow(DomainError);
  });
});

describe("listing and status", () => {
  it("lists by date range and status, earliest first", async () => {
    await createAppointment(t.db, input({ time: "17:00" }), NOW);
    const early = await createAppointment(t.db, input({ time: "11:00", phone: "01812345678" }), NOW);
    await setAppointmentStatusAs(t.db, early.id, BARBER, "CONFIRMED");
    const all = await listAppointments(t.db, { from: TOMORROW, to: TOMORROW });
    expect(all.map((a) => a.startsAt)).toEqual(["2026-03-11T05:00:00.000Z", "2026-03-11T11:00:00.000Z"]);
    const confirmed = await listAppointments(t.db, { from: TOMORROW, to: TOMORROW, status: "CONFIRMED" });
    expect(confirmed).toHaveLength(1);
    expect(await listAppointments(t.db, { from: TODAY, to: TODAY })).toHaveLength(0);
  });

  it("throws for an unknown appointment", async () => {
    await expect(setAppointmentStatusAs(t.db, 424242, BARBER, "CONFIRMED")).rejects.toThrow(DomainError);
  });
});

describe("the Hairdresser decides", () => {
  it("shows a Hairdresser their own and unassigned bookings, never another one's", async () => {
    const mine = await createAppointment(t.db, input({ time: "11:00" }), NOW);
    const any = await createAppointment(t.db, input({ barberId: null, time: "12:00", phone: "01812345678" }), NOW);
    await createAppointment(t.db, input({ barberId: BARBER2, time: "13:00", phone: "01912345678" }), NOW);
    const list = await listForBarber(t.db, BARBER, NOW);
    expect(list.map((a) => a.id)).toEqual([mine.id, any.id]);
  });

  it("lets only the booked Hairdresser confirm, then finish", async () => {
    const a = await createAppointment(t.db, input(), NOW);
    await expect(setAppointmentStatusAs(t.db, a.id, BARBER2, "CONFIRMED")).rejects.toThrow(DomainError);
    expect((await setAppointmentStatusAs(t.db, a.id, BARBER, "CONFIRMED")).status).toBe("CONFIRMED");
    expect((await setAppointmentStatusAs(t.db, a.id, BARBER, "DONE")).status).toBe("DONE");
    await expect(setAppointmentStatusAs(t.db, a.id, BARBER, "CANCELLED")).rejects.toThrow(DomainError); // finished stays finished
  });

  it("does not jump straight from new to done", async () => {
    const a = await createAppointment(t.db, input(), NOW);
    await expect(setAppointmentStatusAs(t.db, a.id, BARBER, "DONE")).rejects.toThrow(DomainError);
  });

  it("gives an 'any Hairdresser' booking to whoever confirms it, and then it is theirs alone", async () => {
    const a = await createAppointment(t.db, input({ barberId: null }), NOW);
    const done = await setAppointmentStatusAs(t.db, a.id, BARBER2, "CONFIRMED");
    expect(done.barberId).toBe(BARBER2);
    await expect(setAppointmentStatusAs(t.db, a.id, BARBER, "CANCELLED")).rejects.toThrow(DomainError);
  });

  it("refuses to take an 'any' booking when that Hairdresser already has someone at that time", async () => {
    await createAppointment(t.db, input({ barberId: BARBER2 }), NOW);
    const a = await createAppointment(t.db, input({ barberId: null, phone: "01812345678" }), NOW);
    await expect(setAppointmentStatusAs(t.db, a.id, BARBER2, "CONFIRMED")).rejects.toThrow(DomainError);
  });
});

describe("public data", () => {
  it("lists taken start times for a barber on a day, in Dhaka time", async () => {
    await createAppointment(t.db, input({ time: "15:00" }), NOW);
    await createAppointment(t.db, input({ time: "10:00", phone: "01812345678" }), NOW);
    expect((await bookedTimes(t.db, TOMORROW, BARBER)).sort()).toEqual(["10:00", "15:00"]);
    expect(await bookedTimes(t.db, TOMORROW, BARBER2)).toEqual([]);
  });

  it("the public menu hides commission and inactive items", async () => {
    await t.db.update(services).set({ active: false }).where(eq(services.id, SHAVE));
    const menu = await publicMenu(t.db);
    expect(menu.services.map((s) => s.name)).toEqual(["কাট"]);
    expect(JSON.stringify(menu)).not.toMatch(/commission/i);
    expect(menu.barbers.every((b) => Object.keys(b).sort().join() === "id,name")).toBe(true);
  });
});
