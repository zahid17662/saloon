# ECC + Claude Code: from today to client handover

For: Claude Code in the Antigravity terminal. Written 2026-11-27 for the current monorepo (`Client/`, `Server/`).

**One phase per Claude session. Do them in order.** Paste the master prompt first, then the phase prompt.

---

## Where the project stands

| Done | Not done |
|---|---|
| Website at `/`, POS at `/pos` | Website contact details, hours, reviews (empty in `Client/src/site/config.ts`) |
| Shop code, admin PIN, barber passwords | Website SEO: sitemap, share image, page language |
| Typecheck, lint, 391 tests and build passed on 2026-11-27 | Browser tests (not run since the last changes) |
| `render.yaml`, CI file, deploy and owner guides | Commit, push, CI run, real deployment |

---

## One-time setup

1. Open the project folder in Antigravity, open its terminal, and run:
   ```powershell
   claude
   ```
2. Inside Claude, type `/plugin list`. If `ecc@ecc` is there, **do not install again**. If it is missing:
   ```
   /plugin marketplace add https://github.com/affaan-m/ECC
   /plugin install ecc@ecc
   ```
   Use one install method only. Do not also run the `npx` installer.
3. ECC's "Fact-Forcing Gate" makes Claude explain itself before first edits and risky commands. That is normal. If it blocks you badly, this turns it off for one session (you lose that protection):
   ```powershell
   $env:ECC_GATEGUARD="off"; claude
   ```

Session commands: `/ecc:save-session` at the end, `/ecc:resume-session` at the start, `/clear` between unrelated phases.

---

## The skills worth using here

| Stage | Skill or agent |
|---|---|
| Plan before coding | `/ecc:plan` |
| Website look, SEO, speed | `ecc:seo`, `ecc:react-performance`, `ecc:nextjs-turbopack`, `ecc:frontend-design-direction` |
| Phone and accessibility | `ecc:frontend-a11y`, `ecc:accessibility` |
| Bangla text | `ecc:bengali-reviewer` agent |
| Tests | `ecc:tdd-workflow`, `ecc:e2e-testing`, `ecc:e2e-runner` agent |
| Security | `ecc:security-review`, `ecc:security-reviewer` agent, `ecc:silent-failure-hunter` agent |
| Database | `ecc:database-migrations`, `ecc:postgres-patterns`, `ecc:database-reviewer` agent |
| Code review | `/ecc:code-review`, `ecc:react-reviewer`, `ecc:typescript-reviewer` agents |
| Ship | `ecc:verification-loop`, `ecc:deployment-patterns`, `ecc:production-audit`, `ecc:browser-qa` |
| Commits and docs | `ecc:git-workflow`, `/ecc:update-docs` |

Skip everything else (other languages, marketing, video, multi-model and loop skills).

---

## Master prompt (paste at the start of every session)

```
You are finishing my salon project for handover to a paying client: Nir Smart Gents Parlour
(public website at "/" and a Bangla POS at "/pos" and "/admin"). It is an npm workspaces monorepo:
Client/ (Next.js 16, Vercel) and Server/ (Hono API, Render, Neon + Drizzle).

Before doing anything, read CLAUDE.md, README.md, docs/ECC-GUIDE.md and docs/BUGS.md, then run
git status. Trust the code over the documents when they disagree, and tell me about the difference.

Rules:
1. Do only the phase I give you. Show a short plan and wait for my "yes" before changing code.
2. Use the ECC skills named in the phase.
3. Never print, log or commit .env values. Never ask me to paste secrets or connection strings here.
4. Never DROP, TRUNCATE or run drizzle-kit push. Never touch the production (main) database
   without my clear yes. Browser tests delete data: confirm they point to the test branch first.
5. Do not commit or push unless I say so.
6. Never invent business facts (address, phone, prices, reviews). Ask me.
7. Fix bugs with a test that fails first when the code can be tested.
8. Before saying done, run npm run check, and npm run test:e2e if behaviour changed (ask first).
9. End with: what changed, what you verified with real output, what you did NOT verify, and what I
   must do myself. Explain in simple words.
```

---

## Phases

