# Vercel deploy readiness: step-by-step prompts

**Where the project stands:** this is a git repo (`origin` = `github.com/zahid17662/saloon`), on `main`, with migrations, security headers, a guarded production-only migration step (`scripts/build.mjs`), `vercel.json` pinned to `sin1`, and a detailed **[docs/DEPLOY.md](DEPLOY.md)** already written. `docs/BUGS.md` has one **high** item open (B-005: no test proves every admin Server Action rejects a missing/invalid cookie — not a known hole, just unproven) and the rest are low/medium or informational.

So the work left is not "write the deploy doc" (it exists) — it's: **close B-005, re-verify everything against the current code, then follow DEPLOY.md exactly.** Use one prompt per Claude session, in order.

## ECC tools used

| Step | ECC skill / agent | What it checks |
|---|---|---|
| D0 | `/ecc:verify` (`ecc:verification-loop`) | typecheck, lint, tests, build, e2e all green right now |
| D1 | `ecc:tdd-workflow` | closes B-005 (admin auth proven by test, not assumed) |
| D2 | `ecc:production-audit` | env vars, cold starts, build-time migration safety, logging |
| D3 | `ecc:security-reviewer` agent, `ecc:security-review` | nothing secret leaks into the client bundle or git history |
| D4 | `ecc:deployment-patterns` | the Vercel config and `scripts/build.mjs` itself |
| D5 | `ecc:docs-lookup` agent | current Vercel + Next 16 docs (your versions are new) |
| D6 | `/ecc:quality-gate`, `/ecc:code-review` | final go/no-go before you push |
| D7 | `ecc:canary-watch` | read-only check of the live URL after deploy |

**Safety rule:** none of these prompts touch Neon `main` or deploy anything. D4 only *reads* `vercel.json`/env var names, never real secrets. You run the actual deploy steps in DEPLOY.md §1–4 yourself.

---

### D0: baseline, right now
```
Use the ecc:verification-loop skill (/ecc:verify).
Run in order and show the real output: npm run typecheck, npm run lint, npm test, npm run build, npm run test:e2e.
Also run `git status --short` and `git log -1`.
Report PASS/FAIL per command. If anything fails, stop and tell me — don't fix it inside this prompt, that's step D1/D6.
```

### D1: close the one open HIGH bug before deploying
```
Read docs/BUGS.md item B-005 (Auth / Server Actions, FR-4, AC 10) and docs/TRACEABILITY.md.
Use the ecc:tdd-workflow skill. Write tests that call every admin-only Server Action under src/app/actions/*.ts and src/server/*.ts with: no cookie, a barber/shop-only cookie, a tampered cookie, and an expired cookie — each must be rejected with an AuthError mapped to a Bangla message, and must write nothing to the database. Use whatever test harness already exists for action tests (check src/server/action.test.ts and the PGlite setup) instead of inventing a new one.
If a real gap is found (not just "untested"), fix it and say so clearly — do not quietly mark it fixed if it isn't.
Update docs/BUGS.md: mark B-005 Fixed with the test file/name, or explain why it stays open.
Finish with npm run typecheck && npm run lint && npm test.
```

### D2: production-readiness audit
```
Use the ecc:production-audit skill on the whole repo, focused on going live on Vercel + Neon.
Check specifically:
1. Every process.env.* read in src/, scripts/ and drizzle.config.ts has a safe behavior when missing in production (fails loudly, not silently) — list them all with file:line.
2. scripts/build.mjs: confirm migrations only run when VERCEL_ENV === "production", and that a failed migration fails the whole build (it should, verify don't assume).
3. next.config.ts: the CSP, security headers and cacheComponents/instant=false setup won't break a production build (run `npm run build` locally with NODE_ENV=production and VERCEL_ENV unset, confirm migrations are skipped and the app still builds).
4. Cold start / Neon suspend behavior: does src/db/index.ts (Pool) handle a cold/suspended Neon endpoint without crashing the first request?
5. TRUST_PROXY_HEADERS and getClientIp (src/lib/auth.ts): confirm the Vercel-safe path (VERCEL=1) is what actually runs in prod, and that TRUST_PROXY_HEADERS is never set in Vercel env vars (per DEPLOY.md section 2).
6. Confirm nothing in src/db/seed.ts or scripts/*.mjs can run against production data without the explicit SEED_ENV=production + both credentials guard (re-read docs/BUGS.md S-005).
Report each check as OK or a concrete problem with a fix. Don't change business logic — this is a verification pass.
```

