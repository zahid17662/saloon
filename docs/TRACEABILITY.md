# Rule-to-test traceability

Date: 2026-11-23. Sources: `docs/PRD.md` §5 (FR), §6 (BR), §12 (AC) and `CLAUDE.md` business rules. The first pass was done by the `ecc:pr-test-analyzer` agent; line numbers point at the `it(` line. Anything not listed is **NOT TESTED**. Open gaps are logged in `docs/BUGS.md` (B-004 to B-008).

Paths: `L/` = `src/lib/`, `S/` = `src/server/`, `E/` = `e2e/`. Strength: DB = real SQL on PGlite with the real migrations, PURE = pure function, E2E = Playwright.
New tests from this pass: `L/money.test.ts`, `L/time.test.ts`, `L/payout-schema.test.ts`, `S/edge-cases.test.ts`.

## Business rules (BR)

| ID | Rule | Covering tests | Strength |
|---|---|---|---|
| BR-1 | Half-up split, shares add up exactly | L/money.test.ts:6 (75 at 50% = 38/37), :10 (half-up), :17 (0%), :22 (100%), :38 (all totals 0..400 x all %); S/edge-cases.test.ts:79, :86, :91; L/logic.test.ts:29, :33; S/sales.test.ts:94 | PURE, DB |
| BR-2 | Commission snapshot on the sale | S/edge-cases.test.ts:96 (old keeps 50, new sale uses 60); S/sales.test.ts:104 | DB |
| BR-3 | Service name and price snapshot | S/edge-cases.test.ts:109 (receipt, list, day report, by-service all keep 150; new sale 200), :135 (rename); S/sales.test.ts:79, :104; E/catalog.spec.ts:41 | DB, E2E |
| BR-4 | Voided sales excluded from totals, reports, balance; still listed | S/edge-cases.test.ts:253, :282, :290; S/reports.test.ts:101; S/sales.test.ts:282, :294; S/payouts.test.ts:59; L/logic.test.ts:88; E/reports.spec.ts:12 | DB, PURE, E2E |
| BR-5 | Asia/Dhaka days and months, timestamptz | L/time.test.ts:8 (23:59 / 00:01), :32 (month), :43 (year), :49 (leap day), :98 (server TZ = UTC, Los Angeles, Kiritimati, Dhaka); L/backdate.test.ts:74; S/sales.test.ts:265; S/reports.test.ts:92, :125; L/logic.test.ts:60, :64 | PURE, DB |
| BR-6 | Sequential receipt numbers `R-000123` | L/logic.test.ts:44 (format only). The identity column is not asserted. | WEAK |
| BR-7 | A payout may exceed the balance (advance) | S/edge-cases.test.ts:300, :313; S/payouts.test.ts:70; L/logic.test.ts:121. The "অগ্রিম" label in the UI is NOT TESTED. | DB, PURE |
| BR-8 | Integer taka everywhere | L/payout-schema.test.ts:16 (0, negative, fractions, NaN, Infinity), :26, :30; L/schemas.test.ts:28, :46, :91; S/test-db.test.ts:22; L/money.test.ts:31, :38 | PURE, DB |

## Functional requirements (FR)

| ID | Covering tests | Notes |
|---|---|---|
| FR-1 shop cookie, 180 days | L/auth-core.test.ts:32, :48, :168; L/route-guard.test.ts:7 | The unlock Server Action (bcrypt check, cookie set) is NOT TESTED |
| FR-2 admin cookie, 8 h, redirect | L/route-guard.test.ts:27, :36; L/auth-core.test.ts:48, :124; E/admin-login.spec.ts:39 | |
| FR-3 5 wrong tries, 15 min block | L/rate-limit.test.ts:44, :51, :61, :73, :93; E/admin-login.spec.ts:17 | Unit tests use an in-memory store; the real `login_attempts` SQL is only hit by E2E |
| FR-4 server-side auth in every action | E/backup.spec.ts:9 (route only); L/auth-core.test.ts:76 | **NOT TESTED for Server Actions (B-005)** |
| FR-5 active barbers in sortOrder | S/catalog.test.ts:42; E/catalog.spec.ts:9 | "Only active" not asserted in the UI |
| FR-6 only active services shown | S/sales.test.ts:114, :167; S/edge-cases.test.ts:143 | The UI filter itself is NOT TESTED |
| FR-7 cart qty 1-20, total, payment method | L/schemas.test.ts:91, :95; S/edge-cases.test.ts:178 (1 and 20 sold), :185 (0, 21, -1 refused), :189 (empty cart); E/sale.spec.ts:9 | Cart +/-, remove and default Cash are NOT TESTED |
| FR-8 server recomputes prices, one transaction | S/sales.test.ts:79, :123; L/schemas.test.ts:84 | |
| FR-9 idempotency key | S/sales.test.ts:131, :141, :149, :157; E/sale.spec.ts:32 | |
| FR-10 today's count and earnings | S/sales.test.ts:294, :307, :315 | |
| FR-11 barber void within 10 min | S/edge-cases.test.ts:211 (9:59 ok, 10:01 refused), :229 (other barber), :237, :244; S/sales.test.ts:191, :199, :206, :212, :219; L/sale-rules.test.ts:15, :20; E/void.spec.ts:9, :21, :30 | |
| FR-12 receipt contents, VOID label | E/sale.spec.ts:9 (name, items, total) | Date/time, receipt no., payment method, footer, VOID badge **NOT TESTED (B-006)** |
| FR-13 print CSS 58 / 80 mm / A4 | NOT TESTED | B-006 |
| FR-14 receipt never shows the split | NOT TESTED | B-006 |
| FR-15 dashboard cards, presets | E/reports.spec.ts:12; L/logic.test.ts:67, :99; L/time.test.ts:76, :81 | Service-count and sale-count cards NOT TESTED |
| FR-16 reports, CSV with BOM | S/reports.test.ts:86, :92, :101, :107; S/edge-cases.test.ts:109; L/logic.test.ts:117, :131; E/reports.spec.ts:20 | By-service has no SQL version, only the pure one. The UI CSV export is NOT TESTED |
| FR-17 barbers CRUD | S/catalog.test.ts:94, :103, :112, :119; L/schemas.test.ts:28, :31; S/test-db.test.ts:22; S/edge-cases.test.ts:161 | Sort-order editing NOT TESTED |
| FR-18 categories and services | S/catalog.test.ts:129, :137, :145, :151, :159; L/schemas.test.ts:46; S/edge-cases.test.ts:154 (sold service cannot be hard-deleted) | |
| FR-19 sales list, filters, void reason | S/sales.test.ts:265, :270, :275, :282; L/schemas.test.ts:139; S/edge-cases.test.ts:253 | Pagination NOT TESTED (B-008) |
| FR-20 payouts earned / paid / balance, 24 h delete | S/payouts.test.ts:59, :70, :82, :99, :121, :132; S/edge-cases.test.ts:300, :318, :325 (23h59 ok, 24h01 refused), :333; L/payout-schema.test.ts:9; E/payouts.spec.ts:10, :32 | |
| FR-21 settings, PIN, shop code | S/catalog.test.ts:166; L/schemas.test.ts:62; L/auth-core.test.ts:209 | Changing the PIN, changing the shop code and the `shopCodeVersion` bump are **NOT TESTED server-side (B-007)** |
| FR-22 back-dated sale | L/backdate.test.ts:22, :26, :30, :34, :38 (60 days ok), :44 (61 blocked), :48, :58, :74; S/sales.test.ts:176; S/reports.test.ts:117, :125, :131; E/backdate.spec.ts:24, :43, :50 | The `addPastSale` Server Action is only covered by E2E |

