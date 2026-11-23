# PRD — Salon Service & Barber Commission System

| | |
|---|---|
| **Document** | Product Requirements Document |
| **Version** | 1.1 |
| **Date** | 2026-11-23 |
| **Status** | Frontend complete · backend in progress |
| **Stack** | Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · **Drizzle ORM** · **Neon Postgres** · Vercel |

### Changelog
- **1.1**: ORM changed from Prisma to **Drizzle** (`drizzle-orm` + `drizzle-kit` + `@neondatabase/serverless`). Added §0 Implementation status, FR-22 (back-dated sale entry) and §17 Definition of Done for client handover.
- **1.0**: Initial PRD.

---

## 0. Implementation status

| Area | Status | Notes |
|---|---|---|
| All screens in §11 | ✅ Done | Light pastel theme (Poppins + Hind Siliguri), mobile-first |
| Domain logic | ✅ Done | `src/lib/money.ts`, `time.ts`, `reports.ts`, with 16 Vitest tests |
| Data layer | ⚠️ Temporary | `src/lib/store.ts` keeps data in the browser's localStorage. Every exported action there maps 1:1 to a future Server Action, and must be replaced by Drizzle + Neon. |
| Auth | ✅ Done (server-side) | HMAC-signed httpOnly cookies, bcrypt, `login_attempts` rate limit (5 / 15 min per IP network + a global cap), `proxy.ts` redirects and the Server Actions `unlockShop`, `loginAdmin`, `logoutAdmin`, `changeAdminPin`, `changeShopCode` in `src/app/actions/auth.ts`. The remaining `store.ts` actions must call `requireAdmin()` / `requireShop()` from `src/lib/auth.ts` when they become Server Actions. The demo PIN `0000` and shop code `1234` are still set in the dev DB: change them before launch. |
| Drizzle setup | ✅ Done | Prisma removed. `src/db/schema.ts`, `src/db/index.ts` (neon-serverless Pool, `server-only`), `drizzle.config.ts`, first migration `src/db/migrations/0000_*.sql`. Migration `0001` adds `sales.entered_by_admin` plus integrity CHECK constraints, and `npm run db:seed` (idempotent) seeds the menu, barbers and settings. |
| Database | ✅ Dev done | Migrations `0000` and `0001` are applied to the Neon `dev` branch and it is seeded. Neon `main` is not migrated or seeded yet. |
| Sales (create, void, list, receipt) | ✅ Done on Neon | `src/server/sales.ts` (+ PGlite tests) behind the Server Actions in `src/app/actions/sales.ts`. The server prices and splits every sale (FR-8), snapshots name, price and commission %, enforces the idempotency key, the barber's 10-minute void rule (never for admin-entered sales) and the admin void reason. Home, barber and receipt pages are server components reading Neon. Exports and settings still read `store.ts` (localStorage) until phase 6. |
| FR-22 back-dated sale | ✅ Done | Admin-only "পুরনো বিক্রি যোগ করুন" on `/admin/sales`. `resolveBackdate` (`src/lib/backdate.ts`) allows today back to 60 days Asia/Dhaka and never the future; the server action re-checks with its own clock and alone sets `entered_by_admin`. The sales list shows a "পুরনো এন্ট্রি" badge. `periodTotals` (`src/server/reports.ts`) buckets by Dhaka day and is tested against the `reports.ts` oracle. The dashboard and reports screens will count these sales once phase 5 moves them to SQL. |
| Payouts, balances, dashboard, reports | ✅ Done on Neon | `src/server/payouts.ts` (SQL balances, 24 h delete in the DELETE, 30 s duplicate guard) behind admin-only Server Actions; the dashboard and reports load sales windows through `listSales` and compute with the pure `reports.ts` functions (not SQL aggregates). CSV/JSON export and settings still use `store.ts` (phase 6). |
| Playwright E2E | ✅ 34/34 passing | `e2e/` against `npm run build && npm start` on a dedicated Neon branch (`.env.test`, never main), mobile 375px and desktop. Covers sale + receipt + split, double tap, barber void window, admin login rate limit, reports, payout and balance, add barber/service, price snapshot and FR-22. Run with `npm run test:e2e`. |
| Git, CI, deploy | ⚠️ Partial | Git repo initialised with a first commit. No remote, CI or Vercel deploy yet. |

