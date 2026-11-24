# Salon POS

Mobile-first point-of-sale for a single barber shop: barbers record sales, the app splits each sale between barber and owner, and the owner sees daily and monthly accounts and pays the barbers. All UI text is Bangla.

- Full spec: [`docs/PRD.md`](docs/PRD.md) (status in section 0, Definition of Done in section 17)
- Owner guide (Bangla): [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md)
- Deploying: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Repository layout

Two separate apps in one repo. Each has its own `package.json`, `node_modules` and environment.

| Folder | What it is |
|---|---|
| `frontend/` | Next.js UI. Shows screens, holds no business logic and no database access. Talks to the API through `/api/*`. |
| `backend/` | Node.js + Express REST API. All business rules, authentication, validation, Drizzle ORM, migrations and the database. |
| `docs/` | PRD, owner guide, deploy guide, bug log |

```
browser ──► frontend (Next.js)  ── /api/*  proxied ──►  backend (Express) ──► Neon Postgres
             pages, UI, proxy.ts       (cookies + client IP forwarded)         rules, auth, SQL
```

The browser only ever talks to the frontend's origin. `/api/*` is forwarded to the backend by a route handler (`frontend/src/app/api/[...path]/route.ts`), so the session cookies belong to the frontend's origin and `BACKEND_URL` never reaches the browser. Server-rendered pages call the backend the same way, with the visitor's cookies forwarded.

## Stack

- **frontend:** Next.js 16 (App Router, Turbopack, `cacheComponents`) · React 19 · Tailwind v4 · TypeScript (strict) · Vitest · Playwright
- **backend:** Node.js · Express 5 · TypeScript (strict, run with `tsx`) · Drizzle ORM + Neon Postgres · zod · bcrypt (`bcryptjs`) · Vitest + PGlite

> Next.js 16 differs from older versions (`proxy.ts`, async `cookies()` / `params`, `cacheComponents`). Read the guide in `frontend/node_modules/next/dist/docs/` before changing Next code.

## Getting started

Needs Node 20+ and a Neon database (use a dev branch, never `main`).

```bash
# backend (API on http://localhost:4000)
cd backend
npm install
cp .env.example .env.local     # fill in real values (see Environment variables)
npm run db:migrate             # create the tables on your dev branch
npm run db:seed                # demo menu, barbers and credentials (dev only)
npm run dev

# frontend (UI on http://localhost:3000), in a second terminal
cd frontend
npm install
cp .env.example .env.local     # BACKEND_URL=http://localhost:4000
npm run dev
```

The dev seed uses the demo shop code `1234` and admin PIN `0000`. They must never reach production.

From the repo root, `npm run install:all`, `npm run dev:backend`, `npm run dev:frontend`, `npm test` and `npm run typecheck` run the matching command in both apps.

## Scripts

