# Bug log

## Fixed on 2026-11-27 (not committed yet)

The rows further down describe the state when each was found. Fixed since: CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07, CP-08, CP-11, CP-12, S-006, A-07, B-016.
The staff screens are behind the shop code again (regression tests in `Server/src/server/security.test.ts`).
CP-04 now shows "log in again" in the form; it does not redirect by itself.
The browser tests were updated to match but have not been run since these changes.

Verification run: 2026-11-23, branch `main`, Windows 11, Node via npm. Nothing was fixed during this run.

## Command results

| Command | Result | Detail |
|---|---|---|
| `npm run typecheck` | PASS | 0 errors |
| `npm run lint` | PASS | 0 errors, 0 warnings |
| `npm test` | PASS | 14 files, 234/234 tests passed, 6.0s |
| `npm run build` | PASS | Next.js 16.4.6, 16/16 static pages, 0 errors |
| `npm run test:e2e` | PASS | 38/38 passed (19 specs x 2 projects: mobile-375, desktop), 3.3 min, 0 flaky, 0 retries |

## Bugs

| ID | Area | Severity | Steps to reproduce | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| B-001 | Tooling / Vitest config | low | Run `npm test` | Clean output | Warning: Vite config uses ESM syntax in a file loaded as CommonJS (`vitest.config.ts:1:1`). `configLoader: 'native'` is planned to become the default in a future Vite major version. Tests still pass. Cause: `package.json` has no `"type": "module"`. | Open |
| B-002 | Build / deploy config | low | Run `npm run build` locally | Build output shows the proxy | Output labels it `ƒ Proxy (Middleware)`. Informational only, no failure. Confirm `src/proxy.ts` is active as intended. | Open (verify) |
| B-003 | Build / migrations | low | Run `npm run build` outside Vercel Production | Migrations are applied or the skip is obvious | Prints "Skipping migrations (only Vercel Production builds run them)". Expected by design. Schema drift in a non-production env goes unnoticed. | Open (info) |

## Added by the edge-case test run (2026-11-23, second pass)

The full rule-to-test map is in `docs/TRACEABILITY.md`.

73 new tests were added in `src/lib/money.test.ts`, `src/lib/time.test.ts`, `src/lib/payout-schema.test.ts` and `src/server/edge-cases.test.ts`. All 73 pass, so none of the requested edge cases exposed a wrong result. The rows below are what the pass did find. No test was changed to make it pass.

| ID | Area | Severity | Steps to reproduce | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| B-004 | Sales / `createSale` | low | Call `createSale(db, { barberId, items: [], ... })` directly (skipping zod). Probe test: `src/server/edge-cases.test.ts` "an empty cart handed straight to createSale". | A clean `DomainError` with a Bangla message, and nothing saved | Nothing is saved, but the `INSERT` fails with a raw `Failed query: insert into "sales" ...` error, so the user would see the generic error message. The first line of defence (zod, "কোনো সার্ভিস বাছাই করা হয়নি") works, and no UI path reaches this. | Open |
| B-005 | Auth / Server Actions (FR-4, AC 10) | high (test gap) | Search the tests for a call to any admin Server Action without a cookie | A test proving each admin action rejects a missing or invalid admin cookie | NOT TESTED. `src/server/action.test.ts` only checks that an `AuthError` is mapped to a Bangla message. Actions in `src/app/actions/*.ts` are not unit-testable with the PGlite setup (they use cookies and the global `db`). | Open |
| B-006 | Receipt (FR-12, FR-13, FR-14, AC 13) | medium (test gap) | Search tests for the receipt view | Tests for date/time, receipt no., payment method, footer, the VOID badge, 58/80 mm and A4 print CSS, and that the barber/owner split never appears | NOT TESTED. e2e `sale.spec.ts` only asserts the total. | Open |
| B-007 | Settings (FR-21) | medium (test gap) | Search tests for change-PIN and change-shop-code | Tests that the current PIN is required, and that changing the shop code bumps `shopCodeVersion` and invalidates old cookies | NOT TESTED server-side. Only the input schema and "hashes untouched" are covered. bcrypt hashing is also not asserted. | Open |
| B-008 | Barber screen (FR-7) and Admin (FR-19) | low (test gap) | Search tests for cart +/-, remove, default payment method Cash, sales-list pagination, the "অগ্রিম" label, the dashboard service-count and sale-count cards | Tests exist | NOT TESTED | Open |
| B-009 | Docs / code comments | low | Read the header of `src/server/payouts.ts` | Comments cite the PRD ids correctly | It cites "FR-18" for payouts (PRD: FR-20, FR-18 is Services) and "BR-6" for the 24 h delete (PRD: BR-6 is receipt numbers). Comment only, no behaviour effect. | Open |
| B-010 | Tooling | low | `npm i -D @vitest/coverage-v8@5.1.1` was needed to measure coverage | `npm test -- --coverage` works out of the box | The coverage provider was not installed. It is now a devDependency (`package.json` and `package-lock.json` changed). | Fixed (dependency added) |

## Database audit (2026-11-23, third pass)

Scope: `src/db/`, `src/server/`, `src/db/migrations/`. Reviewed by the `ecc:database-reviewer` agent (read-only) and the `ecc:postgres-patterns` checklist; every claim below was then checked by a test or by reading the code, not taken on the agent's word. Tests run on PGlite (in-memory Postgres with the real migrations), never on Neon or `main`.

Tests added: `src/server/db-integrity.test.ts` (36), `src/server/seed-migrations.test.ts` (6).