---

## 1. Summary

A mobile-first web app for a single barber shop. Each barber picks their name, taps the services they did for a customer, and saves the sale. The system splits every sale between the barber and the shop owner (default **50% / 50%**), prints a receipt, and gives the owner (admin) daily and monthly accounts, barber payout tracking, and control over barbers, services and prices.

Today this is done by hand or from memory. That leads to disputes over what each barber earned, lost revenue, and no reliable daily or monthly totals.

## 2. Goals and non-goals

### Goals
1. A barber can record a sale in **under 15 seconds** on a phone (≤ 3 taps for a single-service sale).
2. The barber/owner split is calculated automatically and **never changes after the fact** when prices change.
3. The owner can see today's and this month's revenue, owner share, and each barber's earnings at any time, from anywhere.
4. The owner can track how much is owed to each barber (earned − paid).
5. The owner can add barbers and edit services and prices without a developer.

### Non-goals (v1)
- Online booking or appointments for customers.
- Customer accounts, loyalty points or SMS.
- Inventory or product sales (shampoo, etc.).
- Online payments (bKash/Nagad gateway). Payment method is only *recorded*, not processed.
- Multiple branches (the data model leaves room for it; see §14).
- Shop expenses (rent, electricity).

## 3. Users and roles

| Role | Who | Access | Auth |
|---|---|---|---|
| **Shop device** | Any phone/PC that has entered the shop code once | Barber screens and receipts | Shop access code → long-lived signed cookie |
| **Barber** (নাপিত) | Staff who serve customers | Pick own name, record sales, see own day summary, fix own recent mistake | None beyond shop device (picks name) |
| **Admin** (owner) | Shop owner/manager | Everything | Admin PIN → short-lived signed cookie |

> **Accepted risk:** barbers don't have their own PIN, so on a shop device one barber could record a sale under another's name. Mitigations: every sale is listed in admin with time, and only the admin can void old sales. Per-barber PINs are a v2 option (§14).

## 4. User stories

**Barber**
- B1. As a barber, I pick my name from a list so the sale is credited to me.
- B2. I see services grouped by category with prices and tap one or more to add them to the current customer.
- B3. I can change quantity (e.g. Hair Highlight *per step* × 3) and remove items before saving.
- B4. Before saving I see the total and **my share**.
- B5. After saving I get a receipt I can print or show the customer.
- B6. I can see how many customers I served today and what I earned today.
- B7. If I saved a wrong entry, I can cancel it myself within **10 minutes**.

**Admin**
- A1. Log in with a PIN.
- A2. Dashboard: today's total sales, owner share, barber share, sale count, per-barber breakdown.
- A3. Daily and monthly reports with a date range filter and CSV export.
- A4. Add, rename and deactivate barbers; set each barber's commission % (default 50).
- A5. Add, edit, reorder and deactivate categories and services; change prices.
- A6. See every sale and void any sale (with a reason).
- A7. Record a payment to a barber and see each barber's balance owed.
- A8. Change shop name, admin PIN, shop access code and receipt footer.
- A9. Reprint any past receipt.

## 5. Functional requirements

### 5.1 Access
- **FR-1** On first visit, a device without a valid shop cookie is sent to `/unlock` to enter the shop access code. On success, set an httpOnly, Secure, SameSite=Lax signed cookie valid for 180 days.
- **FR-2** `/admin/*` routes require a valid admin cookie (8-hour expiry); otherwise redirect to `/admin/login`.
- **FR-3** After 5 wrong PIN/code attempts from one IP, block further attempts for 15 minutes.
- **FR-4** Authorization is enforced **server-side in every Server Action and Route Handler**. `proxy.ts` only does convenience redirects.