## Acceptance criteria (AC, PRD §12)

| AC | Covering tests | Notes |
|---|---|---|
| 1 | E/sale.spec.ts:9; S/sales.test.ts:79 | Dashboard showing 125 / 125 not asserted |
| 2 | L/money.test.ts:10; L/logic.test.ts:33 | PURE only |
| 3 | S/edge-cases.test.ts:109 (old receipt and reports keep 150, new sale uses 200); E/catalog.spec.ts:41 | |
| 4 | S/edge-cases.test.ts:96 | |
| 5 | E/catalog.spec.ts:9 | |
| 6 | S/edge-cases.test.ts:253; S/reports.test.ts:101; S/payouts.test.ts:59; E/reports.spec.ts:12 | "Shown as VOID in the list" in the UI NOT TESTED |
| 7 | L/time.test.ts:8, :32; S/reports.test.ts:92, :125; L/logic.test.ts:60 | |
| 8 | S/edge-cases.test.ts:300 (exactly 3000 / 2000 / 1500 -> 1000 -> -500, through the database); L/logic.test.ts:121 | |
| 9 | S/sales.test.ts:141; E/sale.spec.ts:32 | |
| 10 | **NOT TESTED** (B-005) | |
| 11 | L/route-guard.test.ts:7 | No E2E hits `/barber/*` without a cookie |
| 12 | L/logic.test.ts:131 | BOM and escaping only; not opened in Excel |
| 13 | **NOT TESTED** (B-006) | |
| 14 | CI gate (typecheck, lint, test, build) | |

## Requested edge cases: status

| Edge case | Test |
|---|---|
| 75 at 50% = 38/37, shares always add up | L/money.test.ts:6, :38 |
| 0% and 100% | L/money.test.ts:17, :22; S/edge-cases.test.ts:86, :91 |
| Commission change after a sale | S/edge-cases.test.ts:96 |
| Price change: old receipts and reports unchanged | S/edge-cases.test.ts:109, :135 |
| Qty 0, 1, 20, 21 | S/edge-cases.test.ts:178, :185; L/schemas.test.ts:91, :95 |
| Empty cart | S/edge-cases.test.ts:189 (zod), :195 (direct createSale, see B-004) |
| Inactive barber or service | S/sales.test.ts:114; S/edge-cases.test.ts:143, :161 |
| Deleted or inactive service in an old sale | S/edge-cases.test.ts:143, :154 |
| 23:59 vs 00:01 Dhaka, month change, server in UTC | L/time.test.ts:8, :32, :43, :49, :98 |
| Void at 9:59 vs 10:01, other barber, double void | S/edge-cases.test.ts:211, :229, :237, :244 |
| Voided sales excluded from every total and the payout balance | S/edge-cases.test.ts:253, :282, :290 |
| Payout delete at 23h59 vs 24h01 | S/edge-cases.test.ts:325 |
| Payout larger than balance (PRD BR-7: allowed, becomes an advance) | S/edge-cases.test.ts:300, :313 |
| Payout zero or negative | L/payout-schema.test.ts:16, :21 |
| Back-dated 60 days ok, 61 blocked, future blocked | L/backdate.test.ts:38, :44, :30, :34; E/backdate.spec.ts:43, :50 |