### D3: secrets and client-bundle check
```
Use the ecc:security-reviewer agent and the ecc:security-review skill.
1. Run `npm run build`, then grep the generated .next/static output for DATABASE_URL, DIRECT_URL, SESSION_SECRET, "neon.tech", and any literal PIN/shop-code value. There must be zero matches.
2. Run `git log --all -p | grep -iE "DATABASE_URL=|DIRECT_URL=|SESSION_SECRET=" ` (just the pattern check, don't print full matches back to me if any exist — tell me the commit hash instead so I can decide what to do) to confirm no .env* file was ever committed.
3. Confirm .gitignore still ignores .env* except the committed .env.example and .env.test.example, and that those two example files contain no real values.
4. Re-check the CSP and security headers in next.config.ts are present on an actual response (curl -I against the local production build), not just in the config file.
Report PASS/FAIL per item. If step 2 finds a real leaked secret in history, stop and tell me immediately — don't try to fix git history yourself.
```

### D4: Vercel + Next 16 config itself
```
Use the ecc:deployment-patterns skill and the ecc:docs-lookup agent (check current Vercel + Next.js 16 docs — your training data may be stale for this Next version; also check node_modules/next/dist/docs).
Review, without changing behavior unless something is actually wrong:
1. vercel.json (region sin1) and package.json's build/start scripts match what Vercel expects for Next 16 App Router + Turbopack.
2. src/proxy.ts: confirm it's the Next 16 proxy (not an old middleware.ts left behind), and that Vercel's build output labels it correctly (docs/BUGS.md B-002 flagged this as "verify").
3. Any route that needs the Node runtime (DB access, bcrypt) isn't accidentally edge-runtime.
4. package.json has no leftover Prisma or unused dependency that could break `npm ci` on Vercel.
Report findings. If B-002 (proxy labeling) is just cosmetic, say so and close it in docs/BUGS.md.
```

### D5: final gate before you touch Vercel
```
Run /ecc:quality-gate, then /ecc:code-review on everything since the last tagged/release commit.
Re-run: npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e — all must be green.
Check docs/BUGS.md: confirm zero open CRITICAL or HIGH items (B-005 closed per D1).
Check docs/PRD.md §17 (Definition of Done) item by item with evidence from this repo.
Give me one of: READY TO DEPLOY, or a numbered list of what's blocking it.
```

---

## Then deploy — follow docs/DEPLOY.md yourself
Once D0–D5 all come back clean, **do not ask Claude to deploy for you.** Follow DEPLOY.md:
1. §1 — create/confirm the Neon `main` branch, copy `DATABASE_URL` (pooled) and `DIRECT_URL` (direct), generate `SESSION_SECRET` with `openssl rand -base64 32`.
2. §2 — in the Vercel dashboard, import the GitHub repo, add the three env vars to **Production** only, do **not** set `TRUST_PROXY_HEADERS`.
3. §3 — from your own computer, run the one-off `db:migrate` + `db:seed` commands with the **real** PIN and shop code (never the demo `0000`/`1234`).
4. §4 — push to `main`; Vercel builds and deploys. Open the Production URL, unlock, make one test sale, then void it from `/admin/sales`.
5. §5 — walk the after-deploy checklist in DEPLOY.md.

### D7: after it's live (read-only)
```
Use the ecc:canary-watch skill on <your Vercel production URL>. Check: the page loads, /unlock responds, no console errors, response times are reasonable, and the security headers (CSP, HSTS, X-Frame-Options) are present on the live response.
Do NOT create, void, or modify any real sale, barber, or setting. Read-only checks only.
```

## Rules that keep this safe
- Never paste a Neon connection string, `SESSION_SECRET`, the real admin PIN, or the real shop code into the Claude chat.
- Say no if any prompt's output suggests running `drizzle-kit push`, dropping a table, or editing an already-applied migration file.
- The actual `db:migrate` / `db:seed` against `main` (DEPLOY.md §3) is something **you** type in your own terminal with the real `DIRECT_URL`, not something you ask Claude to run for you.