### 5.2 Barber flow
- **FR-5** `/` lists active barbers as large cards, in `sortOrder`.
- **FR-6** `/barber/[id]` shows category tabs and service tiles (name + price). Only active services are shown.
- **FR-7** The cart supports add, quantity +/− (1–20) and remove. It shows the live total, the barber share, and an optional payment method (নগদ/Cash, বিকাশ/bKash, নগদ/Nagad, অন্যান্য/Other; default Cash).
- **FR-8** On **সেভ**, the server re-reads prices from the DB (never trusts client prices), computes the split, and writes `Sale` + `SaleItem` rows in **one transaction**. The client then goes to the receipt.
- **FR-9** A double-tap must not create two sales. The client sends an idempotency key (UUID per cart) that is unique on `Sale`.
- **FR-10** The barber page shows today's sale count and today's barber earnings (Asia/Dhaka day).
- **FR-11** A barber can void their own sale only within 10 minutes of creation. After that, only the admin can.

### 5.3 Receipt
- **FR-12** `/receipt/[id]` shows the shop name, receipt no., date/time (Asia/Dhaka), barber name, items (name × qty, line total), grand total, payment method and footer text. A voided sale shows "বাতিল / VOID".
- **FR-13** Print CSS works for **58 mm and 80 mm thermal** printers and A4. The print button calls `window.print()`. Admin settings choose the default paper width.
- **FR-14** The receipt shows **only the total to the customer**, never the barber/owner split.

### 5.4 Admin
- **FR-15 Dashboard**: cards for total sales, owner share, barber share, number of sales and number of services; a per-barber table. Filter: আজ (today) / গতকাল (yesterday) / এই মাস (this month) / custom range.
- **FR-16 Reports**:
  - *Daily*: one row per day × barber: sales count, service count, gross total, barber share, owner share.
  - *Monthly*: same, grouped by month.
  - *By service*: count and revenue per service (shows which services sell).
  - CSV export of any report (UTF-8 with BOM so Excel shows Bangla correctly).
- **FR-17 Barbers**: create (name required, unique among active), rename, set commission % (0–100, integer), set sort order, deactivate/reactivate. Barbers with sales are **never hard-deleted**.
- **FR-18 Services**: CRUD for categories and services; price is a positive integer in taka; deactivate instead of delete once a service has been sold.
- **FR-19 Sales**: paginated list (newest first) with filters for date range, barber and status. Void requires a reason; records `voidedAt`, `voidedBy` (barber/admin) and `voidReason`.
- **FR-20 Payouts**: a per-barber card showing *earned* (Σ barberShare of non-voided sales), *paid* (Σ payouts) and *balance* (earned − paid). Add a payout (amount, date, note); a payout can be deleted only within 24 h (to fix mistakes); full history.
- **FR-21 Settings**: shop name, shop address/phone (for the receipt), receipt footer, default paper width, change admin PIN (requires the current PIN), change shop code (all shop devices must re-enter it; done by bumping a `shopCodeVersion` that is embedded in the cookie).

- **FR-22 Back-dated sale (admin only)**: the admin can enter a sale with a past date and time (e.g. copied from the paper notebook) by choosing the barber, services and date. Allowed range: today back to 60 days. The sale is flagged `entered_by_admin` and appears in reports for the chosen day. It cannot be dated in the future.

## 6. Business rules

| ID | Rule |
|---|---|
| **BR-1** | `barberShare = round(total × commissionPct / 100)`, `ownerShare = total − barberShare`. Integer taka. `Math.round` half-up. The two shares always add up exactly to the total. |
| **BR-2** | The commission % is taken from the barber **at the moment of sale** and stored on the sale (`commissionPctSnapshot`). Changing a barber's % affects only future sales. |
| **BR-3** | Service name and price are **snapshotted** into `SaleItem`. Price edits never change past sales or reports. |
| **BR-4** | Voided sales are excluded from every total, report and payout balance, but stay visible in the sales list. |
| **BR-5** | All "day" and "month" boundaries use **Asia/Dhaka (UTC+6)**. Timestamps are stored in UTC (`timestamptz`) and converted for display and grouping. This is required because Vercel servers run in UTC. |
| **BR-6** | Receipt numbers are sequential and gap-tolerant (a DB identity column). Shown as `R-000123`. |
| **BR-7** | A payout can make the balance negative (an advance to the barber). The UI shows it as "অগ্রিম" (advance). |
| **BR-8** | Money is an integer number of taka everywhere (no floats in the DB). |

