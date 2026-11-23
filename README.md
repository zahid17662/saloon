# Salon POS

Mobile-first point-of-sale for a single barber shop: barbers record sales, the app splits each sale between barber and owner, and the owner sees daily and monthly accounts and pays the barbers. All UI text is Bangla.

- Full spec: [`docs/PRD.md`](docs/PRD.md) (status in section 0, Definition of Done in section 17)
- Owner guide (Bangla): [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md)
- Deploying: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Stack

Next.js 16 (App Router, Turbopack, `cacheComponents`) · React 19 · Tailwind v4 · TypeScript (strict) · Drizzle ORM + Neon Postgres · zod · bcrypt (`bcryptjs`) · Vitest + PGlite · Playwright · Vercel (`sin1`).

> Next.js 16 differs from older versions (`proxy.ts`, async `cookies()` / `params`, `cacheComponents`). Read the guide in `node_modules/next/dist/docs/` before changing Next code.

## Getting started

Needs Node 20+ and a Neon database (use a dev branch, never `main`).

```bash
npm install
cp .env.example .env.local     # fill in real values (see Environment variables)
npm run db:migrate             # create the tables on your dev branch
npm run db:seed                # demo menu, barbers and credentials (dev only)
npm run dev                    # http://localhost:3000
```

The dev seed uses the demo shop code `1234` and admin PIN `0000`. They must never reach production.

## Scripts

<!-- AUTO-GENERATED from package.json -->
| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build. On Vercel Production builds it first runs `drizzle-kit migrate` (see `scripts/build.mjs`) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit and database tests (Vitest, PGlite) |
| `npm run test:e2e` | Playwright end-to-end suite (needs `.env.test`, see Testing) |
| `npm run e2e:init` | Fill `E2E_ENDPOINT` / `E2E_CONFIRM_RESET` in `.env.test` from the pasted `DATABASE_URL` |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DIRECT_URL` |
| `npm run db:seed` | Idempotent seed (menu, barbers, hashed PIN and shop code) |
| `npm run db:studio` | Drizzle Studio |
| `npm run admin:reset-pin` | Developer-only recovery when the owner forgot the admin PIN (see `docs/DEPLOY.md`) |
<!-- /AUTO-GENERATED -->

Before saying a change is done: `npm run typecheck && npm run lint && npm test && npm run build`.

## Environment variables

<!-- AUTO-GENERATED from .env.example -->
| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string. The app uses it at runtime |
| `DIRECT_URL` | recommended | Neon **direct** (non-pooler) string. Migrations and the seed use it; falls back to `DATABASE_URL` |
| `SESSION_SECRET` | yes | Key for the HMAC-signed session cookies, at least 32 characters (`openssl rand -base64 32`). Logins fail closed without it |
| `TRUST_PROXY_HEADERS` | only behind your own proxy | Set to `1` so the login rate limit can read the client IP. On Vercel it is automatic (`VERCEL=1`). Needed for `npm start` on your own machine |
| `SEED_ADMIN_PIN`, `SEED_SHOP_CODE` | for the seed | Initial admin PIN and shop code (4 to 8 digits). Unset means the demo values, dev only |
| `SEED_ENV` | for production seed | `production` makes the seed refuse the demo values |
<!-- /AUTO-GENERATED -->

Never commit `.env*` files (only `.env.example` and `.env.test.example` are tracked), and never paste connection strings into chat or screenshots.

## Database migrations

1. Edit `src/db/schema.ts`.
2. `npm run db:generate`, then read the generated SQL in `src/db/migrations/`.
3. `npm run db:migrate` against a Neon dev branch first.
4. Commit the migration. Never edit an applied migration, never run `drizzle-kit push` against `main`, and never DROP or TRUNCATE without a deliberate plan.
5. Keep migrations backward compatible (add, do not rename or drop in the same release): during a deploy the old code runs against the new schema.

## Testing

- **Unit and database tests:** `npm test`. Business rules run against an in-memory Postgres (PGlite) through `src/server/test-db.ts`. The pure report functions in `src/lib/reports.ts` are the oracle for the SQL reports.
- **End-to-end:** `npm run test:e2e` runs Playwright against `npm run build && npm start` on port 3100, at 375px (mobile) and desktop.
  1. Create a dedicated Neon branch for E2E (fork your dev branch). **Never use `main`.** Every run deletes sales, payouts and the whole menu on it.
  2. Copy `.env.test.example` to `.env.test`, paste that branch's pooled `DATABASE_URL`, then run `npm run e2e:init`.
  3. `npm run test:e2e`. The runner refuses to start if the database is the one in `.env.local`, if `E2E_CONFIRM_RESET` does not repeat the endpoint id, or if the branch holds far more data than a test branch should.

## Layout

- `src/app/` pages, route handlers (`/admin/backup`) and `actions/` (thin `"use server"` wrappers: check the session, validate with zod, call `src/server`)
- `src/server/` database functions `(db, input, now)`, testable on PGlite (sales, payouts, catalog, reports, backup)
- `src/db/` Drizzle schema, `db` client (imports `server-only`), generated migrations, seed
- `src/lib/` pure code: money (integer taka), time (Asia/Dhaka), rules, schemas, auth, report functions
- `src/components/` UI. `ui.tsx` is the shared kit: reuse it, do not invent new button or card styles
- `e2e/` Playwright specs and `support/` (env guard, database helpers)
- `scripts/` build wrapper (`build.mjs`), E2E init, admin PIN reset

## Business rules in one place

- Money is whole taka. `barberShare = Math.round(total * pct / 100)`, `ownerShare = total - barberShare` (`splitAmount`).
- Name, price and commission % are copied onto each sale; later changes never touch old sales. Voided sales are excluded from every total.
- Day and month boundaries use Asia/Dhaka (UTC+6); timestamps are stored as `timestamptz`.
- Every sale carries an idempotency key (unique index), so a double tap never creates two sales.
- A barber can void their own sale within 10 minutes; the admin can void any sale with a reason; a payout can be deleted within 24 hours; back-dated sales go up to 60 days.

## Security notes

PIN and shop code are bcrypt hashes. Sessions are HMAC-signed, httpOnly, sameSite=lax cookies (`__Host-` prefix and `secure` in production). Auth is re-checked on the server in every Server Action and in the backup route, not only in `proxy.ts`. Every Server Action input goes through zod. Login is rate limited through the `login_attempts` table. Security headers (CSP, frame, referrer, permissions) are set in `next.config.ts`. Logs contain error names only, never messages, queries or secrets.

## Deploying

See [`docs/DEPLOY.md`](docs/DEPLOY.md): Neon and Vercel setup, env vars, migrations and seed on `main`, and rollback.
