# ECC + Claude Code: step-by-step guide to a deploy-ready salon app

You run Claude Code in the Antigravity terminal. **Do the phases in order. Use one phase per Claude session.** After each phase, check the result, commit, and only then go on.

---

## Part A: one-time setup (about 10 minutes)

### A1. Check that ECC is installed
In the Claude terminal, type:
```
/plugin list
```
You should see `ecc@ecc`. If it's missing, install it:
```
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```
Then restart Claude (`exit`, then `claude`).

### A2. GateGuard (ECC's safety hook)
ECC's "Fact-Forcing Gate" stops the **first** edit of each file and asks Claude to explain itself. That's normal; Claude answers and retries. If it slows you down too much, start Claude in PowerShell like this:
```powershell
$env:GATEGUARD_EXEMPT_GLOBS="src/**,docs/**"; claude
```
This keeps the protection against dangerous shell commands but skips the per-file questions.

### A3. Project files Claude reads automatically
- `CLAUDE.md`: the project rules (business rules, security, the ECC skill map). Claude loads it at the start of every session.
- `docs/PRD.md`: the full spec (v1.1, Drizzle).

### A4. Save your work between sessions
- At the end of a session: `/ecc:save-session`
- At the start of the next one: `/ecc:resume-session`
- Before a risky change: `/ecc:checkpoint`

---

## Part B: the best ECC skills for THIS project

| Need | ECC skill / agent | Why it fits |
|---|---|---|
| Plan each phase before coding | `/ecc:plan` | It plans, then waits for your "yes". |
| Tests first (money split, Dhaka time) | `ecc:tdd-workflow` | Money bugs cost the client real taka. |
| Drizzle + Neon schema and queries | `ecc:postgres-patterns`, `ecc:database-migrations`, `ecc:database-reviewer` agent | Indexes, constraints, safe migrations |
| Up-to-date Drizzle / Next 16 docs | `ecc:docs-lookup` agent (Context7) | Your Next 16 and Drizzle versions differ from Claude's training data. |
| Next.js 16 / React 19 | `ecc:nextjs-turbopack`, `ecc:react-patterns`, `ecc:react-reviewer` agent | Server Actions, cache components, client/server boundaries |
| PIN login, cookies, rate limit | `ecc:security-review`, `ecc:security-reviewer` agent | Money app with PIN auth |
| Hidden errors | `ecc:silent-failure-hunter` agent | Catches a failed save that looks successful. |
| Bangla UI text | `ecc:bengali-reviewer` agent | Unicode, Bangla digits, fonts |
| Accessibility on phones | `ecc:frontend-a11y` | Barbers tap on small phones. |
| End-to-end tests | `ecc:e2e-testing`, `ecc:e2e-runner` agent | Proves the full flow works. |
| Final checks | `ecc:verification-loop`, `/ecc:quality-gate`, `/ecc:code-review` | Build, types, lint, tests, diff |
| Before handover | `ecc:production-audit`, `ecc:deployment-patterns` | "What breaks in prod?" |
| Docs | `/ecc:update-docs` | READMEs stay in sync with the code. |
| Commits | `ecc:git-workflow`, `/ecc:prp-commit` | Clean history to hand over |

**Not needed** (skip these): prisma-patterns, django/laravel/go/etc., healthcare, marketing, video, and the multi-model/GAN/loop skills. They add noise.

---

## Part C: the phases (copy each prompt into Claude)

> Tip: paste one prompt, let Claude plan, read the plan, answer "yes", and let it work. When it's done, run `/ecc:quality-gate` yourself before committing.

### Phase 0: git and repo hygiene
```
Read CLAUDE.md and docs/PRD.md §0 and §17.
Goal: make this folder a clean git repo ready for real backend work.
1. Run `git init` with main as the default branch. Confirm .gitignore ignores .env*, .next, node_modules, *.tsbuildinfo, and commit nothing secret.
2. Create .env.example with DATABASE_URL, DIRECT_URL and SESSION_SECRET (placeholder values only; never read or print my real .env.local). Make sure .gitignore still lets .env.example be committed (add !.env.example).
3. Replace the default create-next-app README.md with a short developer README (stack, scripts, env vars, how to migrate).
4. Run npm run typecheck, lint, test and build, and fix anything that fails.
5. Use the ecc:git-workflow skill and make the first commit "chore: initial frontend + drizzle setup".
Show me `git status` at the end.
```