## 7. Initial data (seed)

From the shop's current price list:

| Category | Service | ৳ |
|---|---|---|
| Hair Cutting | Hair Cutting | 150 |
| | Hair Wash | 50 |
| | Beard Trimming | 100 |
| | Hair Setup | 100 |
| Hair Color | Hair Shining | 400 |
| | Hair Color Black Revlon | 600 |
| | Hair Color Brown | 600 |
| | Hair Color Begin | 600 |
| | Hair Highlight Color (per step) | 200 |
| Facial | Brightening Facial | 300 |
| | Gold Facial | 600 |
| | Diamond Facial | 700 |
| | Silver Facial | 600 |
| | Acme Facial | 600 |
| | Fruit Facial | 600 |
| | Hydra Facial (mini) | 1200 |
| | Hydra Facial (full) | 1800 |
| Hair Treatment | Hair Treatment | 600 |
| | Hair Spa | 600 |
| | Hair Straight | 2000 |
| | Hair Rebonding | 2500 |
| Body Massage Chair | 10 Minute | 100 |
| | 20 Minute | 200 |
| | 30 Minute | 250 |
| | 60 Minute | 400 |

Barbers: নাপিত ১, নাপিত ২, নাপিত ৩ (50% each). The initial admin PIN and shop code are read from env vars `SEED_ADMIN_PIN` / `SEED_SHOP_CODE` at seed time and must be changed after first login.

> Check with the owner: "Hair Color Begin" is probably *Beige*, and "Hair stret" was typed as *Straight*. Both can be renamed in admin.

## 8. Data model (Drizzle ORM, Neon Postgres)

The schema lives in `src/db/schema.ts`. Its field names and types match `src/lib/types.ts`, which the frontend already uses, so the UI doesn't change. Table names are snake_case plural, and TS columns are camelCase mapped to snake_case DB columns.

```ts
// src/db/schema.ts
import { pgTable, pgEnum, serial, integer, text, boolean, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const tz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const paymentMethod = pgEnum("payment_method", ["CASH", "BKASH", "NAGAD", "OTHER"]);
export const voidedBy = pgEnum("voided_by", ["BARBER", "ADMIN"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  price: integer("price").notNull(),                     // whole taka
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
}, (t) => [index("services_category_idx").on(t.categoryId), check("price_positive", sql`${t.price} > 0`)]);

export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  commissionPct: integer("commission_pct").notNull().default(50),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: tz("created_at").notNull().defaultNow(),
}, (t) => [check("pct_range", sql`${t.commissionPct} between 0 and 100`)]);

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),                          // also the receipt number
  idempotencyKey: text("idempotency_key").notNull(),
  barberId: integer("barber_id").notNull().references(() => barbers.id),
  total: integer("total").notNull(),
  barberShare: integer("barber_share").notNull(),
  ownerShare: integer("owner_share").notNull(),
  commissionPctSnapshot: integer("commission_pct_snapshot").notNull(),
  paymentMethod: paymentMethod("payment_method").notNull().default("CASH"),
  createdAt: tz("created_at").notNull().defaultNow(),
  voidedAt: tz("voided_at"),
  voidedBy: voidedBy("voided_by"),
  voidReason: text("void_reason"),
  enteredByAdmin: boolean("entered_by_admin").notNull().default(false),   // FR-22 back-dated entry
}, (t) => [
  uniqueIndex("sales_idempotency_uq").on(t.idempotencyKey),
  index("sales_created_idx").on(t.createdAt),
  index("sales_barber_created_idx").on(t.barberId, t.createdAt),
  check("shares_sum", sql`${t.barberShare} + ${t.ownerShare} = ${t.total}`),
]);

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => services.id),
  nameSnapshot: text("name_snapshot").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  qty: integer("qty").notNull(),
}, (t) => [index("sale_items_sale_idx").on(t.saleId), check("qty_range", sql`${t.qty} between 1 and 20`)]);

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id),
  amount: integer("amount").notNull(),
  note: text("note").notNull().default(""),
  paidAt: tz("paid_at").notNull().defaultNow(),
  createdAt: tz("created_at").notNull().defaultNow(),
}, (t) => [index("payouts_barber_idx").on(t.barberId), check("amount_positive", sql`${t.amount} > 0`)]);

// shopName, shopAddress, shopPhone, receiptFooter, paperWidth, adminPinHash, shopCodeHash, shopCodeVersion
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  kind: text("kind").notNull(),                           // "admin" | "shop"
  createdAt: tz("created_at").notNull().defaultNow(),
}, (t) => [index("login_attempts_lookup_idx").on(t.ip, t.kind, t.createdAt)]);
```

