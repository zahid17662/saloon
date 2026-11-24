# Full-system test guide (ECC + Claude Code)

**Goal:** find every bug before the client does. Use one round per Claude session, in order.
After each round: Claude logs the bugs in `docs/BUGS.md`, fixes them with a test first, and commits. Then you start the next round.

**What already exists:** Vitest unit + server tests (`src/lib/*.test.ts`, `src/server/*.test.ts`), 34 Playwright E2E tests in `e2e/` (mobile 375px + desktop) against the dedicated E2E Neon branch in `.env.test`.

## ECC tools used for testing

| Round | ECC skill / agent | What it catches |
|---|---|---|
| T0 | `/ecc:verify` / `ecc:verification-loop` | build, types, lint and tests: what's broken today |
| T1 | `/ecc:test-coverage`, `ecc:pr-test-analyzer` agent, `ecc:tdd-workflow` | business rules with no tests |
| T2 | `ecc:database-reviewer` agent, `ecc:postgres-patterns` | double sales, wrong totals, race conditions |
| T3 | `ecc:security-review`, `ecc:security-reviewer` agent | login bypass, unprotected actions, injection |
| T4 | `ecc:click-path-audit`, `ecc:silent-failure-hunter` agent | buttons that "work" but leave the wrong state, swallowed errors |
| T5 | `ecc:e2e-testing`, `ecc:e2e-runner` agent, `ecc:browser-qa` | real user flows in a real browser |
| T6 | `ecc:frontend-a11y`, `ecc:bengali-reviewer` agent, chrome-devtools Lighthouse | phone usability, Bangla text, speed |
| Fix | `/ecc:orch-fix-defect` | each bug: failing test → fix → review → commit |
| Final | `/ecc:quality-gate`, `/ecc:code-review`, `ecc:production-audit`, `ecc:canary-watch` | go / no-go, then watch the live site |

**Safety rule for every round:** tests may only use the Neon **E2E** branch (`.env.test`) or the **dev** branch. Never touch `main`. Never print `.env*` values.

---

## T0: baseline (where are we?)
```
Use the ecc:verification-loop skill (/ecc:verify).
Run, in this order, and capture the real output: npm run typecheck, npm run lint, npm test, npm run build, npm run test:e2e.
Do not fix anything yet. Create docs/BUGS.md with a table: ID | Area | Severity (critical/high/medium/low) | Steps to reproduce | Expected | Actual | Status. Log every failure, warning or flaky test you see.
Give me a PASS/FAIL report per command.
```

## T1: find untested business rules
```
Use /ecc:test-coverage and the ecc:pr-test-analyzer agent. Read docs/PRD.md §5, §6 and §12 and CLAUDE.md.
Make a list of every business rule and acceptance criterion, and for each one say which test covers it (file:line) or "NOT TESTED".
Then use the ecc:tdd-workflow skill to add missing tests for at least these edge cases:
- money split: odd totals (e.g. ৳75 at 50% → 38/37 and they always add up to the total), 0% and 100% commission, a commission change after a sale (old sales keep the snapshot)
- service price change after a sale: old receipts and reports don't change
- qty limits (0, 1, 20, 21), an empty cart, an inactive barber or service, a deleted/inactive service in an old sale
- Asia/Dhaka boundaries: a sale at 23:59 and 00:01 Dhaka time lands on the right day; month change; "today" when the server is in UTC
- void: barber at 9:59 vs 10:01 min, a barber voiding another barber's sale, double void, voided sales excluded from every total and from the payout balance
- payouts: delete at 23h59 vs 24h01, a payout larger than the balance (what does the PRD say?), negative or zero amount
- back-dated sale (FR-22): 60 days back OK, 61 blocked, future blocked
Any test that fails means a real bug: log it in docs/BUGS.md and don't change the test to make it pass. Report coverage before and after.
```

## T2: database and data integrity
```
Use the ecc:database-reviewer agent and the ecc:postgres-patterns skill on src/db/, src/server/ and src/db/migrations/.
Check and prove with tests (on the test DB, never main):
1. Idempotency: the same createSale request sent 5 times at the same time (Promise.all) creates exactly 1 sale.
2. Transactions: if inserting a sale item fails, no half-saved sale is left behind.
3. The DB CHECK constraints (shares_sum, qty_range, price_positive, amount_positive) really reject bad rows.
4. The SQL reports equal the src/lib/reports.ts oracle on a random dataset of 500 sales with voids across 3 months (property-style test).
5. Indexes exist for the report queries (EXPLAIN on the dashboard/report queries).
6. The seed is idempotent and migrations apply cleanly on an empty database.
Log findings in docs/BUGS.md, then fix with a failing test first.
```