### Phase 1: finish the Drizzle schema and seed (M1)
```
Use /ecc:plan first and wait for my approval.
Context: Drizzle is already set up (src/db/schema.ts, src/db/index.ts, drizzle.config.ts, src/db/migrations/0000_*.sql). Read docs/PRD.md §7 and §8.
Tasks:
1. Use the ecc:docs-lookup agent to check the current drizzle-orm 0.45 + @neondatabase/serverless docs for neon-serverless Pool usage, transactions and drizzle-kit migrate. Follow them.
2. Add `enteredByAdmin` (boolean, default false) to sales for FR-22, then run `npm run db:generate` and show me the new SQL before applying it.
3. Write src/db/seed.ts (add a "db:seed" npm script). It should reuse the data in src/lib/seed.ts: categories, the 25 services, 3 barbers and the settings rows, with the admin PIN and shop code stored as bcrypt hashes (install bcryptjs). It must be idempotent: running it twice creates no duplicates.
4. Ask me before running `npm run db:migrate` and `npm run db:seed`, and confirm they target the Neon DEV branch. If the DB still has old Prisma tables (_prisma_migrations etc.), STOP and tell me; do not drop anything yourself.
5. Run the ecc:database-reviewer agent on the schema and migrations and fix real issues.
Done = typecheck, lint, test and build pass, and the migration + seed have been applied to dev.
```

### Phase 2: server-side auth (M2)
```
Use /ecc:plan and wait for approval. Use the ecc:security-review skill throughout.
Read docs/PRD.md §5.1 (auth) and the Next 16 docs in node_modules/next/dist/docs about proxy.ts, cookies() and Server Actions.
Build:
- src/lib/auth.ts (import "server-only"): HMAC-SHA256 signed cookies using SESSION_SECRET (node:crypto), with a shop-device cookie (carries shopCodeVersion) and an admin cookie (8 h); bcrypt verify; rate limiting through login_attempts (5 failures / 15 min per IP + kind).
- proxy.ts: redirects to /unlock when there is no valid shop cookie, and to /admin/login for /admin/* without an admin cookie.
- Server Actions unlockShop, loginAdmin, logoutAdmin, changeAdminPin and changeShopCode (the shop code change bumps shopCodeVersion, which logs out every device), with zod validation.
- Wire the existing unlock and admin login screens to these actions, and remove the browser-side PIN checks from src/lib/store.ts.
Write tests first (ecc:tdd-workflow) for cookie sign/verify, tampering, expiry and the rate limit.
Finish by running the ecc:security-reviewer agent and fixing every HIGH/CRITICAL finding.
```

### Phase 3: replace localStorage with Server Actions (M3–M4)
```
Use /ecc:plan and wait for approval.
src/lib/store.ts is a temporary localStorage layer. Every exported action maps 1:1 to a Server Action (see the comment at the top of the file). Replace them with Drizzle + Neon, one group at a time, keeping the UI working after each group:
 a) catalog read (categories, services, barbers, settings) for the barber screen
 b) createSale: one transaction; server recomputes prices and the split (never trust client prices), snapshots name/price/commission, uses the idempotency key (a duplicate returns the existing sale), and enforces payment method/qty limits
 c) receipt page, voidSale (barber 10-minute rule; admin with reason), canBarberVoid
 d) admin CRUD: barbers, categories, services, payouts (24 h delete rule), settings
 e) reports and dashboard: SQL aggregates with Drizzle's sql template, grouped by Asia/Dhaka day (date_trunc on created_at AT TIME ZONE 'Asia/Dhaka'), excluding voided sales; keep src/lib/reports.ts as the test oracle and add tests that compare the SQL results with it
 f) CSV export and exportAll
Rules: every action checks auth on the server, validates input with zod and returns Bangla error messages. Use revalidatePath/refresh correctly for Next 16 (check the docs). Add loading.tsx, error.tsx and not-found.tsx with Bangla text.
After each group: typecheck, test and build. At the end, delete the localStorage code and the "reset demo data" action.
Finally run the ecc:silent-failure-hunter and ecc:react-reviewer agents and fix the real issues.
```

