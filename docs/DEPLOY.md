# Deploying the Salon POS (Vercel + Neon)

> **Architecture changed.** The app is now two deployments: the web app (`Client/`, Vercel) and a separate API
> (`Server/`, Render). Follow `Client/README.md` and `Server/README.md` for the current steps. Neon, the
> secrets, and the first-time migrate/seed (sections 1 and 3 below) are unchanged, except that the database
> strings now go on **Render** (not Vercel), and Vercel needs only `API_URL`, `API_KEY` and `SESSION_SECRET`.
> Run migrate/seed from `Server/` (`npm run db:migrate`, `npm run db:seed`).


You run every command yourself. Nothing here is automatic except the migration step in the Production build (section 4).

## 0. What you need

- A GitHub repo with this code pushed (the client's or a handed-over account).
- A Vercel account and a Neon account.
- Node 20+ and `npm` on your computer.
- The **real** shop code and admin PIN you want to start with (4 to 8 digits each). Never use the demo `1234` / `0000` on `main`.

## 1. Neon: the production database

1. Create a Neon project. Region: **AWS Asia Pacific (Singapore) `ap-southeast-1`**, next to Vercel `sin1`.
2. The default branch is `main`. This is the production database.
3. In the Neon dashboard, open **Connect** for the `main` branch and copy two connection strings:
   - **Pooled** (host contains `-pooler`): goes in `DATABASE_URL`. The app uses it at runtime.
   - **Direct** (no `-pooler`): goes in `DIRECT_URL`. Migrations and the seed use it.
4. Backups: on the free plan history is short. On a paid plan, set the history retention (point-in-time restore) to at least 7 days (Project settings, Storage). Check this once before real money goes through the app.
5. Never paste these strings in chat, commit them, or put them in screenshots.

Generate the cookie-signing secret on your computer:

```bash
openssl rand -base64 32
```

If you have no `openssl`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## 2. Vercel: create the project

1. Vercel dashboard, **Add New, Project**, import the GitHub repo. Framework: Next.js (detected). Leave the build command and output directory alone. `package.json` already sets `npm run build`, and `vercel.json` pins the region to `sin1`.
2. Before the first deploy, open **Settings, Environment Variables** and add these. Tick **Production** for all of them. For Preview, see the note below.

| Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** string of `main` | Runtime. Used by the app. |
| `DIRECT_URL` | Neon **direct** string of `main` | Used by the migration step during the Production build, so it must be available at build time. |
| `SESSION_SECRET` | the random string from section 1 | At least 32 characters. If it is missing or short, every login fails (by design). |

Do **not** set `TRUST_PROXY_HEADERS`. On Vercel the client IP header is trusted automatically (`VERCEL=1`).

**Preview deployments:** do not give Preview the `main` database. Create a separate Neon branch (for example `preview`), put its strings in the Preview scope, and use a different `SESSION_SECRET`. Previews never run migrations (see section 4), but they can read and write whatever database they point at.

3. Do not deploy yet. Migrate and seed the database first (section 3). The seed is always a manual step.

## 3. First-time database setup on `main` (you run this from your computer)

Use a one-off shell. The strings are only in that shell's environment, not in a file.

PowerShell (Windows):

```powershell
$env:DIRECT_URL = "<paste the direct string>"
npm run db:migrate
$env:SEED_ENV = "production"
$env:SEED_ADMIN_PIN = "<real admin PIN>"
$env:SEED_SHOP_CODE = "<real shop code>"
npm run db:seed
Remove-Item Env:DIRECT_URL, Env:SEED_ENV, Env:SEED_ADMIN_PIN, Env:SEED_SHOP_CODE
```

Bash (macOS / Linux / Git Bash):

```bash
export DIRECT_URL='<paste the direct string>'
npm run db:migrate
SEED_ENV=production SEED_ADMIN_PIN='<real admin PIN>' SEED_SHOP_CODE='<real shop code>' npm run db:seed
unset DIRECT_URL
```

Before you run them: `drizzle-kit` also reads `.env.local`. If that file points at your dev branch, the variable you set in the shell wins, because `.env.local` only fills in values that are not already set. Confirm the target:

- The seed prints `Seeding Neon endpoint: ep-xxxx`. Compare that id with the endpoint of `main` in the Neon console. If it differs, stop.
- The seed is safe to run again: a table that already has rows is left alone, and a changed PIN or shop code is never overwritten.
- The seed refuses to run with `SEED_ENV=production` unless both the PIN and the shop code are set, so the demo values can never reach `main`.

Check in the Neon SQL editor (branch `main`):

```sql
select count(*) from services;   -- expect your menu size
select count(*) from barbers;
```

## 4. Deploying and how migrations run

`npm run build` runs `scripts/build.mjs`:

- On a **Vercel Production build** (`VERCEL_ENV=production`) it runs `drizzle-kit migrate` against `DIRECT_URL` first, then `next build`.
- On **Preview builds, CI and your computer** it skips the migration and only builds. A pull request can never change the production database.
- If a migration fails, the build fails. Vercel keeps serving the previous deployment. Read the build log, fix, and push again.

Why this is not fully safe on its own, and the rule that makes it safe: during a deploy, the old code keeps running against the new schema until the new deployment goes live. So every migration must be **backward compatible**: add tables and columns (nullable or with a default), and drop or rename things only in a later release, after no running code uses them. Never edit a migration that has already been applied. Always run `npm run db:generate`, read the SQL, and commit it.

If you would rather not migrate during the build at all (the stricter option), run `npm run db:migrate` from your computer (section 3) before every deploy that has a new migration, and delete the `drizzle-kit migrate` step from `scripts/build.mjs`.

First deploy:

1. Push to `main` on GitHub. Vercel builds and deploys by itself. (Or **Deployments, Redeploy** in the dashboard.)
2. Open the Production URL. Expected: the unlock page. Unlock with the real shop code, pick a barber, and make a test sale.
3. Void that test sale from `/admin/sales` (login with the real admin PIN) so it is not counted.

## 5. After the first deploy: checklist

- [ ] `/unlock` loads, the shop code works, `/admin/login` accepts the real PIN, and the demo `1234` / `0000` are refused.
- [ ] Wrong PIN six times in a row shows the "too many tries" message.
- [ ] A sale shows on the receipt, in `/admin/sales`, and in the dashboard totals.
- [ ] Browser console has no errors (open DevTools on `/` and `/admin`).
- [ ] In Vercel, **Settings, Functions** shows region `Singapore (sin1)`.
- [ ] Neon backup / history retention confirmed (section 1).
- [ ] The Bangla owner README exists (PRD section 17, item 7).

## 6. Changing the PIN or shop code later

Use the Settings screen in `/admin/settings`.

## 7. Rolling back

**A bad deployment (code problem)**: in the Vercel dashboard, **Deployments**, pick the last good one, **Promote to Production** (or **Instant Rollback**). From a terminal: `npx vercel rollback` and follow the prompt. This swaps the code in seconds. It does not touch the database.

**A bad migration**: the migrations are forward-only. Options, safest first:

1. Roll the code back (above). Because migrations are backward compatible, the old code works on the new schema.
2. Write a new migration that undoes the change (`npm run db:generate`, review, commit, deploy).
3. Restore the data with Neon: **Branches, Restore** (point-in-time). Pick a time just before the bad change. Neon can restore in place, or create a new branch from that time so you can compare first (recommended). If you restore in place, the sales taken after that time are lost, so only do it for real data damage, and write down what was lost.

**Before any risky migration**, make a restore point: in Neon create a branch from `main` named `before-<change>`. It is instant. Delete it a week later.

**A leaked or wrong `SESSION_SECRET`**: set a new value in Vercel and redeploy. Everyone has to log in again.

## 8. Operating notes (what to watch)

- **First request after quiet time is slower.** Neon suspends an idle database (the free plan after about 5 minutes) and Vercel functions start cold, so the first screen after a long gap can take a second or two. This is normal. A paid Neon plan can disable auto-suspend.
- **Dates are Dhaka time.** Vercel runs in UTC, but day and month boundaries in the code always use Asia/Dhaka (UTC+6). Do not set a `TZ` variable.
- **Logs:** the app logs only an error name (never a message, query, PIN, URL, or cookie). If you see `getClientIp` messages in the Vercel logs, login is being refused because no client IP header arrived.
- **Where to look when something fails:** Vercel, **Logs** (filter by Error), and for the database Neon, **Monitoring**.
- **The `login_attempts` table grows slowly** (one row per login try). It is safe to clear old rows from the Neon SQL editor, for example `delete from login_attempts where created_at < now() - interval '30 days';`.

## 8b. The owner forgot the admin PIN

There is no recovery inside the app (by design). You reset it from your computer, against the database you mean to change (check the endpoint id it prints):

PowerShell:

```powershell
$env:DIRECT_URL = "<direct string of main>"
$env:NEW_ADMIN_PIN = "<new 4 to 8 digit PIN>"
npm run admin:reset-pin
Remove-Item Env:DIRECT_URL, Env:NEW_ADMIN_PIN
```

Bash: `DIRECT_URL=... NEW_ADMIN_PIN=... npm run admin:reset-pin`. Every existing admin session stops working. Tell the owner the new PIN in person, not in a chat message, and ask them to change it in Settings.

## 9. Command summary

| What | Command |
|---|---|
| Generate a migration after editing `src/db/schema.ts` | `npm run db:generate` (then read the SQL) |
| Apply migrations to the database in `DIRECT_URL` | `npm run db:migrate` |
| Reset a forgotten admin PIN | `npm run admin:reset-pin` (see section 8b) |
| Seed the first menu, barbers and credentials | `npm run db:seed` (see section 3 for the variables) |
| Check the code before you push | `npm run typecheck && npm run lint && npm test && npm run build` |
| Browser tests (separate Neon branch, never `main`) | `npm run test:e2e` |
