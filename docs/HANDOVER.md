# Handover sheet: Nir Smart Gents Parlour

Fill in every "TO CONFIRM" before giving this to the client. **Never write a password, PIN, shop code, API key or connection string in this document.** Keep those in the owner's own password manager.

Date handed over: TO CONFIRM  ·  Handed over by: TO CONFIRM  ·  Received by: TO CONFIRM

## 1. Addresses

| What | Address | Who uses it |
|---|---|---|
| Public website | TO CONFIRM (domain, or the Vercel address until the domain is ready) | Customers |
| Barber screens | the website address followed by `/pos` | Barbers (needs the shop code once per device) |
| Owner screens | the website address followed by `/admin` | Owner (needs the admin PIN) |
| API health check | TO CONFIRM (Render address followed by `/health`) | Developer only |

The owner guide (`docs/OWNER-GUIDE.md`, in Bangla) has a line at the top where the site address must be written in.

## 2. Who owns each account

Each account should be in the **client's** name, with the developer added as a collaborator only while support lasts.

| Account | What it holds | Owner (name and email) | Developer access until |
|---|---|---|---|
| GitHub | the code | TO CONFIRM | TO CONFIRM |
| Neon | the database (all sales and payouts) | TO CONFIRM | TO CONFIRM |
| Render | the API | TO CONFIRM | TO CONFIRM |
| Vercel | the website and screens | TO CONFIRM | TO CONFIRM |
| Domain registrar | the domain name | TO CONFIRM | TO CONFIRM |

Secrets that exist (values are NOT written here): admin PIN, shop code, one starting password per barber, `SESSION_SECRET` and `API_KEY` (identical on Render and Vercel), the two Neon connection strings. Stored where: TO CONFIRM.

## 3. Monthly costs to confirm

Prices change. Check each provider's pricing page on the day of handover and write the real figure.

| Service | Plan now | Monthly cost | Note |
|---|---|---|---|
| Neon | TO CONFIRM | TO CONFIRM | History for restore needs a paid plan (7 days or more is advised) |
| Render | TO CONFIRM | TO CONFIRM | The free plan sleeps after 15 minutes idle, so the first request waits about a minute. A shop open all day should use a paid plan. |
| Vercel | TO CONFIRM | TO CONFIRM | |
| Domain | TO CONFIRM | TO CONFIRM (per year) | Renewal date: TO CONFIRM |

## 4. Backups

- **Owner, every month (at least):** Admin, Settings, "ব্যাকআপ ডাউনলোড". Keep the file somewhere safe (own email or Google Drive). It has all the accounts data, so do not share it.
- **Database history:** on a paid Neon plan, point-in-time restore. Confirmed retention: TO CONFIRM. Restore into a new branch first and compare before switching.
- **Before any risky change:** the developer creates a Neon branch named `before-<change>`.
- Last backup test (a restore actually tried): TO CONFIRM.

## 5. If something goes wrong

| Problem | First step |
|---|---|
| Page slow after a quiet period | Wait a minute and refresh (free plans sleep). |
| Forgot the admin PIN | The app cannot recover it by design. The developer resets it from their computer (`npm run admin:reset-pin`) and tells the owner in person. |
| Bad update | Vercel: Deployments, Instant Rollback. Render: Events, Rollback. |
| Secret leaked | Set new `SESSION_SECRET` and `API_KEY` on both Render and Vercel, redeploy. Everyone logs in again. |
| Wrong payout or sale | A payout can be deleted within 24 hours; a barber can void within 10 minutes, the owner at any time. |

## 6. Support (agree in writing)

| Item | Agreed |
|---|---|
| Who to contact | TO CONFIRM (name, phone or email) |
| Hours | TO CONFIRM |
| Response time | TO CONFIRM |
| How long free support lasts | TO CONFIRM |
| What is paid extra | TO CONFIRM |

When reporting a problem, say what you were doing, what the screen said, and when. Never send a PIN or code in a message.
