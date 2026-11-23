# Salon POS

Mobile-first point-of-sale for a single barber shop: barbers record sales, the app splits each sale between barber and owner, and the owner sees daily/monthly accounts and payouts. All UI text is Bangla. Full spec: [`docs/PRD.md`](docs/PRD.md).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript (strict) · Drizzle ORM + Neon Postgres · Vitest · Vercel (`sin1`).

> Next.js 16 differs from older versions (`proxy.ts`, async `cookies()`/`params`, `cacheComponents`). See `node_modules/next/dist/docs/`.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Build (runs migrations only on Vercel Production) / serve it |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |

## Environment variables

See `.env.example`. Never commit `.env.local`. Deploying: [`docs/DEPLOY.md`](docs/DEPLOY.md).

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection, used by the app |
| `DIRECT_URL` | Neon direct connection, used by `drizzle-kit` (falls back to `DATABASE_URL`) |
| `SESSION_SECRET` | Key for HMAC-signed session cookies |

## Database migrations

1. Edit `src/db/schema.ts`.
2. `npm run db:generate`, then review the generated SQL in `src/db/migrations/`.
3. `npm run db:migrate` (use a Neon dev branch first).
4. Commit the migration. Never edit an applied migration, and never run `drizzle-kit push` against `main`.

## Layout

- `src/db/` schema, `db` client, migrations
- `src/lib/` money, time (Asia/Dhaka), reports, the pure report functions, and zod schemas; `src/server/` holds the database functions and `src/app/actions/` the Server Actions
- `src/components/ui.tsx` shared UI kit

## Status

Everything runs on Neon through Server Actions (the localStorage layer is gone); Playwright E2E passes. Open items are listed in PRD §0 and §17.