### Phase 1: finish the website content (fill in your real details first)
```
Phase 1. Put these real details into Client/src/site/config.ts. Leave any blank item empty.
Address:
Phone:
WhatsApp (like 8801XXXXXXXXX):
Opening hours:
Real customer reviews (name, service, text):
Price or service corrections:
Then compare every service and price in Client/src/site/services.ts with the POS menu seed in
Server/src/lib and list the differences and doubtful spellings for me to decide. Run the site and
check "/" at 375px, 768px and 1280px, including the cart and booking buttons.
```

### Phase 2: website SEO, speed and accessibility
```
Phase 2. Use ecc:seo, ecc:frontend-a11y, ecc:react-performance and ecc:nextjs-turbopack
(read the Next docs in node_modules/next/dist/docs first). Public website only; keep the current
design, colours and fonts. Check and fix: page language (the root layout says lang="bn" but the
website is English), sitemap, canonical URL, share image, local business structured data using
only details from config.ts, image sizes, keyboard use, focus, contrast and tap target size.
Ask me for the domain name. Show before and after Lighthouse results if you can run them.
```

### Phase 3: browser tests
```
Phase 3. Use ecc:e2e-testing and the ecc:e2e-runner agent. Read docs/TEST-GUIDE.md,
playwright.config.ts, e2e/ and scripts/e2e-init.mjs. First prove, without printing any value,
that the tests use a separate Neon test branch and not main. Ask me, then run npm run test:e2e.
Fix real app bugs; change a test only when the test itself is wrong, and say which.
Add one test that "/" loads for a visitor with no cookies.
```

### Phase 4: security and remaining bugs
```
Phase 4. Use ecc:security-review, the ecc:security-reviewer and ecc:silent-failure-hunter agents,
and ecc:tdd-workflow. Look at the open items in docs/BUGS.md, especially: S-001 (admin cookie still
works after logout), S-003 (global login limit can lock everyone out), S-005 (seed uses demo codes
if SEED_ENV is forgotten), and an expired admin session in a form not redirecting to login.
For each, tell me the risk in simple words and your suggestion, and fix only the ones I approve.
```

### Phase 5: Bangla and phone use of the POS
```
Phase 5. Use the ecc:bengali-reviewer agent and ecc:frontend-a11y on the POS only
(Client/src/app/(pos) and Client/src/components). Fix wording, Bangla digits, AM/PM, dialog focus,
labels and 44px tap targets. Show me every changed Bangla sentence before and after.
```

### Phase 6: review, commit, push, CI
```
Phase 6. Use /ecc:code-review on all uncommitted changes and ecc:git-workflow. Fix serious
findings. Check that no secret or .env file would be committed. Show me the branch, the file list
and the commit messages you propose, and which remote you would push to (git remote -v). Wait for
my yes before committing, and ask again before pushing. Then help me open a pull request to main
and read the CI result.
```

### Phase 7: deploy
```
Phase 7. Use ecc:deployment-patterns. Follow docs/DEPLOY.md. Guide me one step at a time through
Neon, Render and Vercel (Root Directory = Client). I type all secrets myself in the dashboards and
my own terminal. Wait for me to confirm each step. Warn me before anything that touches the
production database.
```

### Phase 8: check the live site
```
Phase 8. Use ecc:browser-qa on this live URL: <URL>. Check "/", "/pos" (must ask for the shop code),
"/admin" (must ask for the PIN), console errors, phone layout and response times. Do not enter
codes or create sales yourself; give me a checklist for those and I will report the results.
```

### Phase 9: handover
```
Phase 9. Use ecc:verification-loop, ecc:production-audit and /ecc:update-docs. Give a score with
blockers first. Check docs/OWNER-GUIDE.md against the live app. Make a one-page handover sheet:
site addresses, who owns each account (GitHub, Neon, Render, Vercel, domain), monthly costs to
confirm, backup routine, and how to get support. No passwords or secrets in any document.
```

---

## Things only you can do

- Set a new shop code and admin PIN, and replace demo barber passwords.
- Confirm the shop name stored in the database (it showed a different name from the website).
- Create or transfer the GitHub, Neon, Render, Vercel and domain accounts to the client.
- Test one real sale on a real phone, then void it.
- Agree in writing what support the client gets after handover.

No tool can promise zero problems. Browser tests, a live check and a few days of real shop use are what find the rest.
