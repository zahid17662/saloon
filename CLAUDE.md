@AGENTS.md

# Salon POS: project rules for Claude

The single source of truth is **`docs/PRD.md`**. Read §0 (status), §6 (business rules), §8 (schema) and §17 (Definition of Done) before any task.

## Stack
Next.js 16.4 (App Router, Turbopack) · React 19 · Tailwind v4 (`@theme` tokens in `Client/src/app/globals.css`) · TypeScript strict · **Drizzle ORM** + **Neon Postgres** (`@neondatabase/serverless`, `drizzle-orm/neon-serverless` Pool) · Vitest · Vercel (region `sin1`).

This is an **npm workspaces monorepo**: `Client/` is the Next.js app (`app/`, `components/`, `proxy.ts`) and `Server/` holds all framework-agnostic logic (`db/`, `server/`, `lib/`) that `Client/` imports via the `@server/*` path alias. It still builds and deploys as a single Next.js app — this is a file-layout split, not a separate backend service.

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
- `Server/src/db/schema.ts` holds the tables, `Server/src/db/index.ts` holds `db` (imports `server-only`), and `Server/src/db/migrations/` holds the generated SQL (commit it; never edit an applied migration).
- `Server/src/lib/reports.ts` holds the pure report functions. Keep them as the test oracle for the SQL reports.
- `Client/src/components/ui.tsx` holds the shared UI kit. Reuse it; don't invent new button or card styles.
- `Client/src/app/actions/*.ts` are the thin `"use server"` glue: they validate input (`@server/lib/schemas`), check auth (`@server/lib/auth`), then call the actual business logic in `Server/src/server/*.ts`.

## Security
- PIN and shop code are hashed with bcrypt. Sessions use HMAC-signed, httpOnly, secure, sameSite=lax cookies.
- Auth is checked **on the server** in every Server Action, not just in `proxy.ts`.
- Validate every Server Action input with zod.
- Rate-limit login through the `login_attempts` table.
- Use only Drizzle query builders or the `sql` template. Never concatenate SQL strings.
- **Never print, log, echo or commit `.env*` values.** Never paste connection strings into chat.

## Database safety
- Use `npm run db:generate`, then review the SQL, then `npm run db:migrate`.
- Never run `drizzle-kit push` against `main`.
- Never DROP or TRUNCATE anything without asking the user first.

## Before saying "done"
Run `npm run typecheck && npm run lint && npm test && npm run build`. All of them must pass. Then report what changed and what is not verified yet.

## ECC skills to use (plugin `ecc` is installed)
- Plan: `/ecc:plan`. TDD: `ecc:tdd-workflow`. DB: `ecc:postgres-patterns`, `ecc:database-migrations`, and the `ecc:database-reviewer` agent.
- Security: `ecc:security-review` and the `ecc:security-reviewer` agent. Next.js: `ecc:nextjs-turbopack`, `ecc:react-patterns`.
- Bangla text: the `ecc:bengali-reviewer` agent. Accessibility: `ecc:frontend-a11y`. E2E: `ecc:e2e-testing`.
- Verify: `ecc:verification-loop` and `/ecc:quality-gate`. Ship: `ecc:production-audit`, `ecc:deployment-patterns`.
- Library docs (Drizzle, Neon, Next): the `ecc:docs-lookup` agent / `ecc:documentation-lookup`.
