# Nir Smart Gents Parlour

The public website of the salon plus its point-of-sale: barbers record sales, the app splits each sale between barber and owner, and the owner sees daily and monthly accounts and pays the barbers.

| Address | What | Language |
|---|---|---|
| `/` | Public website (static) | English |
| `/pos` | Barber screens | Bangla |
| `/admin` | Owner screens | Bangla |

- Full spec: [`docs/PRD.md`](docs/PRD.md)
- Owner guide (Bangla): [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md)
- Deploying and handover: [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Layout

An npm workspaces monorepo: one `npm install` at the root, one lockfile.

```
Client/   Next.js 16 web app (Vercel). No database code. See Client/README.md
Server/   Hono API (Render): business rules, auth, Neon + Drizzle. See Server/README.md
e2e/      Playwright browser tests
scripts/  dev launcher, E2E setup
```

## Getting started

Needs Node 22+ (`.nvmrc` pins 24) and a Neon database (a dev branch, never `main`).

```bash
npm install
cp Server/.env.example Server/.env          # database strings, SESSION_SECRET, API_KEY
cp Client/.env.example Client/.env.local    # API_URL=http://localhost:4000, same SESSION_SECRET and API_KEY
npm run db:migrate
npm run db:seed                             # demo data, dev only
npm run dev                                 # API on :4000, web on http://localhost:3000
```

The dev seed uses demo credentials (admin PIN `0000`, shop code `1234`, barber password `barber123`). They must never reach production.

Staff screens (`/pos`, `/barber`, `/receipt`) need the shop code once per device (valid 180 days; changing the code in Settings signs every other device out). `/admin` needs the admin PIN. `/` is public.

## Scripts (run from the root)

| Script | What it does |
|---|---|
| `npm run dev` | API and web app together (`dev:api`, `dev:web` for one) |
| `npm run build` | Production build of the web app |
| `npm run start:api` / `start:web` | Start the API / the built web app |
| `npm run typecheck` | Both workspaces |
| `npm run lint` | ESLint (web app) |
| `npm test` | API unit and database tests (in-memory PGlite), shared-copy check, web security checks |
| `npm run check` | typecheck, lint, test and build |
| `npm run sync:shared` | Copy shared helpers from `Server/src/lib` to `Client/src/shared/lib` |
| `npm run db:generate` / `db:migrate` / `db:seed` / `db:studio` | Database tasks |
| `npm run admin:reset-pin` | Recovery when the owner forgot the admin PIN |
| `npm run test:e2e`, `npm run e2e:init` | Browser tests |

## Browser tests

They **delete sales, payouts and the whole menu** on the database they use, so create a dedicated Neon branch (never `main`, never your dev branch). Copy `Client/.env.test.example` to `Client/.env.test`, paste that branch's pooled `DATABASE_URL`, run `npm run e2e:init`, then `npm run test:e2e`.

## Rules in one place

- Money is whole taka. `barberShare = Math.round(total * pct / 100)`, `ownerShare = total - barberShare`.
- Service name, price and commission % are copied onto each sale. Voided sales are excluded from every total.
- Days and months use Asia/Dhaka (UTC+6).
- Every sale has an idempotency key, so a double tap never creates two sales.
- Never commit `.env*` files (only the `.example` files).
