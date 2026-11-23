// Direct database access for test setup and assertions (Neon over HTTP, no sockets).
// Only ever connects with the DATABASE_URL that env.ts verified is the E2E branch.

import { neon } from "@neondatabase/serverless";
import { loadE2eEnv } from "./env";

type Sql = ReturnType<typeof neon>;
let client: Sql | null = null;
function sql(): Sql {
  loadE2eEnv();
  client ??= neon(process.env.DATABASE_URL!);
  return client;
}

async function rows<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(text, params)) as T[];
}

/** The menu and barbers every test starts from. Names are looked up by name, never by id. */
export const FIXTURE = {
  barbers: [
    { name: "Rahim", pct: 50 },
    { name: "Karim", pct: 40 },
  ],
  category: "Hair",
  services: [
    { name: "Hair Cutting", price: 150 },
    { name: "Beard Trimming", price: 100 },
    { name: "Hair Wash", price: 50 },
  ],
} as const;

/** Deletes all business data on the E2E branch and re-creates the fixture menu. DELETE only. */
export async function resetData(): Promise<void> {
  const s = sql();
  await s.transaction([
    s.query("delete from payouts"),
    s.query("delete from sales"), // sale_items cascade
    s.query("delete from login_attempts"),
    s.query("delete from services"),
    s.query("delete from categories"),
    s.query("delete from barbers"),
  ]);
  await rows("insert into categories (name, sort_order) values ($1, 1)", [FIXTURE.category]);
  const [cat] = await rows<{ id: number }>("select id from categories where name = $1", [FIXTURE.category]);
  for (const [i, b] of FIXTURE.barbers.entries()) {
    await rows("insert into barbers (name, commission_pct, sort_order) values ($1, $2, $3)", [b.name, b.pct, i + 1]);
  }
  for (const [i, v] of FIXTURE.services.entries()) {
    await rows("insert into services (category_id, name, price, sort_order) values ($1, $2, $3, $4)", [cat.id, v.name, v.price, i + 1]);
  }
}

export interface SeedSale {
  barber: string;
  items: { name: string; qty?: number }[];
  at?: Date;
  voided?: boolean;
  enteredByAdmin?: boolean;
}

/** Inserts a sale exactly as the app would store it (snapshots, half-up split). Returns its id. */
export async function seedSale(s: SeedSale): Promise<number> {
  const [barber] = await rows<{ id: number; commission_pct: number }>("select id, commission_pct from barbers where name = $1", [s.barber]);
  const lines = [];
  for (const it of s.items) {
    const [svc] = await rows<{ id: number; name: string; price: number }>("select id, name, price from services where name = $1", [it.name]);
    lines.push({ ...svc, qty: it.qty ?? 1 });
  }
  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const barberShare = Math.round((total * barber.commission_pct) / 100);
  const key = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const at = (s.at ?? new Date()).toISOString();
  const [sale] = await rows<{ id: number }>(
    `insert into sales (idempotency_key, barber_id, total, barber_share, owner_share, commission_pct_snapshot, created_at, voided_at, voided_by, void_reason, entered_by_admin)
     values ($1,$2,$3,$4,$5,$6,$7::timestamptz, $8::timestamptz, $9::voided_by, $10, $11) returning id`,
    [key, barber.id, total, barberShare, total - barberShare, barber.commission_pct, at,
     s.voided ? at : null, s.voided ? "ADMIN" : null, s.voided ? "test" : null, s.enteredByAdmin ?? false],
  );
  for (const l of lines) {
    await rows("insert into sale_items (sale_id, service_id, name_snapshot, price_snapshot, qty) values ($1,$2,$3,$4,$5)", [sale.id, l.id, l.name, l.price, l.qty]);
  }
  return sale.id;
}

export async function saleCount(): Promise<number> {
  const [r] = await rows<{ n: string }>("select count(*) as n from sales");
  return Number(r.n);
}

export async function latestSale(): Promise<{ id: number; total: number; barber_share: number; owner_share: number; price: number } | undefined> {
  return (await rows<{ id: number; total: number; barber_share: number; owner_share: number; price: number }>(
    "select s.id, s.total, s.barber_share, s.owner_share, i.price_snapshot as price from sales s join sale_items i on i.sale_id = s.id order by s.id desc limit 1",
  ))[0];
}

/** Makes a sale look `minutes` older (to cross the 10-minute barber void window without waiting). */
export async function ageSale(id: number, minutes: number): Promise<void> {
  await rows("update sales set created_at = created_at - ($2 * interval '1 minute') where id = $1", [id, minutes]);
}

export async function agePayouts(hours: number): Promise<void> {
  await rows("update payouts set created_at = created_at - ($1 * interval '1 hour')", [hours]);
}

export async function serviceExists(name: string): Promise<boolean> {
  return (await rows("select 1 from services where name = $1", [name])).length > 0;
}

export async function isVoided(id: number): Promise<boolean> {
  const [r] = await rows<{ voided_at: string | null }>("select voided_at from sales where id = $1", [id]);
  return !!r?.voided_at;
}

export async function seedPayout(barber: string, amount: number): Promise<void> {
  const [b] = await rows<{ id: number }>("select id from barbers where name = $1", [barber]);
  await rows("insert into payouts (barber_id, amount, note, paid_at) values ($1, $2, '', now())", [b.id, amount]);
}

export async function payoutCount(): Promise<number> {
  const [r] = await rows<{ n: string }>("select count(*) as n from payouts");
  return Number(r.n);
}

export async function saleItemsOf(id: number): Promise<{ name_snapshot: string; price_snapshot: number }[]> {
  return rows("select name_snapshot, price_snapshot from sale_items where sale_id = $1", [id]);
}

export async function adminEnteredSales(): Promise<{ id: number; created_at: string; total: number }[]> {
  return rows("select id, created_at, total from sales where entered_by_admin = true order by id");
}