**backend/**

| Script | What it does |
|---|---|
| `npm run dev` | API with reload (`tsx watch`) |
| `npm start` | API (`tsx src/index.ts`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit, database and HTTP tests (Vitest, PGlite) |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DIRECT_URL` |
| `npm run db:seed` | Idempotent seed (menu, barbers, hashed PIN and shop code) |
| `npm run db:studio` | Drizzle Studio |
| `npm run admin:reset-pin` | Developer-only recovery when the owner forgot the admin PIN (see `docs/DEPLOY.md`) |

**frontend/**

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run typecheck` | `tsc --noEmit` (run `npx next typegen` once first, it generates `PageProps` / `LayoutProps`) |
| `npm run lint` | ESLint |
| `npm test` | Route-guard, source-scan and header tests (Vitest) |
| `npm run test:e2e` | Playwright end-to-end suite, starts both apps (needs `.env.test`, see Testing) |
| `npm run e2e:init` | Fill `E2E_ENDPOINT` / `E2E_CONFIRM_RESET` in `.env.test` from the pasted `DATABASE_URL` |

Before saying a change is done: in `backend/` run `npm run typecheck && npm test`; in `frontend/` run `npm run typecheck && npm run lint && npm test && npm run build`.

## Environment variables

**backend/.env.local** (see `backend/.env.example`)

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string. The API uses it at runtime |
| `DIRECT_URL` | recommended | Neon **direct** (non-pooler) string. Migrations and the seed use it; falls back to `DATABASE_URL` |
| `SESSION_SECRET` | yes | Key for the HMAC-signed session cookies, at least 32 characters (`openssl rand -base64 32`). Logins fail closed without it |
| `PORT` | no | Port the API listens on (default 4000) |
| `TRUST_PROXY_HEADERS` | yes in production | Set to `1`. The API rate-limits logins by client IP, which it reads from the `x-real-ip` / `x-forwarded-for` headers the frontend forwards. Without it, production logins are refused. Only set it when the API is reachable **only** through the frontend or your own proxy (see Security notes). On Vercel (`VERCEL=1`) it is automatic |
| `SEED_ADMIN_PIN`, `SEED_SHOP_CODE` | for the seed | Initial admin PIN and shop code (4 to 8 digits). Unset means the demo values, dev only |
| `SEED_ENV` | for production seed | `production` makes the seed refuse the demo values |

**frontend/.env.local** (see `frontend/.env.example`)

| Name | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | yes | Where the API listens, for example `http://localhost:4000`. Used on the server only; read at runtime |

Never commit `.env*` files (only `.env.example` and `.env.test.example` are tracked), and never paste connection strings into chat or screenshots.

## API

All endpoints live under `/api` and answer `{ "ok": true, "data": ... }` or `{ "ok": false, "error": "<Bangla message>" }` (status 200 / 400 / 401 / 500). Sessions are cookies.

| Endpoint | Who |
|---|---|
| `GET /health`, `GET /public/shop-name`, `GET /auth/session` | anyone |
| `POST /auth/unlock`, `/auth/login`, `/auth/logout`, `/auth/check` | anyone (rate limited) |
| `GET /catalog`, `POST /sales`, `POST /sales/void-mine`, `GET /sales/today-stats`, `GET /sales/barber/:id/today`, `GET /sales/:id` | shop device or admin |
| `POST /auth/change-pin`, `/auth/change-shop-code`, `POST`/`PATCH /barbers`, `/categories`, `/services`, `PATCH /settings`, `GET /sales`, `POST /sales/admin-void`, `POST /sales/past`, `GET`/`POST /payouts`, `DELETE /payouts/:id`, `GET /admin/backup` | admin |

The routes are declared in `backend/src/app.ts`; each one runs a function from `backend/src/actions/`.

## Database migrations

1. Edit `backend/src/db/schema.ts`.
2. In `backend/`: `npm run db:generate`, then read the generated SQL in `backend/src/db/migrations/`.
3. `npm run db:migrate` against a Neon dev branch first.
4. Commit the migration. Never edit an applied migration, never run `drizzle-kit push` against `main`, and never DROP or TRUNCATE without a deliberate plan.
5. Keep migrations backward compatible (add, do not rename or drop in the same release): during a deploy the old code runs against the new schema.

## Testing

- **Backend** (`cd backend && npm test`): business rules and SQL run against an in-memory Postgres (PGlite) through `src/server/test-db.ts`. `src/server/security.test.ts` attacks the actions with forged, stale and expired cookies. `src/app.test.ts` starts the real Express app and checks routes, status codes and the session cookies over HTTP. The pure report functions in `src/lib/reports.ts` are the oracle for the SQL reports.
- **Frontend** (`cd frontend && npm test`): route guard, plus source and header checks (pages are guarded, no HTML-injection sinks, CSP and security headers, no secrets in the client bundle).
- **End-to-end** (`cd frontend && npm run test:e2e`): Playwright starts the API on port 4100 and the built frontend on port 3100, at 375px (mobile) and desktop.
  1. Create a dedicated Neon branch for E2E (fork your dev branch). **Never use `main`.** Every run deletes sales, payouts and the whole menu on it.
  2. In `frontend/`, copy `.env.test.example` to `.env.test`, paste that branch's pooled `DATABASE_URL`, then run `npm run e2e:init`. `SESSION_SECRET` comes from `backend/.env.local`.
  3. `npm run test:e2e`. The runner refuses to start if the database is the one in `backend/.env.local`, if `E2E_CONFIRM_RESET` does not repeat the endpoint id, or if the branch holds far more data than a test branch should.

## Layout

**backend/src/**
- `app.ts` Express routes. `index.ts` starts the server. `env.ts` loads `.env.local`
- `actions/` one function per use case (session check, validate with zod, call `server/`), plus `reads.ts` and the backup download
- `server/` database functions `(db, input, now)`, testable on PGlite (sales, payouts, catalog, reports, backup)
- `db/` Drizzle schema, `db` client, generated migrations, seed
- `lib/` pure code: money (integer taka), time (Asia/Dhaka), rules, schemas, auth (`auth.ts`, `auth-core.ts`), rate limit, request context (`http-context.ts`)

**frontend/src/**
- `app/` pages and layouts; `app/api/[...path]/route.ts` and `app/admin/backup/route.ts` forward to the API; `app/refresh.ts` is the one Server Action left (refreshes screens after a write)
- `api/` the browser's API client: one function per endpoint, same names the screens always used
- `components/` UI. `ui.tsx` is the shared kit: reuse it, do not invent new button or card styles
- `lib/` `backend.ts` (server-side API calls), `page-auth.ts`, `route-guard.ts`, and **copies** of the pure modules the screens need (`money`, `time`, `types`, `reports`, `backdate`, `sale-rules`, `messages`)
- `proxy.ts` convenience redirects. `e2e/` Playwright specs and `support/` (env guard, database helpers)

> The pure modules in `frontend/src/lib` are copies of the ones in `backend/src/lib` (the two apps share no code). If you change a business rule there, change both; the backend copy has the tests.

## Business rules in one place

- Money is whole taka. `barberShare = Math.round(total * pct / 100)`, `ownerShare = total - barberShare` (`splitAmount`).
- Name, price and commission % are copied onto each sale; later changes never touch old sales. Voided sales are excluded from every total.
- Day and month boundaries use Asia/Dhaka (UTC+6); timestamps are stored as `timestamptz`.
- Every sale carries an idempotency key (unique index), so a double tap never creates two sales.
- A barber can void their own sale within 10 minutes; the admin can void any sale with a reason; a payout can be deleted within 24 hours; back-dated sales go up to 60 days.

## Security notes

PIN and shop code are bcrypt hashes. Sessions are HMAC-signed, httpOnly, sameSite=lax cookies (`__Host-` prefix and `secure` in production), issued and verified only by the backend. Auth is re-checked in the backend on every request, not only in the frontend's `proxy.ts` (which only checks that a cookie exists, for redirects). Every input goes through zod. Login is rate limited through the `login_attempts` table, keyed by the client IP the frontend forwards. Security headers (CSP, frame, referrer, permissions) are set in `frontend/next.config.ts`. Logs contain error names only, never messages, queries or secrets.

**Keep the API private.** The backend trusts the client-IP header it receives (`TRUST_PROXY_HEADERS=1`). If the API is open to the internet, anyone can call it directly with a made-up IP and skip the per-IP login limit (the global cap still applies). Put it where only the frontend can reach it (private network, or a firewall rule for the frontend's addresses) where your host allows. Cross-site request forgery is not a concern: the cookie is `SameSite=Lax` and the API only accepts JSON bodies.

## Deploying

See [`docs/DEPLOY.md`](docs/DEPLOY.md): Neon, backend and frontend setup, env vars, migrations and seed on `main`, and rollback.