## T3: security attack test
```
Use the ecc:security-review skill and then the ecc:security-reviewer agent on the whole repo.
Act like an attacker and write automated tests where possible:
- Call every Server Action in src/app/actions and src/server directly (no UI) without cookies, with a barber/shop cookie only, and with a tampered or expired cookie. Every admin action must refuse.
- Change the cookie payload or signature, reuse a cookie after the shop code changes (shopCodeVersion), and an admin cookie after logout.
- Rate limit: 6 wrong PINs → blocked; check it can't be bypassed by changing the X-Forwarded-For header when TRUST_PROXY_HEADERS is off.
- Input: negative/huge numbers, decimals, very long names, HTML/script in barber and service names (XSS), CSV injection (a name starting with = + - @ in the CSV export), SQL-looking strings.
- Barber A voiding barber B's sale; reading another receipt by changing the id in the URL (what does the PRD allow?).
- The backup route is admin-only, and no secret or env value is in the client bundle (search .next/static for DATABASE_URL, SESSION_SECRET, "neon.tech").
- Security headers are present on every page.
Report findings as CRITICAL/HIGH/MEDIUM/LOW in docs/BUGS.md. Fix every CRITICAL and HIGH with a test first.
```

## T4: every button, every state
```
Use the ecc:click-path-audit skill, then the ecc:silent-failure-hunter agent.
For EVERY button, form and link on every screen (unlock, barber screen, cart, receipt, and all /admin pages), trace the full path: click → client handler → server action → DB → revalidate → what the screen shows.
Find:
- buttons that succeed on the server but the screen still shows old data (stale UI)
- errors that are caught and hidden (empty catch, a generic "success" after a failure, missing Bangla error message)
- double-click/double-submit problems, buttons not disabled while saving
- what happens when the network is slow or the DB is down (the user must see a clear Bangla error, and no data must be lost or duplicated)
- dead links, wrong redirects after login/logout, the back button after logout
Make a table: Screen | Control | Result | Bug?. Log the bugs in docs/BUGS.md.
```

## T5: real browser end-to-end
```
Use the ecc:e2e-testing skill and the ecc:e2e-runner agent.
1. Run the full Playwright suite (npm run test:e2e) 3 times in a row. Any test that fails even once is flaky: find the real cause, don't add sleeps or retries.
2. Compare e2e/ with docs/PRD.md §12 and §17. Add missing journeys, at least: a full working day (3 barbers, 15 sales, 2 voids, 1 payout → dashboard, reports and barber balance all match hand-calculated numbers); the shop code change logging out a second browser; a price change then old receipt reprint; CSV export opened and checked; print receipt page layout (58mm and 80mm).
3. Then use the ecc:browser-qa skill on the local production build (npm run build && npm start): check console errors, layout at 375 / 768 / 1280px, and slow 3G behaviour. Use the chrome-devtools MCP for screenshots.
Log every problem in docs/BUGS.md.
```

## T6: phone usability, Bangla and speed
```
1. The ecc:frontend-a11y skill: keyboard navigation, focus trap in modals, labels, 44px tap targets, colour contrast; run axe on every page.
2. The ecc:bengali-reviewer agent: all UI text, Bangla digits everywhere money/dates show, consistent words (e.g. always the same word for "sale", "void", "payout"), the receipt in Bangla.
3. Lighthouse (chrome-devtools MCP lighthouse_audit) on /unlock, the barber screen and /admin, in mobile mode: report Performance, Accessibility, Best Practices. Target ≥ 90 for accessibility and best practices.
Log the issues in docs/BUGS.md.
```

---

## Fixing bugs (use this after any round)
```
Open docs/BUGS.md. Take the open bugs in severity order (critical first).
For each bug use /ecc:orch-fix-defect: write a failing test that reproduces it, fix the smallest correct thing, run the related tests, mark it Fixed in docs/BUGS.md with the test name, and commit "fix(<area>): <bug id> <short title>".
After every 5 bugs run npm run typecheck && npm run lint && npm test. Stop and ask me if a fix needs a PRD/business-rule decision.
```

## Final go / no-go
```
Run /ecc:quality-gate, then /ecc:code-review on everything since the last release commit, then the ecc:production-audit skill.
Re-run: typecheck, lint, test, build, test:e2e (all must pass with 0 failures).
Check docs/BUGS.md: no open critical/high bugs.
Check docs/PRD.md §17 item by item with evidence.
Give me a final SHIP / DO-NOT-SHIP verdict with the reasons.
```

## After deploying to Vercel
```
Use the ecc:canary-watch skill on <your Vercel URL>: check the pages load, no console errors, /unlock works, response times are fine, and the security headers are present. Do NOT create real sales on production; only read-only checks.
```

---

## Your own manual test (30 minutes, on a real phone)
Claude can't replace this. Do it on the deployed **preview** URL, not production data.
1. Open on an Android phone with Chrome and add it to the home screen.
2. Unlock with the shop code, choose a barber, add 2 services, save, and check the receipt numbers.
3. Tap Save twice fast: there must be only one sale.
4. Void within 10 minutes. Try again after 10 minutes (it must be blocked).
5. Log in as admin with a wrong PIN 6 times (you should get blocked), then the right PIN.
6. Check today's dashboard: do the numbers match your paper calculation?
7. Pay a barber, check the balance, and print or save a receipt.
8. Change the shop code: the phone must ask for the code again.
9. Turn off Wi-Fi and try to save: you should see a clear Bangla error and nothing should be lost.