**Rules**
- Money columns are `integer` taka (BR-8). DB `CHECK` constraints back up the app validation, including `barber_share + owner_share = total` (BR-1).
- All timestamps are `timestamptz` (BR-5).
- Reports run as SQL aggregates through Drizzle's `sql` template, e.g. `GROUP BY date_trunc('day', created_at AT TIME ZONE 'Asia/Dhaka'), barber_id`, never JS loops over all rows. The pure functions in `src/lib/reports.ts` stay as the reference implementation and test oracle.
- **Use only parameterized queries.** Never build SQL by string concatenation; always use Drizzle's `sql` template tags.

## 9. Architecture

```
Phone / PC browser
      │  HTTPS
      ▼
Vercel (Next.js 16)
  ├─ proxy.ts ............ redirect if shop/admin cookie missing (optimistic only)
  ├─ Server Components ... read pages (dashboard, reports, service grid)
  ├─ Server Actions ...... all writes; each calls requireShop()/requireAdmin()
  ├─ Route Handlers ...... /api/reports/export (CSV)
  ├─ db/
  │    ├─ schema.ts ..... Drizzle tables (§8)
  │    ├─ index.ts ...... `db` = drizzle(neon Pool) — server-only (`import "server-only"`)
  │    ├─ seed.ts ....... seeds §7 data (reuses src/lib/seed.ts)
  │    └─ migrations/ ... generated by drizzle-kit, committed to git
  └─ lib/
       ├─ auth.ts ....... HMAC-signed cookies (node:crypto), bcrypt verify, rate limit
       ├─ money.ts ...... split calculation, ৳ formatting, Bangla digits
       └─ time.ts ....... Asia/Dhaka day/month ranges
      │  pooled connection (Neon serverless driver over WebSocket)
      ▼
Neon Postgres
  ├─ branch "main" ... production
  └─ branch "dev" .... development / testing (copy-on-write from main)
```

### Neon-specific decisions
- **Driver.** Use `drizzle-orm/neon-serverless` with `Pool` from `@neondatabase/serverless`. It supports real interactive transactions, which saving a sale (FR-8) and changing the shop code need; the `neon-http` driver doesn't. Check the current Drizzle + Neon docs before wiring this up, because the APIs change.
- **Two connection strings.** `DATABASE_URL` = pooled (`…-pooler.…neon.tech/…?sslmode=require`) for the app at runtime. `DIRECT_URL` = non-pooled, used only by `drizzle-kit` (in `drizzle.config.ts`) for migrations.
- **Branches.** Develop against a `dev` branch, never production. Reset `dev` from `main` whenever realistic data is needed for testing.
- **Region.** Create the Neon project and set the Vercel function region close together (e.g. Neon *AWS ap-southeast-1 Singapore* with Vercel `sin1`) for the lowest latency from Bangladesh.
- **Cold start.** Free-tier compute suspends when idle, so the first request after idle can take ~1–2 s. That's acceptable; the UI shows a loading state.
- **Backup.** Rely on Neon's point-in-time restore (the restore window depends on plan), plus a manual admin "Export all data (CSV)" button as an owner-controlled backup.
- **Migrations.** `drizzle-kit generate` creates SQL files in `src/db/migrations/`. They are reviewed and committed, never edited after being applied. `drizzle-kit migrate` applies them. Scripts: `db:generate`, `db:migrate`, `db:seed`, `db:studio`. Production migrations run in the Vercel build step (`"build": "drizzle-kit migrate && next build"`). `drizzle-kit push` is never used against `main`.
- **Leftover Prisma tables.** The earlier Prisma attempt may have created tables and a `_prisma_migrations` table in Neon. Before the first Drizzle migration, reset the Neon `dev` branch (or create a fresh one) so Drizzle starts from an empty database. Do this only with the owner's confirmation; never drop tables on `main` without a backup.