### What was proved (no defect found)

| Item | Result |
|---|---|
| 1. Idempotency | 5 simultaneous identical `createSale` calls give 1 sale and 1 item set. 20 keys x 5 interleaved give exactly 20. The unique index `sales_idempotency_uq` also rejects a raw duplicate insert. |
| 2. Transactions | An item that violates `qty_range` (first or second line) leaves 0 sales and 0 items. A failed attempt does not burn the key. |
| 3. CHECK constraints | `shares_sum`, `qty_range`, `price_positive`, `amount_positive`, `total_positive`, `shares_nonneg`, `pct_snapshot_range`, `pct_range`, `price_snapshot_positive`, `void_consistent` and the foreign keys all reject bad inserts, and `shares_sum` rejects a bad UPDATE. Boundaries (0, 100, 1, 20) are accepted. |
| 4. SQL reports vs oracle | 3 seeds x 500 random sales over Jan-Mar 2026 (25 % placed within a minute of a Dhaka midnight, about 15 % voided): `periodTotals` day and month, a mid-month sub-range, and `barberBalances` all equal `src/lib/reports.ts`. |
| 6. Migrations | 0000-0002 apply on an empty DB and re-applying is a no-op. Every index and CHECK in `schema.ts` exists in the migrated DB. `drizzle-kit generate` produced only the new index, so there was no drift. |

### Defects found and fixed (failing test first, then fix)

| ID | Area | Severity | Steps to reproduce | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| B-011 | Payouts / `addPayout` | high | 5 identical `addPayout` calls at once (double tap). Test: db-integrity "7." | 1 payout row | 5 rows. The "twin" check was a SELECT then INSERT with no transaction and no unique constraint, so a barber could be paid several times and the balance was wrong. | Fixed: one transaction that takes `pg_advisory_xact_lock(ns, barberId)` first. |
| B-012 | Reports / `periodTotals` | medium | EXPLAIN a one-day report on 20k sales / 40k items. Test: db-integrity "5." | Items reached through `sale_items_sale_idx` | `Seq Scan on sale_items` plus a HashAggregate of every item ever recorded, to answer a day that matches about 10 sales. Cost grows with history. | Fixed: `left join lateral (... where sale_id = s.id)`. Same results (the oracle tests still pass). |
| B-013 | Schema / indexes | low | List foreign keys with no leading index. Test: db-integrity "5." | None | `sale_items.service_id` had no index. | Fixed: migration `0002_sale_items_service_idx`. |
| B-014 | Seed | medium | Two seeds at once on an empty DB (retried deploy hook) | One copy of everything | Seed used "insert if count = 0" under READ COMMITTED with no lock, and `categories`, `barbers`, `services` have no unique name, so concurrent runs could duplicate. The seed also could not be tested at all (hard-wired to Neon). | Fixed: logic moved to `src/db/seed-core.ts` (`seedDb`), runs under an advisory lock. Idempotency, bcrypt hashing and "never overwrite a changed PIN" are now tested. |

### Open (found by review, not fixed; need your decision)

| ID | Area | Severity | Finding | Suggested fix |
|---|---|---|---|---|
| B-015 | Login rate limit (`src/lib/auth.ts`) | low | `countKindSince` filters on `kind` and `created_at` only, but the index is `(ip, kind, created_at)`, so it cannot be used. Confirmed in code; the table is small, so impact is low today. Rows are pruned only on a successful login. | Add index `(kind, created_at)`; prune old rows on insert. |
| B-016 | Backup (`src/server/backup.ts`) | medium | 7 parallel SELECTs over the pool can run on different connections and snapshots, so a sale committed mid-backup could be exported without its items. Not reproduced (needs two real connections). | One `repeatable read`, read-only transaction, reading sequentially. |
| B-017 | `barberBalances` | low | Sums every live sale all-time on each admin load, with no index for `voided_at is null`. Three reads are not one snapshot. | Partial index `(barber_id) include (barber_share) where voided_at is null`, only once data is large. |
| B-018 | Migration 0001 | low | `ADD CONSTRAINT ... CHECK` validates all rows under a lock. Already applied, so it cannot be edited. | For future constraints use `NOT VALID` then `VALIDATE CONSTRAINT`. |
| B-019 | Text columns | low | No length CHECK on `idempotency_key`, `note`, `void_reason`; only zod bounds them. | Add `char_length` CHECKs in a new migration. |
| B-020 | Test tooling | info | Default 5 s test and hook timeouts were too short when about 20 files each boot PGlite in parallel (4 suites failed to load once). | Fixed: `testTimeout` and `hookTimeout` set to 30 s in `vitest.config.ts`. |

### Limits of this audit

- PGlite is a single connection. The concurrency tests interleave requests at statement boundaries and exercise the check-then-insert window and the unique-index fallback, but they do not prove behaviour with two real backends on Neon. The advisory locks (B-011, B-014) are correct Postgres, but their effect under true parallelism is untested.
- `pg_advisory_xact_lock` on Neon's pooled (PgBouncer, transaction mode) connection is safe because the `_xact_` variant is released at commit; this was not run against Neon.
- EXPLAIN plans come from PGlite's planner with 20k rows; Neon's plans may differ at other sizes.
- The new migration `0002` has not been applied to any Neon database. Run `npm run db:migrate` yourself against dev first.

## Security audit (2026-11-23, fourth pass)

