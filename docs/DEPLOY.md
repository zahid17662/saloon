# Deploying (Neon + Render + Vercel)

One GitHub repository, three services:

| Part | Folder | Runs on |
|---|---|---|
| Public website (`/`) and POS (`/pos`, `/admin`) | `Client/` | Vercel |
| API: business rules, auth, database access | `Server/` | Render |
| Database | | Neon Postgres |

Only the API talks to the database. Only the web app talks to the API. Never paste connection strings or secrets into chat, commits or screenshots.

## 0. What you need

- This code pushed to a GitHub repository (the client's, or one you will hand over).
- Neon, Render and Vercel accounts.
- Node 22 or newer on your computer (`.nvmrc` pins 24).
- The **real** admin PIN and shop code (4 to 8 digits each) and a starting barber password (6+ characters, letters and digits). Never use the demo values on production.
- The website details filled in: `Client/src/site/config.ts` (address, phone, WhatsApp, opening hours, real reviews). Empty items are hidden. Prices on the public website are in `Client/src/site/services.ts`; they are separate from the POS menu.

## 1. Neon: the production database

1. Create a project in **Singapore (`ap-southeast-1`)**. The default branch `main` is production.
2. From **Connect**, copy two strings for `main`:
   - **Pooled** (host contains `-pooler`): `DATABASE_URL`
   - **Direct** (no `-pooler`): `DIRECT_URL`
3. On a paid plan, set history retention (point-in-time restore) to at least 7 days.

Generate two **different** secrets (run twice):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

One is `SESSION_SECRET`, the other is `API_KEY`.

## 2. Create the tables and the first data (from your computer)

Run from the repository root, after `npm install`. PowerShell:

```powershell
$env:DIRECT_URL = "<direct string of main>"
npm run db:migrate
$env:SEED_ENV = "production"
$env:SEED_ADMIN_PIN = "<real admin PIN>"
$env:SEED_SHOP_CODE = "<real shop code>"
$env:SEED_BARBER_PASSWORD = "<starting barber password>"
npm run db:seed
Remove-Item Env:DIRECT_URL, Env:SEED_ENV, Env:SEED_ADMIN_PIN, Env:SEED_SHOP_CODE, Env:SEED_BARBER_PASSWORD
```

- A value set in the shell wins over `Server/.env` and `Client/.env.local`. The seed prints `Seeding Neon endpoint: ep-xxxx`: compare it with the endpoint of `main` in the Neon console and stop if it differs.
- The seed is safe to run again: tables that already have rows are left alone. So it never changes the passwords of barbers that already exist; change those on the admin barbers page.

## 3. Render: the API

1. **New, Blueprint**, choose the repository. The root `render.yaml` defines the `salon-api` service.
2. Enter the four secrets when asked: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `API_KEY`.
3. The build installs the `Server` workspace and applies pending migrations, then `npm run start:api` starts it. Health check: `https://<name>.onrender.com/health` returns `{"ok":true}`.

`plan: free` sleeps after 15 minutes without traffic and the next request waits about a minute. For a shop that is open all day, use `starter`. The public website does not depend on the API, so it stays fast either way.

## 4. Vercel: the web app

1. **Add New, Project**, import the same repository.
2. Set **Root Directory** to `Client` and leave "Include source files outside of the Root Directory" on. Framework: Next.js. Leave the commands at their defaults. `Client/vercel.json` pins region `sin1`.
3. Environment variables (Production):

| Name | Value |
|---|---|
| `API_URL` | the Render URL, no trailing slash |
| `API_KEY` | exactly the same as on Render (32+ characters) |
| `SESSION_SECRET` | exactly the same as on Render |

No database variables belong on Vercel.

**Preview deployments** need their own API and Neon branch. Never point them at production.

### Moving from the old two-repository setup

Earlier versions published `Client/` and `Server/` to two separate repositories. Any Vercel or Render project still connected to those must be reconnected to this repository (Vercel: Root Directory `Client`; Render: create the service from the root Blueprint, or set build command `npm ci --include=dev -w Server && npm run db:migrate` and start command `npm run start:api` with an empty Root Directory). The old repositories receive no more updates.

## 5. After the first deploy: checklist

- [ ] `/` shows the website; contact details are correct.
- [ ] On a new device (or a private window) `/pos` asks for the shop code; `1234` is refused; the real code lists the barbers and a barber can log in.
- [ ] `/admin/login` accepts the real PIN and refuses `0000`; no barber accepts `barber123`.
- [ ] Wrong PIN six times in a row shows the "too many tries" message.
- [ ] A test sale shows on the receipt, in `/admin/sales` and in the dashboard. Then void it.
- [ ] No errors in the browser console on `/`, `/pos`, `/admin`.
- [ ] Neon backup / history retention confirmed.
- [ ] The owner has `docs/OWNER-GUIDE.md` with the site address written in.

## 6. Updates, migrations and rollback

Pushing to `main` deploys both services (Render only when `Server/` or the root package files change). GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, build and tests.

Migrations run during the Render build, while the old version is still serving. So every migration must be **backward compatible**: add, do not rename or drop in the same release. Edit `Server/src/db/schema.ts`, run `npm run db:generate`, read the SQL, `npm run db:migrate` on a dev branch, then commit it. Never edit an applied migration and never run `drizzle-kit push` against `main`.

- **Bad web deploy:** Vercel, Deployments, **Instant Rollback**.
- **Bad API deploy:** Render, Events, **Rollback** to the previous deploy.
- **Bad migration:** roll the code back, then write a new migration that undoes it. For real data damage use Neon point-in-time restore (into a new branch first, so you can compare). Before a risky migration, create a Neon branch `before-<change>`.
- **Leaked secret:** set a new value on **both** Render and Vercel and redeploy. Everyone logs in again.

## 7. Operating notes

- The first request after a quiet period is slower (Neon and the free Render plan both sleep).
- Day and month boundaries always use Asia/Dhaka. Do not set a `TZ` variable.
- Logs contain error names only. Look in Render **Logs** (API), Vercel **Logs** (web) and Neon **Monitoring**.
- `login_attempts` grows slowly. Old rows can be cleared: `delete from login_attempts where created_at < now() - interval '30 days';`

## 8. The owner forgot the admin PIN

There is no recovery inside the app, by design. From your computer (check the endpoint id it prints):

```powershell
$env:DIRECT_URL = "<direct string of main>"
$env:NEW_ADMIN_PIN = "<new 4 to 8 digit PIN>"
npm run admin:reset-pin
Remove-Item Env:DIRECT_URL, Env:NEW_ADMIN_PIN
```

Existing admin sessions stop working. Tell the owner the PIN in person and ask them to change it in Settings.