### Phase 4: FR-22 back-dated sale
```
Use the ecc:tdd-workflow skill. Read docs/PRD.md FR-22.
Add an admin-only screen in /admin/sales ("পুরনো বিক্রি যোগ করুন") to enter a sale with a past date and time (today back to 60 days; no future dates), choosing the barber and services. Save it with enteredByAdmin = true, and show a small badge on such sales in the sales list. Reports must count it on the chosen Dhaka day. Write tests for the date limits and the Dhaka-day bucketing first.
```

### Phase 5: E2E tests
```
Use the ecc:e2e-testing skill and the ecc:e2e-runner agent. Set up Playwright against `npm run build && npm start` with a test database (ask me for the Neon branch; never use main).
Cover the flows in docs/PRD.md §17 item 2: unlock shop → barber picks services → sale saved → receipt shows ৳250 → ৳125/৳125; double-tap creates only one sale; barber void within 10 min, blocked after; admin login (wrong PIN rate limit); reports for today; payout and balance; add barber and service; price change doesn't alter old sales; FR-22.
Test at a mobile size (375px) and on desktop. Make the tests stable (no fixed sleeps).
```

### Phase 6: quality pass (Bangla, a11y, performance)
```
Run these and fix what they find, explaining each fix briefly:
1. The ecc:bengali-reviewer agent on all UI text (Unicode, Bangla digits, consistent wording).
2. The ecc:frontend-a11y skill: labels, focus, 44px tap targets, contrast, modal focus trap.
3. The ecc:react-reviewer and ecc:typescript-reviewer agents on src/.
4. Replace the default favicon/app icon with a scissors icon and set the metadata title to the shop name.
5. Add security headers in next.config.ts (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy) without breaking the fonts.
Then /ecc:quality-gate.
```

### Phase 7: production audit and deploy
```
Use the ecc:production-audit and ecc:deployment-patterns skills.
1. Audit the app for "what breaks in prod": env vars, Neon pooled vs direct URL, cold starts, timezone, migrations in the build, error pages, logging (no secrets).
2. Set the build script to run `drizzle-kit migrate` before `next build` (or explain a safer alternative), and set the Vercel region to sin1 (vercel.json).
3. Write docs/DEPLOY.md: step-by-step Vercel + Neon main setup, the env vars to add in the Vercel dashboard, how to run migrations and the seed on main, and how to roll back.
Do not deploy anything yourself; give me the exact steps and commands to run.
```

### Phase 8: handover documents
```
Use /ecc:update-docs. Write:
1. docs/OWNER-GUIDE.md in simple Bangla for the shop owner: opening the site on a phone, adding it to the home screen, how barbers record a sale, the daily/monthly accounts, paying a barber, adding a barber/service, changing prices, changing the PIN and shop code, and what to do if something goes wrong.
2. Make sure the developer README.md is complete (stack, setup, scripts, env, migrations, tests, deploy).
3. Check every item of docs/PRD.md §17 (Definition of Done) and report ✅/❌ for each with evidence.
```

### Final check (run yourself)
```
/ecc:quality-gate
/ecc:code-review
```
Then commit, push to GitHub, deploy on Vercel by following docs/DEPLOY.md, open the live URL on a phone and do one real sale. **Change the PIN and shop code** before handing it to the client.

---

## Rules that keep you safe
- Never paste your Neon connection string into the chat. It belongs only in `.env.local` and the Vercel dashboard.
- If Claude wants to DROP tables, run `drizzle-kit push`, or touch the Neon `main` branch, say **no** unless you have a backup.
- One phase per session. Save with `/ecc:save-session`. Commit after each phase.