### Environment variables
| Var | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Vercel + local `.env` | Neon pooled |
| `DIRECT_URL` | Vercel + local `.env` | Neon direct |
| `SESSION_SECRET` | Vercel + local `.env` | ≥ 32 random bytes |
| `SEED_ADMIN_PIN`, `SEED_SHOP_CODE` | local only, at seed time | Not needed at runtime |

`.env` is git-ignored; `.env.example` documents the format.

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** | Barber page interactive in < 2 s on a mid-range Android over 4G (warm DB). Saving a sale < 1 s server time. |
| **Usability** | Bangla-first UI (Hind Siliguri font), service names kept in English as on the shop menu. Touch targets ≥ 48 px. Works one-handed on a 360 px wide screen. |
| **Security** | PIN/code hashed with bcrypt (cost 10). Signed httpOnly cookies. Server-side validation of all input (zod). Prices are always computed on the server. No secrets in client bundles (`src/db/*` and `src/lib/auth.ts` import `server-only`). Drizzle parameterized queries only. Security headers (CSP, `X-Frame-Options`, `Referrer-Policy`) set in `next.config.ts`. |
| **Reliability** | Sale write is a single DB transaction. Idempotency key prevents duplicates. |
| **Data integrity** | No hard deletes of barbers, services or sales that are referenced by history. |
| **Availability** | Vercel + Neon free tiers; no SLA in v1. |
| **Browser support** | Latest Chrome on Android, Chrome/Edge on Windows. |
| **Accessibility** | Sufficient contrast, labelled buttons, keyboard-usable admin forms. |

## 11. Screens

| Route | Role | Purpose |
|---|---|---|
| `/unlock` | — | Enter shop access code |
| `/` | Shop | Barber picker |
| `/barber/[id]` | Shop | Service grid, cart, save, today's summary, recent sales (void ≤ 10 min) |
| `/receipt/[id]` | Shop | Printable receipt |
| `/admin/login` | — | Admin PIN |
| `/admin` | Admin | Dashboard |
| `/admin/reports` | Admin | Daily / monthly / by-service reports, CSV |
| `/admin/sales` | Admin | Sales list, void, reprint |
| `/admin/payouts` | Admin | Balances, add payout, history |
| `/admin/barbers` | Admin | Manage barbers and commission % |
| `/admin/services` | Admin | Manage categories, services, prices |
| `/admin/settings` | Admin | Shop info, PIN, shop code, receipt, data export |

## 12. Acceptance criteria (v1 done when…)

1. নাপিত ১ adds Hair Cutting (150) + Beard Trimming (100) and saves → receipt shows ৳250; the admin dashboard shows barber ৳125 and owner ৳125.
2. A sale of ৳50 at 45% → barber ৳23 (22.5 rounded half-up), owner ৳27; the shares add up to the total.
3. Admin changes the Hair Cutting price to 200 → the old receipt and reports still show 150; new sales use 200.
4. Admin changes নাপিত ২ to 60% → only sales after the change use 60%.
5. Admin adds "নাপিত ৪" → it appears on the barber picker immediately.
6. Voiding a sale removes it from the dashboard, reports and payout balance; it still appears in the sales list as VOID.
7. A sale at 23:50 Dhaka time on the 30th appears under the 30th, not the 31st (UTC) and not the 29th.
8. Earned ৳3,000, payout ৳2,000 → balance ৳1,000; another payout of ৳1,500 → shows ৳500 অগ্রিম.
9. Double-tapping সেভ creates exactly one sale.
10. Calling any admin Server Action without the admin cookie fails with an authorization error.
11. A device without the shop cookie cannot open `/` or `/barber/*`.
12. The CSV export opens in Excel with Bangla text readable.
13. The receipt prints correctly on an 80 mm preview without the split showing.
14. `npm run build` and `npm test` pass; the app is deployed on Vercel against the Neon `main` branch.

