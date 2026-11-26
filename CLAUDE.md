@AGENTS.md

# Salon POS: project rules for Claude

The single source of truth is **`docs/PRD.md`**. Read §0 (status), §6 (business rules), §8 (schema) and §17 (Definition of Done) before any task.

## Stack
Next.js 16.4 (App Router, Turbopack) · React 19 · Tailwind v4 (`@theme` tokens in `Client/src/app/globals.css`) · TypeScript strict · **Drizzle ORM** + **Neon Postgres** (`@neondatabase/serverless`, `drizzle-orm/neon-serverless` Pool) · Vitest · Vercel (region `sin1`).

This is a dev **meta-repo** of two independent packages (no npm workspaces; each has its own `package-lock.json` and `node_modules`), published to two GitHub repos with `npm run publish:split`:
- `Client/` → `saloon_software_frontend`, the Next.js app on **Vercel**. It has no DB code: Server Actions and pages call the backend through `Client/src/lib/api.ts` only.
- `Server/` → `saloon_software_backend`, a **Hono API on Render** (`src/http/`) that owns all business logic, auth and Neon access. `POST /rpc/<name>` with `Authorization: Bearer API_KEY`; callable actions are listed in `Server/src/http/registry.ts`.
- `Client/src/shared/lib/*` are generated copies of pure helpers from `Server/src/lib/*` (`npm run sync:shared`; `npm run check:shared` in Client fails when stale). Never edit the copies.
- `API_KEY` and `SESSION_SECRET` must be identical on Vercel and Render.

## Next.js 16 is different from your training data
- Read the guide in `node_modules/next/dist/docs/` before writing Next code.
- `proxy.ts` replaces `middleware.ts`.
- `cookies()`, `headers()`, `params` and `searchParams` are **async**.
- `cacheComponents: true` is on. Server pages that read live data must `export const instant = false`. This works in page files only, not in client components or layouts.

## Business rules (never break these)
- Money is **integer taka**. No floats. `barberShare = Math.round(total * pct / 100)`, `ownerShare = total - barberShare`. Use `splitAmount` in `Server/src/lib/money.ts`.
- Snapshot the service name, price and commission % onto the sale. Later price changes never change old sales.
- Voided sales are excluded from every total.
- Day and month boundaries use **Asia/Dhaka (UTC+6)**; see `Server/src/lib/time.ts`. Store `timestamptz`.
- Every sale has an idempotency key (unique index), so a double-tap never creates two sales.
- A barber can void their own sale within 10 minutes. The admin can void anything, with a reason. A payout can be deleted within 24 h.
- All UI text is **Bangla**. Numbers shown in the UI use `bnDigits` / `taka`.

## Code layout
- `Server/src/db/schema.ts` holds the tables, `Server/src/db/index.ts` holds `db`, and `Server/src/db/migrations/` holds the generated SQL (commit it; never edit an applied migration).
- `Server/src/lib/reports.ts` holds the pure report functions. Keep them as the test oracle for the SQL reports.
- `Client/src/components/ui.tsx` holds the shared UI kit. Reuse it; don't invent new button or card styles.
- `Server/src/actions/*.ts` are the API actions: they validate input (`@/lib/schemas`), check auth (`@/lib/auth`), then call the business logic in `Server/src/server/*.ts`. `Server/src/actions/reads.ts` serves the page reads.
- `Client/src/app/actions/*.ts` are thin `"use server"` forwards to those actions (plus `revalidatePath` after a write).

## Security
- PIN and shop code are hashed with bcrypt. Sessions use HMAC-signed, httpOnly, secure, sameSite=lax cookies.
- Auth is checked **in the API** in every action, not just in `proxy.ts`. The API refuses any `/rpc` call without the exact `API_KEY`.
- Validate every API action input with zod.
- Rate-limit login through the `login_attempts` table.
- Use only Drizzle query builders or the `sql` template. Never concatenate SQL strings.
- **Never print, log, echo or commit `.env*` values.** Never paste connection strings into chat.

## Database safety
- Use `npm run db:generate`, then review the SQL, then `npm run db:migrate`.
- Never run `drizzle-kit push` against `main`.
- Never DROP or TRUNCATE anything without asking the user first.

## Before saying "done"
Run `npm run typecheck && npm run lint && npm test && npm run build` (each covers Client and Server), and `npm run test:e2e` when behaviour changed. All of them must pass. Then report what changed and what is not verified yet.

## ECC skills to use (plugin `ecc` is installed)
- Plan: `/ecc:plan`. TDD: `ecc:tdd-workflow`. DB: `ecc:postgres-patterns`, `ecc:database-migrations`, and the `ecc:database-reviewer` agent.
- Security: `ecc:security-review` and the `ecc:security-reviewer` agent. Next.js: `ecc:nextjs-turbopack`, `ecc:react-patterns`.
- Bangla text: the `ecc:bengali-reviewer` agent. Accessibility: `ecc:frontend-a11y`. E2E: `ecc:e2e-testing`.
- Verify: `ecc:verification-loop` and `/ecc:quality-gate`. Ship: `ecc:production-audit`, `ecc:deployment-patterns`.
- Library docs (Drizzle, Neon, Next): the `ecc:docs-lookup` agent / `ecc:documentation-lookup`.
