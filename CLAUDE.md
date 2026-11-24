@AGENTS.md

# Salon POS: project rules for Claude

The single source of truth is **`docs/PRD.md`**. Read §0 (status), §6 (business rules), §8 (schema) and §17 (Definition of Done) before any task.

## Layout of the repo
Two apps, no shared code: **`backend/`** (Node.js + Express REST API, Drizzle ORM, Neon Postgres, all business rules and auth) and **`frontend/`** (Next.js 16.4 App Router + Turbopack, React 19, Tailwind v4, TypeScript strict; UI only). Tests: Vitest in both, PGlite for the backend, Playwright in `frontend/e2e`. Frontend on Vercel (region `sin1`); the backend runs wherever a Node process can (see `docs/DEPLOY.md`).

The browser talks only to the frontend. `/api/*` is forwarded to the backend by `frontend/src/app/api/[...path]/route.ts`; server components call the backend through `frontend/src/lib/backend.ts` with the visitor's cookies. Run each app's commands from its own folder.

## Next.js 16 is different from your training data (frontend)
- Read the guide in `frontend/node_modules/next/dist/docs/` before writing Next code.
- `proxy.ts` replaces `middleware.ts`.
- `cookies()`, `headers()`, `params` and `searchParams` are **async**.
- `cacheComponents: true` is on. Server pages that read live data must `export const instant = false`. This works in page files only, not in client components or layouts.

## Business rules (never break these)
- Money is **integer taka**. No floats. `barberShare = Math.round(total * pct / 100)`, `ownerShare = total - barberShare`. Use `splitAmount` in `src/lib/money.ts`.
- Snapshot the service name, price and commission % onto the sale. Later price changes never change old sales.
- Voided sales are excluded from every total.
- Day and month boundaries use **Asia/Dhaka (UTC+6)**; see `src/lib/time.ts`. Store `timestamptz`.
- Every sale has an idempotency key (unique index), so a double-tap never creates two sales.
- A barber can void their own sale within 10 minutes. The admin can void anything, with a reason. A payout can be deleted within 24 h.
- All UI text is **Bangla**. Numbers shown in the UI use `bnDigits` / `taka`.

## Code layout
- `backend/src/db/schema.ts` holds the tables, `db/index.ts` holds `db`, and `db/migrations/` holds the generated SQL (commit it; never edit an applied migration).
- `backend/src/app.ts` declares the REST routes; each runs one function from `backend/src/actions/` (auth check, zod validation, call into `backend/src/server/`). Replies are `{ ok, data | error }` with Bangla errors.
- `backend/src/lib/` pure code: `money.ts` (`splitAmount`), `time.ts`, `schemas.ts`, `auth*.ts`, `reports.ts` (test oracle for the SQL reports).
- `frontend/src/api/` is the browser's API client (one function per endpoint). `frontend/src/components/ui.tsx` holds the shared UI kit; reuse it, don't invent new button or card styles.
- `frontend/src/lib/{money,time,types,reports,backdate,sale-rules,messages}.ts` are **copies** of the backend modules. Change a rule in both; the backend copy has the tests.

## Security
- PIN and shop code are hashed with bcrypt. Sessions use HMAC-signed, httpOnly, secure, sameSite=lax cookies.
- Auth is checked **in the backend** on every request, not just in the frontend's `proxy.ts` (which only checks that a cookie exists).
- Validate every API input with zod.
- Rate-limit login through the `login_attempts` table.
- Use only Drizzle query builders or the `sql` template. Never concatenate SQL strings.
- **Never print, log, echo or commit `.env*` values.** Never paste connection strings into chat.

## Database safety
- In `backend/`: `npm run db:generate`, then review the SQL, then `npm run db:migrate`.
- Never run `drizzle-kit push` against `main`.
- Never DROP or TRUNCATE anything without asking the user first.

## Before saying "done"
Backend (`cd backend`): `npm run typecheck && npm test`. Frontend (`cd frontend`): `npx next typegen && npm run typecheck && npm run lint && npm test && npm run build`. All of them must pass. Then report what changed and what is not verified yet.

## ECC skills to use (plugin `ecc` is installed)
- Plan: `/ecc:plan`. TDD: `ecc:tdd-workflow`. DB: `ecc:postgres-patterns`, `ecc:database-migrations`, and the `ecc:database-reviewer` agent.
- Security: `ecc:security-review` and the `ecc:security-reviewer` agent. Next.js: `ecc:nextjs-turbopack`, `ecc:react-patterns`.
- Bangla text: the `ecc:bengali-reviewer` agent. Accessibility: `ecc:frontend-a11y`. E2E: `ecc:e2e-testing`.
- Verify: `ecc:verification-loop` and `/ecc:quality-gate`. Ship: `ecc:production-audit`, `ecc:deployment-patterns`.
- Library docs (Drizzle, Neon, Next): the `ecc:docs-lookup` agent / `ecc:documentation-lookup`.