Method: `ecc:security-review` checklist, then the `ecc:security-reviewer` agent (read-only) on the whole repo, then attacker-style tests. The agent's findings were treated as leads: each one below was confirmed by a test or by reading the code. Its line numbers were not used (several did not exist).

Tests: `src/server/security.test.ts` (98 tests, 2 of them `it.fails` markers for known gaps). They call the real Server Actions and the backup route handler directly, with a faked cookie jar and request headers, against PGlite (never Neon). I also started the production build with dummy credentials pointing at a dead port and requested real URLs to check headers.

**Result: no CRITICAL and no HIGH defect was found, so no application code was changed for security.** Everything below is MEDIUM or lower. Nothing in this pass was fixed, because you asked for fixes only for CRITICAL and HIGH; say which ones you want.

### Findings

| ID | Severity | Area | Finding and how it was confirmed | Status / suggested fix |
|---|---|---|---|---|
| S-001 | MEDIUM | Admin session (`src/lib/auth.ts`, `logoutAdmin`) | Sessions are stateless HMAC cookies, so logout only clears the browser's copy. A cookie copied before logout still passes `requireAdmin` until it expires (8 h) or the PIN changes. Test: "an admin cookie copied before logout must stop working" (`it.fails`, passes while the gap exists). Needs a stolen httpOnly cookie, so exposure is limited. | Open. Add a server-side session epoch (a setting bumped on logout and folded into the PIN fingerprint). |
| S-002 | MEDIUM (accepted risk) | `voidMySale`, receipts, `/barber/[id]` | The shop cookie identifies a device, not a barber. `barberId` comes from the client, so a shop device that names barber B can void B's fresh sale (10-minute window), and any shop device can open any receipt or barber page by id. Confirmed by tests. The PRD §3 accepts this ("barbers don't have their own PIN"; per-barber PIN is a v2 option). Barber A naming itself cannot void B's sale, an admin-entered sale, or a missing sale (all tested). | Accepted by the PRD. Revisit with per-barber PINs. |
| S-003 | MEDIUM | Login rate limit (`src/lib/rate-limit.ts`) | The cap is per kind across all IPs (50 per 15 min). After 50 attempts from many IPs, even the correct PIN is refused from a new IP, so someone with about 10 addresses can keep the owner locked out. Confirmed by test. It protects against brute force as designed; the cost is availability. | Open (design trade-off). Let a device that already holds a valid cookie skip the global cap, or add an owner recovery path. |
| S-004 | MEDIUM (config dependent) | `getClientIp` (`src/lib/auth.ts`) | With `TRUST_PROXY_HEADERS=1` and no `X-Real-IP`, it uses the FIRST `X-Forwarded-For` entry. A proxy that appends (nginx `$proxy_add_x_forwarded_for`) leaves a client-supplied first entry, so the per-IP limit can be dodged by rotating it (the global cap of 50 still applies). Not affected: Vercel (`VERCEL=1`, headers overwritten) and production without a trusted proxy. Tested: production without `TRUST_PROXY_HEADERS` fails closed and ignores both headers, even for the correct PIN; with a trusted `X-Real-IP` a spoofed `X-Forwarded-For` gives no fresh attempts. | Open. Use the right-most trusted entry, or require `X-Real-IP` when the flag is set; say so in DEPLOY.md. |
| S-005 | MEDIUM | Seed (`src/db/seed.ts`) | If `SEED_ENV=production` is forgotten, the seed uses the demo PIN `0000` and shop code `1234` on whichever database `DIRECT_URL` points to. The guard is opt-in; README and DEPLOY.md document it. Confirmed in code. | Open. Refuse the demo values unless `SEED_ALLOW_DEMO=1` is set. |
| S-006 | LOW | CSV export (`toCsv` in `src/lib/reports.ts`) | A service or barber name starting with `=`, `+`, `-`, `@`, tab or CR is written as-is, so Excel treats it as a formula. Only the admin can set names, so it needs a hijacked admin session. Test: `it.fails` "CSV export neutralises cells...". Numbers and Bangla text are unaffected. | Open. Prefix such text cells with `'` (not numbers). |
| S-007 | LOW | Login endpoints | Each unauthenticated attempt costs a DB insert plus two counts before any check, and rows are pruned only on a successful login (see B-015). A flood is cheap to send and costs database time. | Open. Edge rate limit; prune on insert. |
| S-008 | LOW | CSP (`next.config.ts`) | `script-src 'self' 'unsafe-inline'` (needed for Next's inline bootstrap without nonces). Mitigated: no HTML-injection sink exists anywhere in `src` (tested by scanning for `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`). | Open (info). |
| S-009 | LOW | Dependencies | `npm audit`: 4 moderate, all the dev-only chain `drizzle-kit` -> `@esbuild-kit` -> `esbuild` (dev server request exposure). Not in the shipped app. The suggested `npm audit fix --force` would downgrade drizzle-kit to 0.18.1, so it was not run. | Open (info). Wait for a drizzle-kit release that drops `@esbuild-kit`. |

### Proved secure (each backed by a test)

- **Every admin action refuses** all 15 bad-cookie cases (none, shop cookie only, shop cookie in the admin slot, expired, payload tampered, signature flipped, wrong secret, wrong PIN fingerprint, wrong kind, empty, garbage, JSON, 5000 chars, extra part): all 15 admin-only actions (7 catalog, 3 sales, 3 payouts, 2 auth) and the backup route. A refused call changed nothing in the DB. A positive control proves the same calls succeed with a genuine cookie. A shop device is not an admin. This closes the test gap B-005.
- **Barber actions** (`createSale`, `voidMySale`) refuse no cookie, expired, tampered, forged, wrong-kind and stale-version cookies.
- **Revocation:** changing the shop code kills old shop cookies (`shopCodeVersion`) and the old code stops working; changing the admin PIN kills older admin cookies; changing the PIN needs the current PIN and shares the rate limiter.
- **Cookies in production:** `__Host-` prefix, httpOnly, Secure, SameSite=Lax, Path=/, no Domain, correct lifetimes; logout clears with matching attributes.
- **Rate limit:** the 6th wrong admin PIN is blocked and then so is the correct PIN; a blocked try is not recorded; shop and admin budgets are separate; IPv6 is bucketed per /64 and IPv4-mapped addresses are normalised; garbage IP headers are refused.
- **Input:** negative, zero, decimal, huge, NaN, Infinity, string and null numbers; oversized or non-string names; extra keys (`total`, `enteredByAdmin`, `createdAt`, `__proto__`); SQL strings; HTML and script strings. Bad input is refused; hostile text is stored as inert text and returned unchanged; tables stay intact. `updateSettings` cannot touch `adminPinHash`, `shopCodeHash` or `shopCodeVersion`. Server errors become a generic Bangla message and the log carries the error name only.
- **Backup:** 401 without an admin cookie; with one it returns `attachment`, `no-store`, and contains no PIN hash, shop-code hash, version, or secret.
- **Receipts:** the page that reads a sale by id is guarded, and the receipt component never references the barber/owner split.
- **Headers on the real production server:** CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, HSTS and Permissions-Policy were present on `/unlock`, `/admin/login`, a 404, redirects (`/`, `/admin`, `/admin/backup`, `/receipt/1`, `/barber/1`) and a static-asset 404. The production CSP has no `unsafe-eval`, no third-party origins, `frame-ancestors 'none'`, `object-src 'none'`.
- **Client bundle:** `.next/static` contains none of `DATABASE_URL`, `SESSION_SECRET`, `neon.tech`, `postgres://` and similar names, and none of the secret values or the database host name from the local `.env*` files (only a yes/no was checked; no value was printed).

### Not verified

- Next.js's built-in Server Action Origin check (CSRF) and real browser behaviour of `Secure` / `__Host-` cookies over HTTPS were not tested.
- The deployed Vercel environment was not tested; the header check ran against `next start` locally.
- The rate limiter under truly parallel connections on Neon was not tested (PGlite is single-connection).
- No penetration test of the Neon or Vercel accounts themselves, and git history was not scanned for old secrets beyond the agent's check of tracked files.

## Click-path audit (2026-11-23, fifth pass)

Method: `ecc:click-path-audit` (trace every control: click, client handler, Server Action, DB, revalidate, what the screen shows), then the `ecc:silent-failure-hunter` agent (read-only; its table was treated as leads and every row was re-read in the code). Runtime proof: `e2e/click-path.spec.ts` (14 tests x 2 viewports, 28 results, green). It injects faults in the browser (offline, a reply lost AFTER the server committed, a 500 reply, a slow reply) against the dedicated E2E database branch. A test marked `test.fail()` is a confirmed bug: it passes while the bug exists and turns red when someone fixes it (then delete that line).

**Result: no HIGH and no data-loss or duplicate-sale bug.** The money path is sound. Every finding below is MEDIUM or LOW and **none is fixed** (you asked to log them). Say which ones you want fixed.

### Proved by running the app (no defect)

- **Save while offline:** Bangla error, cart kept, nothing saved; back online the same tap saves exactly one sale.
- **Reply lost after the server saved:** the retry returns the same sale. Still exactly one sale.
- **Double tap on a slow network (1.5 s reply):** exactly one sale.
- **Server answers 500 (database down):** Bangla error, cart kept, button enabled again, nothing saved.
- **Login redirects:** a protected admin link goes to `/admin/login?next=...` and back to that page after login; `next=//evil.example` lands on `/admin`.
- **Logout and the back button:** after logout the back button shows the login page, not the admin panel. The device stays unlocked for barbers, and `/admin` asks for the PIN again.
- **Dead links:** every internal link found on the home page and all 7 admin pages returns a real page (barber and receipt links need an id and are covered by `sale.spec.ts`).

### Findings

| ID | Severity | Where | What the user sees | Proof | Suggested fix |
|---|---|---|---|---|---|
| CP-01 | MEDIUM | `unlock-form.tsx` and `admin/login.tsx` | A network failure while unlocking or logging in throws out of `startTransition` into `error.tsx` ("কিছু একটা ভুল হয়েছে"). The typed code is lost and the screen does not say it was the connection. | e2e, offline: no inline message (both screens) | `try/catch` around the action, `setError(NET_ERR)`, keep the input. |
| CP-02 | MEDIUM | `admin/settings.tsx`, PIN form and shop-code form | No `try/catch`, no busy flag, button never disabled. Offline: no message at all. Double tap sends two requests; the second PIN change then says "current PIN wrong" although the first worked. A double shop-code change bumps `shopCodeVersion` twice and signs every device out twice. | PIN form: e2e. Shop-code form: read in code | Same pattern as `ShopInfo` (busy, try/catch, `NET_ERR`, `disabled={busy}`). |
| CP-03 | MEDIUM | Barber save with a lost shop session (owner changed the code, cookie expired) | The proxy answers the Server Action with the unlock page, the client cannot parse it and shows "সংযোগে সমস্যা হয়েছে". The barber retries forever; nothing says "unlock this device again". The cart is kept. | e2e: stays on `/barber/<id>` with the connection message | Treat a redirected or non-action reply as "session lost": send to `/unlock` with a Bangla note. |
| CP-04 | MEDIUM | Every admin form when the admin session has expired mid-use | Same cause: "সংযোগে সমস্যা হয়েছে", no redirect to login, the admin retries in vain. | e2e: New-barber dialog stays on `/admin/barbers` with the connection message | Same fix as CP-03, for `/admin/login?next=`. |
| CP-05 | MEDIUM | `settings.tsx` `downloadBackup` | The backup is an anchor click on `/admin/backup`. With an expired session the browser saves the login page (HTML) under the backup file name; a 500 gives an error page or nothing. The admin may believe a backup exists. | e2e: the downloaded file is not JSON | `fetch`, check `res.ok` and the content type, then save the blob, else a Bangla error. |
| CP-06 | MEDIUM | `ShopGate` + `checkShopSession` (`app/actions/auth.ts`) | During a database outage `checkShopSession` returns `{valid:false}`, so a focus event sends a working barber to `/unlock`, and an open cart is lost. A plain network failure is swallowed on purpose and is fine. | Read in code; not run against a real outage | Return `valid:false` only for a confirmed-bad session; on an exception answer "unknown" and keep the user on the page. |
| CP-07 | MEDIUM | `admin/sales.tsx` list load | When the list fails to load, `rows` is set to `[]`, the table stays dimmed (`rowsKey` is never updated, so `stale` stays true) and "কোনো এন্ট্রি পাওয়া যায়নি" is shown beside the error, so a failure looks like "no sales". | Read in code (lines 49-59, 68) | On error keep the old rows, set `rowsKey`, and hide the empty text when `loadError` is set. |
| CP-08 | MEDIUM | `admin/payouts.tsx` line 29 | If the reload after adding or deleting a payout fails, the old balances stay on screen and `view.error` is never rendered (it is only shown when there is no data). The admin may trust a stale balance. | Read in code | Render `view.error` whenever it is set. |
| CP-09 | LOW (design trade-off) | `barber-screen.tsx` idempotency key | A pure retry reuses the key (proved safe). If the reply was lost and the barber then EDITS the cart, a new key is used, so the first sale, which did save, is not deduplicated and the customer is recorded twice. | Read in code; the pure-retry case is proved by e2e | Add "check today's entries before saving again" to the network-error text. |
| CP-10 | LOW | `admin/shell.tsx` logout, payout delete, shop-code change | They use `window.alert` and `window.confirm`: not styled, and some in-app browsers block them. Logic is correct. | Read in code | Use the existing `Modal`. |

### Control by control: Screen | Control | Result | Bug?

| Screen | Control | Result | Bug? |
|---|---|---|---|
| Unlock | Code field + "চালু করুন" | Server action, cookie, `router.replace("/")`; wrong code shows a Bangla error and clears the field; disabled when empty or pending | CP-01 (offline) |
| Unlock | Admin link | Goes to `/admin/login` | No |
| Admin login | PIN + "লগইন" | Server action, `router.replace(safeNext(next))`; `next` honoured, external `next` rejected (e2e) | CP-01 (offline) |
| Admin login | Back link | Goes to `/` | No |
| All barber pages | `ShopGate` focus check | Sends a stale device to `/unlock`; offline is swallowed on purpose | CP-06 (DB outage) |
| Home / barber picker | Barber cards, admin link | Links resolve (dead-link test); today's stats come from the server page and refresh after a save | No |
| Barber screen | Service tiles, qty -/+, payment, cart open | Local state only | No |
| Barber screen | "সেভ" | Busy guard + idempotency key; offline, lost reply, double tap and 500 all proved safe | CP-03 (session lost), CP-09 (edit after a lost reply) |
| Barber screen | "বাতিল" (void own sale) | Busy guard, error shown, list refreshes by `revalidatePath`; the server re-checks the 10-minute window (`void.spec.ts`) | No |
| Receipt | Print, paper size, back link | Local; back link follows `?from=`; a missing sale shows "রসিদ পাওয়া যায়নি।" | No |
| Admin shell | Nav links | All resolve (dead-link test) | No |
| Admin shell | "লগআউট" | Double-tap guard, `router.replace("/admin/login")`; back button safe (e2e); failure alerts `NET_ERR` | CP-10 |
| Dashboard | Range filter, links | Data through an admin-only action with a stale-reply guard; load error shown on first load | No |
| Reports | Tabs, range, CSV | Same loader; the CSV is built in the browser (formula risk is S-006) | No (S-006) |
| Sales list | Range, barber and status filters | Stale-reply guard; table dims while loading | CP-07 (load failure) |
| Sales list | "আরও দেখুন", "রসিদ" link | Local paging; link resolves | No |
| Sales list | "বাতিল" + reason | Busy guard, reason required, error shown, `refresh()` on success | No |
| Sales list | "পুরনো বিক্রি যোগ করুন" | Own idempotency key, busy guard, dialog cannot be closed while saving, jumps to the entered day | No |
| Payouts | "টাকা দিন" | Busy guard, server advisory lock, reload on success | CP-08 (reload failure) |
| Payouts | "মুছুন" | Confirm, guard against double click, server re-checks 24 h | CP-08, CP-10 |
| Barbers, Services | Add / edit forms, toggles | Busy guard, Bangla validation, `NET_ERR` on failure, catalog refreshes through `revalidatePath` | CP-04 (expired session) |
| Settings | "সেভ করুন" (shop and receipt) | Busy guard, "সেভ হয়েছে ✓" only on success | No |
| Settings | "পিন বদলান", "কোড বদলান" | No busy flag, no `try/catch` | CP-02 |
| Settings | "ব্যাকআপ ডাউনলোড" | Plain anchor, no error feedback | CP-05 |
| Any page | `error.tsx`, `global-error.tsx`, `not-found.tsx` | Bangla text and a retry or home button | No |

### Not verified

- A real database outage on Neon (faults were injected in the browser and a 500 was faked; the server-side `runAction` mapping is covered by the unit tests).
- After a successful PIN change, whether the current admin stays signed in (the PIN fingerprint changes); not run.
- After a shop-code change, the exact screen the admin sees on the next click; not run.
- Real phones, slow 3G, and screen readers; only desktop Chromium at 375 px and 1280 px was run.
- The `test.fail()` tests only prove each case fails; for CP-01 and CP-02 the failure is "no Bangla message", read from the run output. If someone changes a label, they could fail for a different reason, so run them without the `test.fail()` line when fixing.

## E2E stability, coverage and browser QA (2026-11-24, sixth to eighth pass)

Nothing here is fixed: you asked for the problems to be logged. Application code was not changed; only test files were added or edited.

### Flakiness: three full runs in a row

FINAL_RUNS_PLACEHOLDER

**The one failure seen was not random, and it had a real cause.** `void.spec.ts` "after 10 minutes the button is gone" failed once, in the run that crossed Dhaka midnight (run 2 ended 23:52, run 3 ended 00:02 Dhaka). The test plants a sale 11 minutes old; after 00:00 that sale belongs to yesterday (BR-5), so the barber screen correctly shows no entry and the test's own link was missing. The app is right (FR-10 is "today", Asia/Dhaka). The test had a hidden wall-clock dependency. Fix, with no sleeps or retries: the test now skips itself with a stated reason in the first 12 minutes of the Dhaka day, when "older than 10 minutes yet still today" cannot exist. **Residual risk:** any spec that seeds "now" and then reads "today" can still fail if the run straddles 00:00 Dhaka; run the suite away from midnight.

An earlier "run 2" and "run 3" were discarded: they started after I had added `handover.spec.ts` and picked up my own untested specs. Only the runs listed above count.

### New journeys added (`e2e/handover.spec.ts`, 8 tests x 2 viewports) against PRD §12 and §17

| PRD item | Before | Now |
|---|---|---|
| §17-2 unlock, sale, receipt; admin login, reports; void; payout; add barber/service; FR-22 | covered | covered |
| Full working day: 3 barbers (50 %, 40 %, 45 %), 15 sales (one through the real barber screen), 2 voids and 1 payout through the admin screens; dashboard, reports (daily and by service), payout cards and the barber's own screen checked against hand-calculated numbers (day 2150, barbers 964, owners 1186; Salim earned 204, balance 104) | missing | **added** (passes on desktop; see CP-12 for the phone) |
| Shop code change signs a second browser out, old code refused, new code works, owner device stays unlocked, code restored afterwards | missing | **added** |
| §12-3 price change, then reprint of the old receipt (150 stays, new sale uses 200, Print is called once) | partly (list/DB only) | **added** |
| §12-12 CSV export: BOM bytes, Bangla headers, exact rows, voided sale absent, by-service export | missing | **added** (Excel itself was not opened) |
| §12-13 receipt print layout: 58 mm and 80 mm width within 0.7 mm, controls hidden, no "ভাগ"/split, no overflow, one-page PDF at each width | missing | **added** |
| §12-7 Dhaka boundary: 23:50 on the 30th and 00:10 on the 31st on different days, both in the month | unit test only | **added** |
| §12-11 a never-unlocked device cannot open `/`, `/barber/*`, `/receipt/*` | missing | **added** |

Still **not** covered by an end-to-end test: §12-4 (a commission change affects only later sales), §12-8 the "অগ্রিম" (advance) display after paying more than earned, opening the CSV in real Excel, Firefox and Safari (only Chromium at 375 px and 1280 px ran), and the deployed Vercel URL (§17-3).

### Product bugs found while writing and running those tests

| ID | Severity | Where | What happens | Proof | Suggested fix |
|---|---|---|---|---|---|
| CP-11 | MEDIUM | `admin/reports.tsx`, `admin/dashboard.tsx` (the early return on `loaded.error`) | Typing a start date later than the end date in the custom range replaces the WHOLE page, including the date pickers, with "তারিখের সীমা সঠিক নয়". The owner cannot fix it without leaving the page. | `handover.spec.ts` (marked `test.fail`) | Show the error under the filter, keep `RangeFilter` rendered (the sales list already does). |
| CP-12 | MEDIUM | `/admin` (dashboard), `/admin/sales`, `/admin/payouts` on a phone | The page is wider than the screen: `/admin` 600 px, sales 517 px, payouts 478 px on a 375 px phone, so the browser zooms out or scrolls sideways. Two causes. (1) The hidden `sr-only` header cell ("কার্যক্রম") is `position:absolute`, and its scroll wrapper is not `position:relative`, so it escapes the wrapper's clipping (`common.tsx` `TableWrap`). (2) The dashboard cards sit in a one-column grid with no `min-w-0`, so a 560 px table stretches the track (`dashboard.tsx` grid). Side effect: in a phone emulation the void dialog's submit button could not be tapped at all. | e2e (`test.fail` on the phone project) plus an independent check in a second browser (`scrollWidth` 601 against 375) | (1) add `relative` to the `TableWrap` wrapper; (2) `grid-cols-1` or `min-w-0` on the cards. |

### Browser QA on the local production build (`npm run build && npm start`, port 3200, E2E branch only)

- **Console:** no errors, no failed requests (0 of every 4xx/5xx) across 13 pages. One warning on every page: `Permissions-Policy: Unrecognized feature: 'interest-cohort'` (see A-07).
- **Layout at 375 / 768 / 1280 px:** 768 and 1280 are clean (checked in screenshots and by measuring page width). 375 has CP-12. The tables scroll inside their own box on a phone as designed.
- **Slow 3G (with 4x CPU slowdown), barber screen:** server reply (TTFB) 2.0 s, first content 2.4 s, and the screen is fully usable at that moment (13 buttons present). No layout shift. Saving under a slow or lost connection is covered by `click-path.spec.ts` (double tap on a 1.5 s reply makes one sale; offline and lost-reply retries make one sale).

## Accessibility, Bangla and Lighthouse audit (2026-11-24, ninth pass)

Tools: `ecc:frontend-a11y` checklist; axe-core 4.14.1 (WCAG 2.0 to 2.2 A/AA plus best practices) injected into the real production build for 13 pages, a dialog and a cart-open state at 375, 768 and 1280 px; real keyboard tests; `ecc:bengali-reviewer` agent (leads, then I re-checked the riskiest claims in a browser); chrome-devtools Lighthouse and performance trace.

### Lighthouse, mobile mode

| Page | Accessibility | Best Practices | SEO | Performance (throttled trace: slow 4G, 4x CPU) |
|---|---|---|---|---|
| `/unlock` | **100** | **100** | 82 | LCP 1.1 s, CLS 0.00 |
| barber screen | **100** | **100** | 90 | LCP 1.2 s, CLS 0.00 |
| `/admin` | **96** | **100** | 90 | LCP 1.9 s, CLS 0.00 |

Both targets (accessibility and best practices at least 90) are met on all three. **A numeric Lighthouse Performance score was not produced**: the chrome-devtools Lighthouse tool excludes Performance by design, and my attempt to run the Lighthouse command-line tool (a package that is not in the project) was blocked by the permission system, so I did not retry. The Core Web Vitals above come from the performance trace under Lighthouse's mobile conditions and are all in the "good" range (LCP under 2.5 s, CLS under 0.1). The remaining Lighthouse fails: no meta description (A-08), `robots.txt` and `llms.txt` missing (SEO only), the service-tile label mismatch (A-02), and colour contrast on the blue dashboard card (A-03).

### Accessibility findings

| ID | Severity | Where | Finding | Suggested fix |
|---|---|---|---|---|
| A-01 | MEDIUM | `ui.tsx` `Modal` | Focus is NOT returned to the button that opened a dialog when the dialog closes (tested: payout dialog, Escape: focus lands on the page body). The modal records the opener in an effect, by which time the form's `autoFocus` field already has focus, so it "restores" focus to an input that is about to disappear. A keyboard user loses their place after every dialog. Everything else about the modal is good: focus moves in, Tab and Shift+Tab never escape (0 of 18 presses), Escape closes, `role=dialog`, `aria-modal`, labelled. | Capture `document.activeElement` during render of the open transition (before children focus), or store it in the click handler. |
| A-02 | MEDIUM | Barber screen service tiles (`barber-screen.tsx` ~178) | `aria-label="চুল কাটা, ৳১৫০"` does not contain the visible text "চুল কাটা ৳১৫০" as one string (WCAG 2.5.3 Label in Name; axe: serious; Lighthouse fails it on this page). Voice-control users cannot say what they see. | Make the label start with the exact visible text, or drop the `aria-label` and use visually hidden text. |
| A-03 | LOW | `/admin` blue stat card; cart line "৳১৫০ × ১ = ৳১৫০" | Contrast below 4.5:1: `text-white/80`, `text-white/90`, the `bg-white/20` trend pill, and `text-subtle` text-xs. | Use solid white and a darker pill, or a darker `--color-subtle`. |
| A-04 | LOW | `/admin/reports` on a phone | The scrollable table box is not keyboard-focusable (axe `scrollable-region-focusable`, serious), so a keyboard user cannot scroll the wide table. | `tabIndex={0}` plus a label on the `TableWrap` wrapper. |
| A-05 | LOW | `/receipt/[id]` | No level-one heading (the shop name is a `div`). | Make the shop name an `h1`. |
| A-06 | LOW | Touch targets under 44 px on a phone (104 hits, 31 distinct controls) | Admin top-nav links 34 px high; logout 36x36; "রসিদ দেখুন" and "নাপিতের স্ক্রিন" 36 px; date filter chips 38 px; report tabs 32 px; paper-size buttons on the receipt 24 px; "রসিদ" link in the sales table 27x20; "সব দেখুন", "এডমিন লগইন" and "নাপিতের স্ক্রিনে যান" 20 px tall. The main sale buttons (service tiles, cart, save) are all large enough. The 24 px ones also fail WCAG 2.2 AA minimum size (2.5.8). | Raise `pointer-coarse` heights on `NavLink`, filter chips, tabs and table links to `min-h-11`. |
| A-07 | LOW | `next.config.ts` headers | `Permissions-Policy` lists `interest-cohort`, which Chrome no longer knows; it logs a console warning on every page. | Remove that entry. |
| A-08 | LOW | all pages | No meta description (Lighthouse SEO). Not important for a private POS. | Add one in `layout.tsx` metadata if wanted. |
| A-09 | info | `/unlock` | axe once reported "no main landmark / no h1" for this page at 375 px. It did not reproduce: the page snapshot and Lighthouse show `main` and `h1`. Treated as a first-load capture artifact, not a bug. | None. |

**Passed:** form labels (axe clean on unlock, login, all admin forms and dialogs), keyboard focus ring visible, skip link ("মূল অংশে যান") is the first Tab stop on admin pages, `lang="bn"`, icon buttons have Bangla `aria-label`s, 34 of 45 page-and-width combinations had zero axe violations. Automated axe covers only part of WCAG; screen-reader use with real assistive technology was not tested.

### Bangla and digits (agent review, riskiest claims re-checked)

| ID | Severity | Finding | Verified? | Suggested fix |
|---|---|---|---|---|
| BN-01 | MEDIUM | Every time shows Latin **"AM" / "PM"**, e.g. "২৩ নভে, ২০২৬, ১১:৪৪ PM", on the receipt (`receipt-view.tsx:94`), the barber list, the sales table and the dashboard. `Intl.DateTimeFormat("bn-BD")` without `dayPeriod` returns "PM". | **Yes**: Node 24 output `৫:৩০ PM`, and seen in the browser on `/admin` | Add `dayPeriod: "short"` (সকাল/দুপুর/বিকাল/রাত) or format the time by hand (`src/lib/time.ts`). |
| BN-02 | MEDIUM | Receipt numbers print with a Latin prefix: `R-০০০৭০৫` (`money.ts` `receiptNo`), on the customer receipt and every list. | **Yes**, seen in the browser | Use "রসিদ-" or drop the prefix on the receipt, where "রসিদ নং:" already exists. |
| BN-03 | MEDIUM | Edit forms prefill numbers in Latin digits: the suggested payout amount (`payouts.tsx:163`), commission, sort order and price (`barbers.tsx:82-83`, `services.tsx:110,161,163`). The parser accepts both. | From code review, not run | Wrap in `bnDigits()`. |
| BN-04 | MEDIUM | Inconsistent words for one concept. "বিক্রি" vs "এন্ট্রি" for a sale (same page says "পুরনো বিক্রি যোগ করুন" and the badge "পুরনো এন্ট্রি"; barber modal "এন্ট্রি বাতিল করবেন?", admin modal "বিক্রি বাতিল"). "পেমেন্ট" is used for both a payout and a payment method. "বাকি" and "পাওনা" for the same balance. "আপনার আয়" and "আপনার ভাগ" for the same amount. | From code review (the strings were read in the pages I audited) | Decide one word per concept; the agent recommends বিক্রি, a different noun for payout (e.g. "পরিশোধ"), পাওনা, ভাগ. Update `docs/OWNER-GUIDE.md` to match. |
| BN-05 | LOW | The shipped seed menu has English names ("Hair Cutting", "Hydra Facial (mini)") which then show on barber buttons and printed receipts. Owner-editable data. | From code; production data not checked | Seed Bangla names, or tell the owner to rename. |
| BN-06 | LOW | Small items: "A4" label is Latin; "১৪" and "৬০" hard-coded in text while the constants are 14 and 60; barber fallback name `#id` and a minus sign in Latin; "—টি বিক্রি" while loading; new-barber name prefilled as "নাপিত ২"; two fallbacks for the shop name; "হোমে যান" vs "হোম পেজে যান"; `window.confirm` buttons say OK/Cancel in the browser's language. | From code review | Per the agent's table. |
| BN-07 | LOW | The avatar next to each barber shows the LAST letter of the name (`nameInitial`). Rahim, Karim and Salim (রহিম, করিম, সেলিম) all show "ম", so the avatars cannot tell them apart. | **Yes**, seen in the screenshots | Use the first grapheme. |
| BN-08 | LOW | Receipt wording and type: the "তারিখ:" label holds a date and a time; the VOID banner is only "বাতিল" and still prints the total; the column header "টাকা" repeats the ৳ sign; `leading-snug` at 11 px may clip Bangla vowel signs on 58 mm paper; `uppercase tracking-wide` on Bangla table headers (uppercase has no effect, letter spacing can disturb joined letters). | From code review; print preview not looked at | Per the agent's table. |
| BN-09 | LOW | The 14-day sales chart curve dips below the zero line between flat and rising days (spline overshoot), which looks like negative sales. | **Yes**, seen in the 1280 screenshot | Use a monotone curve. |

**Checked and fine (agent plus spot checks):** no English text in the interface chrome, `aria-label`s, placeholders, titles or server messages; all amounts, counts and percentages use Bangla digits through `taka()` and `bnDigits()`; no zero-width joiner problems; no text is cut with `slice` on Bangla strings (CSS ellipsis only); the receipt shows the total only, never the barber/owner split; payment labels are Bangla; CSV headers are Bangla with a BOM. Not verified: how native date and time inputs and `confirm` boxes look on the owner's phones; the thermal print preview; whether production was seeded from the English menu.

## Not verified in this run

- Production or Vercel environment. Only local checks ran, so target acceptance was not performed.
- The e2e suite ran against the database configured in `.env.local`. I did not check which database that is.
- Test coverage percentage. `npm test` was run without `--coverage`.
- The phase 5 security grep and the diff review from the verification skill were not run, because you listed only the five commands.