## 13. Delivery plan

| Milestone | Scope |
|---|---|
| **M0 Repo hygiene** | `git init`, `.env.example`, remove Prisma, CLAUDE.md, first commit |
| **M1 Foundation** | Drizzle + Neon (dev branch): `src/db/schema.ts`, `drizzle.config.ts`, first migration, seed, DB-level tests |
| **M2 Access** | Shop code unlock, admin PIN login, signed cookies, rate limiting, `proxy.ts` |
| **M3 Barber flow** | Picker, service grid, cart, save (transaction + idempotency), receipt + print CSS, self-void |
| **M4 Admin core** | Dashboard, sales list/void, barbers, services |
| **M5 Money** | Reports (daily/monthly/by-service), CSV, payouts and balances |
| **M6 Ship** | FR-22, settings, E2E tests (Playwright), security review, production audit, Vercel deploy on Neon `main`, Bangla README for the owner |

## 14. Future (v2+)
- Per-barber PIN (stops entries under someone else's name).
- Shop expenses → real profit report.
- Customer phone number + SMS receipt / visit history.
- Multi-branch (`shopId` on every table).
- Offline queue (PWA) for when the shop's internet is down.
- Charts on the dashboard (trend per day).

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Shop internet goes down | Sales can't be recorded | v1: write on paper and enter later (admin can set a sale's date); v2: PWA offline queue |
| Barber records a sale under another name | Wrong commission | Sales log visible to admin; per-barber PIN in v2 |
| Neon free-tier limits exceeded | DB suspended or slowed | Data volume is tiny (≈100 sales/day); check limits on the Neon dashboard monthly; upgrade if needed |
| Neon cold start | ~1–2 s first load | Loading states; acceptable for this use |
| Wrong timezone grouping | Wrong daily totals | `time.ts` with tests (AC 7); all grouping in SQL with `AT TIME ZONE 'Asia/Dhaka'` |
| Admin PIN leaked | Data tampering | Change PIN in settings; rate limiting; 12 h session |

## 16. Open questions for the owner
1. Should "Hair Color Begin" read *Beige*, and "Hair stret" read *Straight*?
2. Is 50% the same for every service, or do some services (e.g. Hydra Facial, Rebonding) have a different split? v1 assumes per-barber %, same for every service.
3. Is a thermal receipt printer in use? Which width: 58 mm or 80 mm?
4. Does the shop ever give discounts? (v1 has no discount field. It could add an admin-only "discount" line in v2.)
5. Are barbers paid daily, weekly or monthly? This affects the default payout view.

---

## 17. Definition of Done: client handover

The project is handed to the owner only when **all** of these are true:

1. `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` all pass with zero errors.
2. Playwright E2E covers: unlock shop → barber sale → receipt; admin login → reports; void; payout; add barber/service; FR-22.
3. All acceptance criteria in §12 pass on the deployed Vercel URL (mobile + desktop).
4. A security review is done: PIN/shop code hashed (bcrypt), signed httpOnly cookies, rate limiting, zod on every Server Action, no secrets in the client bundle, and `.env` not in git.
5. Neon `main` is migrated and seeded with the real menu (§7). Backups/PITR are confirmed. The demo PIN `0000` and shop code `1234` have been **changed**.
6. There are no console errors, `error.tsx`/`not-found.tsx`/`loading.tsx` exist, and a custom favicon and app name are set.
7. The Bangla README for the owner covers: how to open the site, add a barber, change prices, take a payout, and change the PIN/shop code. The developer README covers env vars, migrations and deploy.
8. `.env.example` is committed, the git repo is pushed to the client's (or a handed-over) GitHub account, and Vercel + Neon ownership has been transferred or shared.
