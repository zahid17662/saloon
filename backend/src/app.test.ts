// HTTP-level tests: a real Express server on a random port, a real PGlite database, real fetch calls.
// They prove the pieces the action tests cannot: routes, status codes, the JSON envelope, and the
// session cookies as a browser would see them (Set-Cookie attributes, sending them back).

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: null as any,
}));

vi.mock("@/db", async () => {
  const schema = await import("./db/schema");
  return {
    ...schema,
    get db() {
      return state.db;
    },
  };
});

import { createApp } from "./app";
import { shiftDays, todayKey } from "./lib/time";
import { seedDb } from "./db/seed-core";
import { barbers, categories, services } from "./db/schema";
import { createTestDb, type TestDb } from "./server/test-db";

const SECRET = "http-test-secret-http-test-secret-0123456789";
const PIN = "4321";
const CODE = "9876";

let t: TestDb;
let server: Server;
let base: string;
let ids: { barber: number; svc: number };

beforeAll(async () => {
  process.env.SESSION_SECRET = SECRET;
  t = await createTestDb();
  state.db = t.db;
  await seedDb(t.db, { pin: PIN, shopCode: CODE, bcryptCost: 4 });
  const [b] = await t.db.select().from(barbers).orderBy(barbers.id);
  const [s] = await t.db.select().from(services).orderBy(services.id);
  void categories;
  ids = { barber: b.id, svc: s.id };
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(async () => {
  server.close();
  await t.close();
});

interface Reply {
  status: number;
  body: { ok: boolean; data?: unknown; error?: string };
  setCookie: string[];
  res: Response;
}

async function call(method: string, path: string, opts: { body?: unknown; cookie?: string; raw?: string } = {}): Promise<Reply> {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(opts.body !== undefined || opts.raw !== undefined ? { "content-type": "application/json" } : {}),
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
    },
    body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  });
  const text = await res.clone().text();
  let body = { ok: false } as Reply["body"];
  try {
    body = JSON.parse(text);
  } catch {
    /* not JSON (the backup download is, but keep the helper generic) */
  }
  return { status: res.status, body, setCookie: res.headers.getSetCookie(), res };
}

/** "name=value" pairs from Set-Cookie headers, ready to send back as a Cookie header. */
const jar = (r: Reply) => r.setCookie.map((c) => c.split(";")[0]).join("; ");

