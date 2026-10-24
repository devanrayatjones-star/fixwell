# Fixwell

A booking website where customers book local mechanics and tradespeople (plumbers, electricians, gas engineers, carpenters, locksmiths, roofers).

- **Customers** search by trade, postcode/area and job, see prices up front, pick a free time slot, and get a booking reference by email. They can view, cancel or review from the link in that email. No account needed.
- **Tradespeople** apply through "Join Fixwell", then log in to accept or decline bookings, set working hours and days off, and edit their profile.
- **You (admin)** approve or reject tradespeople (nobody appears until you approve), keep private notes on your Gas Safe/NICEIC/insurance checks, and see every booking.

Built with Next.js (website), Supabase (database, logins, file storage), Resend (emails) and Vercel (hosting).

---

## Contents

1. [What it will cost](#1-what-it-will-cost)
2. [Create your Supabase account (database)](#2-supabase-database-and-logins)
3. [Create your Resend account (emails)](#3-resend-emails)
4. [Make two secret passwords](#4-make-two-secret-passwords)
5. [Put the site live on Vercel](#5-vercel-putting-the-site-live)
6. [Use your own domain](#6-use-your-own-domain)
7. [Try it out with the test data](#7-try-it-out)
8. [Before you launch: checklist](#8-before-you-launch)
9. [Running your site day to day](#9-day-to-day)
10. [Running it on your own computer (optional)](#10-running-it-on-your-own-computer-optional)
11. [How it works (for the curious)](#11-how-it-works)

> **Words you'll see:** *environment variable* = a named setting (like a password) stored on the hosting service instead of in the code. *Repository / repo* = the project's folder on GitHub. *Deploy* = put a new version live.

---

## 1. What it will cost

| Service | Free plan | When you'll need to pay |
| --- | --- | --- |
| **Supabase** | Free for 2 projects | Free projects **pause after a week with no visitors**. Upgrade to Pro (about $25/month) once you're live. |
| **Resend** | 3,000 emails/month, 100/day | Pro (about $20/month) if you outgrow it. |
| **Vercel** | Hobby plan is free but **for non-commercial use only** | Upgrade to Pro (about $20/month) before you take real bookings. |
| **Domain name** | – | About £10–15/year from any registrar (e.g. Namecheap, 123-reg, Cloudflare). |

You'll also need to pay the ICO data protection fee (a small yearly fee most UK businesses that handle personal data must pay). See ico.org.uk/fee.

---

## 2. Supabase (database and logins)

1. Go to **supabase.com** and sign up (signing in with GitHub is easiest).
2. Click **New project**.
   - **Name:** `fixwell`
   - **Database password:** click *Generate* and save it in your password manager. (The website doesn't need it, but you might later.)
   - **Region:** **West EU (London)**, so customer data stays in the UK.
   - Click **Create new project** and wait a minute or two.
3. **Create the database tables:**
   - In the left menu open **SQL Editor** → **New query**.
   - Open the file [`supabase/migrations/20261024120000_init.sql`](supabase/migrations/20261024120000_init.sql) from this repo on GitHub, click the *copy* button, paste it into the SQL editor and click **Run**. You should see "Success. No rows returned".
4. **Add the test tradespeople (optional, recommended):**
   - Open [`supabase/seed.sql`](supabase/seed.sql), copy it into a **new** query.
   - Near the top, change `'Bristol'` to your town, and the postcode list to the postcode districts around you (e.g. `array['M1','M2','M3']`).
   - Click **Run**. Seven example tradespeople, all clearly marked **[TEST]**, are added.
5. **Check email confirmation is on:** left menu → **Authentication** → **Sign In / Providers** → **Email**. Make sure **Confirm email** is turned **on**.
6. **Create your admin login:** **Authentication** → **Users** → **Add user** → **Create new user**. Enter your email and a strong password, tick **Auto Confirm User**, and click **Create user**.
7. **Copy your keys** (you'll paste them into Vercel in step 5):
   - Click **Connect** (top of the page) or go to **Project Settings → Data API**: copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
   - **Project Settings → API Keys**: copy the **Publishable key** (`sb_publishable_…`) and the **Secret key** (`sb_secret_…`; click *Reveal*).
   - ⚠️ The **secret key gives full access to your database.** Never share it, email it or put it in the code. It only goes into Vercel's settings.

---

## 3. Resend (emails)

Emails must come from a domain you own, so buy your domain first (see [step 6](#6-use-your-own-domain)) if you haven't already.

1. Go to **resend.com** and sign up.
2. **Domains** → **Add domain** → enter your domain (e.g. `fixwell.co.uk`), and choose region **Ireland (eu-west-1)**.
3. Resend shows some **DNS records** (usually one MX and two or three TXT records). Log in to where you bought your domain, find **DNS settings**, and add each record exactly as shown. (If you get stuck, your registrar's help pages will have a guide called "add a TXT record".)
4. Back in Resend, click **Verify**. It can take from a few minutes to a few hours.
5. **API Keys** → **Create API key** → name `fixwell`, permission **Sending access** → copy the key (`re_…`). You only see it once; save it in your password manager.
6. Decide your "from" address, e.g. `Fixwell <bookings@fixwell.co.uk>`. It must use the domain you just verified.

---

## 4. Make two secret passwords

The site needs two long random passwords of its own:

- `BOOKING_LINK_SECRET` creates the private "view or cancel" links in customers' emails.
- `CRON_SECRET` protects the daily housekeeping job.

Use your password manager's generator to make **two different random passwords of 40+ characters** (letters and numbers only is fine). Save them; you'll paste them into Vercel next.

> Don't change `BOOKING_LINK_SECRET` once you're live: links in emails already sent would stop working.

---

## 5. Vercel (putting the site live)

1. Go to **vercel.com** and **sign up with GitHub** (the same GitHub account that has this repo).
2. Click **Add New… → Project**, find **fixwell** in the list and click **Import**.
   - If you can't see it, click *Adjust GitHub App Permissions* and give Vercel access to the repo.
3. Leave the build settings as they are (Vercel detects Next.js automatically).
4. Open **Environment Variables** and add each of these (name on the left, value on the right):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | For now, leave this out. You'll add it after the first deploy (see below). |
   | `NEXT_PUBLIC_SERVICE_AREA` | Your town, e.g. `Bristol` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
   | `SUPABASE_SECRET_KEY` | Supabase secret key |
   | `RESEND_API_KEY` | Resend API key |
   | `EMAIL_FROM` | e.g. `Fixwell <bookings@fixwell.co.uk>` |
   | `ADMIN_EMAILS` | The email you used for your Supabase admin login |
   | `NOTIFY_EMAIL` | **Your contact email for booking notifications** |
   | `BOOKING_LINK_SECRET` | First random password from step 4 |
   | `CRON_SECRET` | Second random password from step 4 |
   | `SHOW_TEST_DATA` | `true` while testing, `false` at launch |

   (All of these are also listed in [`.env.example`](.env.example).)
5. Click **Deploy** and wait about a minute. You'll get an address like `fixwell-abc123.vercel.app`.
6. **Set the site address:** go to the project → **Settings → Environment Variables** → add `NEXT_PUBLIC_SITE_URL` = `https://fixwell-abc123.vercel.app` (your actual address, no `/` at the end). Then **Deployments** → the latest one → **⋯ → Redeploy**. (You'll change this again once your own domain is connected.)

**Which version goes live?** Vercel puts live whatever is on the repo's main branch. This work is on the branch `claude/funny-fermat-q7wvf8`. To make it the main version, open the repo on GitHub, click **Compare & pull request** for that branch, then **Merge**. Or ask me to open the pull request for you. Every future change merged to main goes live automatically.

**Upgrade to Pro before launch:** Vercel's free Hobby plan doesn't allow commercial use. Go to **Settings → Billing** to upgrade.

The daily housekeeping job (in [`vercel.json`](vercel.json)) is set up automatically. It runs at 05:00 UTC.

---

## 6. Use your own domain

1. Buy a domain if you haven't (e.g. `fixwell.co.uk`).
2. In Vercel: your project → **Settings → Domains** → enter `fixwell.co.uk` → **Add**. Accept the suggestion to also add `www.fixwell.co.uk` (Vercel will redirect one to the other).
3. Vercel shows the **DNS records** to add (usually an **A** record for `fixwell.co.uk` and a **CNAME** for `www`). Add them at your domain registrar exactly as shown, alongside the Resend records from step 3. Don't delete those.
4. Wait for Vercel to show **Valid Configuration** (minutes to a few hours). It sets up the padlock (HTTPS) for you.
5. Update `NEXT_PUBLIC_SITE_URL` to `https://www.fixwell.co.uk` (whichever one Vercel says is the main one), then **Redeploy** as in step 5.6. This makes the links in emails use your domain.

---

## 7. Try it out

With `SHOW_TEST_DATA=true`:

1. **Book as a customer:** open your site, search your postcode, pick a **[TEST]** tradesperson and book a slot using your own email. You'll get the customer confirmation. Because test tradespeople aren't real, *their* "new booking" email comes to your `NOTIFY_EMAIL`. Open the link in your confirmation email to view or cancel.
2. **Try a double booking:** open the same tradesperson in two browser windows and try to book the same slot. The second one is told it's just been taken.
3. **Be a tradesperson:** click **Join Fixwell** and apply with a second email address you own (any small PDF will do as the insurance certificate). Confirm your email from the link you receive and you'll land in the dashboard ("Awaiting approval").
4. **Be the admin:** log in at `/login` with your admin email. You'll go to `/admin`. Open the application, check the insurance, write a note and click **Approve**. The tradesperson gets an email and now appears in search.
5. Book your new tradesperson as a customer, then **accept** it from their dashboard. Accepting, declining and cancelling all email the customer.
6. After the appointment time has passed, click **Mark job complete**. The customer gets a "leave a review" email, and the review appears on the profile instead of "New".

---

## 8. Before you launch

- [ ] Fill in every **yellow highlighted** placeholder on `/privacy` and `/terms`. These live in [`src/app/privacy/page.tsx`](src/app/privacy/page.tsx) and [`src/app/terms/page.tsx`](src/app/terms/page.tsx): find the text inside `<Fill>…</Fill>` and replace it. Or tell me the details and I'll do it.
- [ ] **Have a solicitor check the terms and privacy policy.** They're a starting point, not legal advice.
- [ ] Pay the ICO data protection fee and put your registration number in the privacy policy.
- [ ] Set `SHOW_TEST_DATA` to `false` in Vercel and redeploy. (Or delete the test data permanently: the SQL to do so is at the top of `supabase/seed.sql`.)
- [ ] Upgrade Vercel to Pro and Supabase to Pro.
- [ ] Make one real booking end to end on your live domain and check every email arrives (look in spam too).
- [ ] Approve your first real tradespeople.

---

## 9. Day to day

- **New applications:** you get an email for each one. Open `/admin`, check their Gas Safe / NICEIC / NAPIT / IMI numbers using the "Check register" links, open their insurance certificate, write what you checked in **Verification notes**, then **Approve** or **Reject** (the reason is emailed to them).
- **If a tradesperson changes** their accreditation numbers or uploads new insurance, you get an email asking you to re-check.
- **Suspend** hides a tradesperson from the site immediately (e.g. expired insurance). **Reinstate** brings them back.
- **All bookings:** `/admin/bookings`. You can cancel a booking there if needed; both sides are emailed.
- **Reviews:** you can hide an abusive review from the tradesperson's admin page. Only customers with a completed job can leave one.
- **Automatic every day:** requests the tradesperson never answered are closed once the appointment time passes (the customer is told), and customers' personal details are deleted 12 months after their booking.
- **Settings you might want to change** live in [`src/lib/config.ts`](src/lib/config.ts): cancellation cut-off (24 hours), how far ahead people can book (6 weeks), minimum notice (2 hours), how long data is kept (12 months).
- **Email wording** is in [`src/lib/emails.ts`](src/lib/emails.ts).

---

## 10. Running it on your own computer (optional)

You don't need this to run the site, only if you want to try changes before they go live.

1. Install **Node.js 20 or newer** from nodejs.org.
2. Download the repo (on GitHub: **Code → Download ZIP**, or `git clone`).
3. Copy `.env.example` to a new file called `.env.local` and fill in the values. You can use your real Supabase project, or a separate free "fixwell-dev" project set up the same way. Leave `RESEND_API_KEY` empty and emails are **printed in the terminal** instead of sent.
4. In a terminal, in the project folder:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000.

Other commands: `npm test` (automatic checks of prices, postcodes, time slots and UK time), `npm run lint`, `npm run typecheck`, `npm run build`.

If you have Docker, `npx supabase start` runs a complete local copy of Supabase using the files in `supabase/`, and `npx supabase db reset` rebuilds it with the test data.

---

## 11. How it works

- **No double bookings:** the database itself refuses two active bookings for the same tradesperson that overlap in time (an "exclusion constraint" in the SQL file). Even if two people click *Book* at the same instant, only one succeeds; the other is told the slot was just taken. Taken, pending, days-off and past slots are never offered.
- **Time slots:** each tradesperson sets weekly working hours. A job blocks its estimated hours (rounded up to the half hour), and start times are offered hourly as long as the whole job fits in the working day. All times are UK time (Europe/London, including the clock changes), and dates are shown day/month/year.
- **Prices:** estimate = call-out fee + (estimated hours × hourly rate), with "parts quoted on the day". The price is copied onto the booking, so later price changes don't alter existing bookings.
- **Ratings:** profiles show **New** until a real review exists. Ratings are only ever averages of genuine reviews from completed bookings.
- **Security:** the database blocks all direct public access. Only the website's server code reads and writes it, after checking who is asking: the customer's private link, the tradesperson's login, or your admin email. Secrets live only in environment variables. Insurance documents are private and opened through links that expire after 10 minutes.
- **Privacy:** only the details needed for the job are collected. Vehicle registration is asked only for mechanics. Reviews show first names only. Personal details are deleted automatically after 12 months. The site sets no cookies for customers; only tradespeople and admins get a login cookie.
- **14-day cancellation right:** if the appointment falls within 14 days, the customer must tick a box asking for the work to start early, as UK consumer law requires. The booking terms explain the right.

### Where things are

```
src/app/                 the pages (each folder is a web address)
  page.tsx               home page
  search/                search results
  t/[slug]/              tradesperson profile, and /book (the booking steps)
  booking/[reference]/   customer's view/cancel/review page (from the email link)
  join/                  "Join Fixwell" application
  login/, forgot-password/, account/, auth/   logging in and passwords
  dashboard/             tradesperson dashboard
  admin/                 your admin pages
  privacy/, terms/       legal pages (fill in the placeholders)
  api/availability/      free time slots for the booking calendar
  api/cron/daily/        daily housekeeping job
src/lib/                 shared logic: config, emails, prices, postcodes, time slots, security
src/components/          reusable page parts (forms, cards, badges)
supabase/migrations/     database set-up SQL
supabase/seed.sql        test tradespeople
tests/                   automatic checks
```

### Ideas for later

- Taking deposits or payments online (e.g. Stripe).
- Text-message reminders.
- Limiting how often one person can submit forms (spam protection beyond the current hidden spam trap).
- Letting customers move a booking rather than cancel and rebook.