describe("HTTP API", () => {
  it("health check needs no login", async () => {
    const r = await call("GET", "/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it("never lets a response be cached", async () => {
    expect((await call("GET", "/health")).res.headers.get("cache-control")).toBe("no-store");
  });

  it("unknown routes and malformed JSON answer with the JSON envelope, not an HTML error page", async () => {
    expect((await call("GET", "/nope")).body.ok).toBe(false);
    const bad = await call("POST", "/auth/unlock", { raw: "{not json" });
    expect(bad.status).toBe(400);
    expect(bad.body.ok).toBe(false);
  });

  it("data endpoints refuse a request with no session (401, nothing leaked)", async () => {
    for (const [m, p] of [
      ["GET", "/catalog"],
      ["GET", "/sales/today-stats"],
      ["GET", "/sales/1"],
      ["GET", "/sales"],
      ["GET", "/payouts"],
      ["GET", "/admin/backup"],
    ] as const) {
      const r = await call(m, p);
      expect(r.status, `${m} ${p}`).toBe(401);
      expect(r.body.ok).toBe(false);
    }
  });

  it("the public shop-name and session endpoints work without a login", async () => {
    const name = await call("GET", "/public/shop-name");
    expect(name.status).toBe(200);
    expect(typeof (name.body.data as { shopName: string }).shopName).toBe("string");
    const s = await call("GET", "/auth/session");
    expect(s.body.data).toEqual({ shop: false, admin: false });
  });

  it("a wrong shop code is refused with a message and sets no cookie", async () => {
    const r = await call("POST", "/auth/unlock", { body: { code: "0000" } });
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
    expect(typeof r.body.error).toBe("string");
    expect(r.setCookie).toEqual([]);
  });

  it("unlock sets a signed HttpOnly SameSite=Lax cookie that opens the shop endpoints", async () => {
    const r = await call("POST", "/auth/unlock", { body: { code: CODE } });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.setCookie).toHaveLength(1);
    const c = r.setCookie[0];
    expect(c).toMatch(/^salon_shop=/);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/SameSite=Lax/i);
    expect(c).toMatch(/Path=\//);
    expect(c).toMatch(/Max-Age=\d+/);

    const cookie = jar(r);
    const cat = await call("GET", "/catalog", { cookie });
    expect(cat.status).toBe(200);
    expect((cat.body.data as { barbers: unknown[] }).barbers.length).toBeGreaterThan(0);
    expect((await call("GET", "/auth/session", { cookie })).body.data).toEqual({ shop: true, admin: false });

    // a shop device is not an admin
    expect((await call("GET", "/payouts", { cookie })).status).toBe(401);
    expect((await call("GET", "/sales", { cookie })).status).toBe(401);
  });

  it("a sale can be created, found, listed in today's stats, and the same key twice makes one sale", async () => {
    const cookie = jar(await call("POST", "/auth/unlock", { body: { code: CODE } }));
    const input = { barberId: ids.barber, items: [{ serviceId: ids.svc, qty: 1 }], paymentMethod: "CASH", idempotencyKey: "http-test-key-0001" };
    const a = await call("POST", "/sales", { body: input, cookie });
    expect(a.status).toBe(200);
    const sale = a.body.data as { id: number; total: number };
    const again = await call("POST", "/sales", { body: input, cookie });
    expect((again.body.data as { id: number }).id).toBe(sale.id);

    const one = await call("GET", `/sales/${sale.id}`, { cookie });
    expect((one.body.data as { id: number }).id).toBe(sale.id);
    expect((await call("GET", "/sales/999999", { cookie })).body.data).toBeNull();

    const stats = (await call("GET", "/sales/today-stats", { cookie })).body.data as { barberId: number; count: number }[];
    expect(stats.find((x) => x.barberId === ids.barber)?.count).toBe(1);
    const mine = (await call("GET", `/sales/barber/${ids.barber}/today`, { cookie })).body.data as unknown[];
    expect(mine).toHaveLength(1);

    const voided = await call("POST", "/sales/void-mine", { body: { saleId: sale.id, barberId: ids.barber, reason: "test" }, cookie });
    expect(voided.status).toBe(200);
  });

  it("bad input is a 400 with a message, never a 500", async () => {
    const cookie = jar(await call("POST", "/auth/unlock", { body: { code: CODE } }));
    const r = await call("POST", "/sales", { body: { barberId: "x" }, cookie });
    expect(r.status).toBe(400);
    expect(r.body.ok).toBe(false);
    expect((await call("GET", "/sales/not-a-number", { cookie })).status).toBe(400);
  });

  it("admin login sets both cookies; admin endpoints and the backup download then work", async () => {
    const wrong = await call("POST", "/auth/login", { body: { pin: "1111" } });
    expect(wrong.status).toBe(400);
    expect(wrong.setCookie).toEqual([]);

    const login = await call("POST", "/auth/login", { body: { pin: PIN } });
    expect(login.status).toBe(200);
    expect(login.setCookie.map((c) => c.split("=")[0]).sort()).toEqual(["salon_admin", "salon_shop"]);
    const cookie = jar(login);

    expect((await call("GET", "/payouts", { cookie })).status).toBe(200);
    const list = await call("GET", `/sales?from=${shiftDays(todayKey(), -30)}&to=${todayKey()}&status=all&barberId=${ids.barber}`, { cookie });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    const backup = await call("GET", "/admin/backup", { cookie });
    expect(backup.status).toBe(200);
    expect(backup.res.headers.get("content-disposition")).toMatch(/attachment; filename="salon-backup-\d{4}-\d{2}-\d{2}\.json"/);
    expect(backup.body).toHaveProperty("barbers");
    expect(JSON.stringify(backup.body)).not.toMatch(/adminPinHash|shopCodeHash/);
  });

  it("delete payout goes through DELETE /payouts/:id and needs the admin", async () => {
    const shop = jar(await call("POST", "/auth/unlock", { body: { code: CODE } }));
    const admin = jar(await call("POST", "/auth/login", { body: { pin: PIN } }));
    const made = await call("POST", "/payouts", { body: { barberId: ids.barber, amount: 10, date: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) }, cookie: admin });
    expect(made.status).toBe(200);
    const id = (made.body.data as { id: number }).id;
    expect((await call("DELETE", `/payouts/${id}`, { cookie: shop })).status).toBe(401);
    expect((await call("DELETE", `/payouts/${id}`, { cookie: admin })).status).toBe(200);
  });

  it("logout expires the admin cookie with the same attributes it was set with", async () => {
    const admin = jar(await call("POST", "/auth/login", { body: { pin: PIN } }));
    const out = await call("POST", "/auth/logout", { cookie: admin });
    expect(out.status).toBe(200);
    const c = out.setCookie.find((x) => x.startsWith("salon_admin="))!;
    expect(c).toMatch(/^salon_admin=;/);
    expect(c).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/Path=\//);
  });

  it("a tampered cookie is not a session", async () => {
    const r = await call("POST", "/auth/unlock", { body: { code: CODE } });
    const cookie = jar(r);
    const tampered = cookie.slice(0, -3) + (cookie.endsWith("AAA") ? "BBB" : "AAA");
    expect((await call("GET", "/catalog", { cookie: tampered })).status).toBe(401);
  });

  it("changing the shop code kills the old device cookie", async () => {
    const device = jar(await call("POST", "/auth/unlock", { body: { code: CODE } }));
    const admin = jar(await call("POST", "/auth/login", { body: { pin: PIN } }));
    expect((await call("GET", "/catalog", { cookie: device })).status).toBe(200);
    const change = await call("POST", "/auth/change-shop-code", { body: { next: "5555" }, cookie: admin });
    expect(change.status).toBe(200);
    expect((await call("GET", "/catalog", { cookie: device })).status).toBe(401);
    const check = await call("POST", "/auth/check", { cookie: device });
    expect(check.body.data).toEqual({ valid: false });
    expect(check.setCookie.some((c) => /^salon_shop=;/.test(c))).toBe(true);
  });
});
