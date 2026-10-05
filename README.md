# Selva Muthukumarasamy Temple – Donation Management

A simple, secure web application for temple staff to record donations, generate
numbered receipts, share them with donors, and produce collection reports.

Production domain: **https://selvamuthukumarasamy.in**

## Contents

- [Overview](#overview)
- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Neon database setup](#neon-database-setup)
- [Environment variables](#environment-variables)
- [Prisma migrations](#prisma-migrations)
- [Seeding the first admin](#seeding-the-first-admin)
- [Development commands](#development-commands)
- [Project structure](#project-structure)
- [Database schema](#database-schema)
- [Key design decisions](#key-design-decisions)
- [GitHub setup](#github-setup)
- [Vercel deployment](#vercel-deployment)
- [Custom domain: selvamuthukumarasamy.in](#custom-domain-selvamuthukumarasamyin)
- [Production security checklist](#production-security-checklist)
- [Roadmap (version 2)](#roadmap-version-2)

## Overview

| Feature | Details |
| --- | --- |
| Authentication | Username + password, bcrypt hashes, signed `httpOnly` session cookie (12 h), login rate limiting (5 attempts / 15 min), audit log of sign-ins |
| Roles | `ADMIN` (everything) and `STAFF` (add/view donations, print/share receipts, view reports) |
| Dashboard | Donations today / this month / this year, expenses this month / this year, balance (donations minus expenses), recent donations |
| Add donation | Donor details, amount (with amount-in-words preview), purpose, payment method, reference, date, notes. Validated with Zod on client and server |
| Receipt numbers | `SMT-2026-000001` – sequential per calendar year, allocated atomically in the database |
| Receipt | Tamil receipt-book layout (A5 landscape card), browser print, PDF download, public link protected by a 32-character random token |
| Sharing | Web Share API, WhatsApp deep link with a pre-filled message, copy link, copy message |
| Expenditures | Record temple spending with sequential voucher numbers (`EXP-2026-000001`), filterable list with running totals, today / month / year summaries and the balance against donations; edit and cancel (audited) for admins |
| Donation history | Paginated table with search (name / mobile / receipt no.), date range, payment method, category and status filters |
| Corrections | Admins can edit (audited) or cancel (reason required, never deleted) receipts |
| Reports | Today / this month / custom range, totals by payment method and category, transaction table, CSV export |
| Settings | Temple details printed on receipts (Tamil + English name, registration no., signatory labels), receipt prefix, configurable donation and expense categories |
| Users | Admins create staff, edit roles, deactivate accounts, reset passwords |

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, TypeScript strict mode)
- [Tailwind CSS 4](https://tailwindcss.com)
- [PostgreSQL](https://www.postgresql.org) hosted on [Neon](https://neon.tech)
- [Prisma 7](https://www.prisma.io) with the `pg` driver adapter
- [Zod](https://zod.dev) validation, [jose](https://github.com/panva/jose) sessions, [bcryptjs](https://github.com/dcodeIO/bcrypt.js) hashing
- [@react-pdf/renderer](https://react-pdf.org) for receipt PDFs
- Deployed on [Vercel](https://vercel.com), source on GitHub

No queues, caches, or extra services are required.

## Prerequisites

- Node.js **20.9 or newer** (Node 22 recommended)
- npm 10+
- A PostgreSQL database: either a local Postgres 14+ or a Neon project
- Git

## Local setup

```bash
git clone <your-repo-url> selvamuthukumarasamy-temple
cd selvamuthukumarasamy-temple
npm install                 # also runs `prisma generate`

cp .env.example .env        # then edit .env (see Environment variables)

npm run db:migrate          # applies migrations to DATABASE_URL
SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='choose-a-password' npm run db:seed

npm run dev                 # http://localhost:3000
```

Sign in with the seeded admin username and password, then go to **Settings** to fill in
the temple address and phone number that print on receipts, and to **Users** to add staff.

For a local database on macOS with Homebrew:

```bash
brew install postgresql@17 && brew services start postgresql@17
createdb smt_temple
# DATABASE_URL=postgresql://<your-mac-username>@localhost:5432/smt_temple
```

## Neon database setup

1. Sign in at <https://console.neon.tech> and click **New Project**.
2. Name it `selvamuthukumarasamy-temple`, choose the **Asia Pacific (Singapore)** region
   (closest to Tamil Nadu), Postgres 17.
3. On the project dashboard click **Connect** and copy the **pooled** connection string
   (host contains `-pooler`). It looks like:
   `postgresql://neondb_owner:xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Use this value as `DATABASE_URL` in Vercel (and locally if you want to develop against Neon).
5. Optional but recommended: create a separate Neon **branch** named `dev` for local development so
   you never test against production data.

Prisma Migrate works with the pooled URL. If you ever see advisory-lock errors during
`prisma migrate deploy`, use the **direct** (non-pooled) connection string for that one command.

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. Server-side only, never exposed to the browser. |
| `AUTH_SECRET` | yes | ≥ 32 random characters used to sign session cookies. Generate: `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL, e.g. `https://selvamuthukumarasamy.in`. Used in share links. |
| `SEED_ADMIN_NAME` | seed only | Display name for the first admin. |
| `SEED_ADMIN_USERNAME` | seed only | Login name for the first admin (default `admin`). |
| `SEED_ADMIN_EMAIL` | seed only | Optional email for the first admin. |
| `SEED_ADMIN_PASSWORD` | seed only | Initial admin password (≥ 5 chars). Hashed with bcrypt, never stored or printed. |
| `SEED_ADMIN_RESET_PASSWORD` | seed only | Set to `true` to reset an existing admin's password when re-seeding. |

Rotating `AUTH_SECRET` signs every user out immediately.

## Prisma migrations

Schema lives in `prisma/schema.prisma`; migrations in `prisma/migrations/`.

```bash
npm run db:migrate            # dev: create + apply a migration from schema changes
npm run db:migrate:deploy     # prod: apply pending migrations (no prompts, no schema drift checks)
npm run db:generate           # regenerate the client after editing the schema
npm run db:studio             # browse data
npm run db:reset              # DEV ONLY: drop, recreate, migrate and seed
```

To apply migrations to Neon before/after a deploy:

```bash
DATABASE_URL='postgresql://...neon...' npm run db:migrate:deploy
```

## Seeding the first admin

The seed script (`prisma/seed.ts`) creates one `ADMIN` user, the default donation categories
(General Donation, Annadhanam, Festival, Abhishekam, Temple Maintenance, Special Pooja, Other)
and the temple settings row.

**The admin password is never hardcoded.** Provide it only through environment variables at the
moment you run the seed, so it is not written to disk:

```bash
SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='your-password' npm run db:seed
```

Sign in with that username and password, then change the password under **My account** if needed.
To reset a forgotten admin password later, re-run the same command with `SEED_ADMIN_RESET_PASSWORD=true`.

> Passwords only need to be 5 characters (configurable via `PASSWORD_MIN_LENGTH` in
> `src/lib/validation/common.ts`). This was a deliberate usability choice for temple staff;
> the login rate limiter (5 attempts per 15 minutes per IP + username) is the main brute-force
> defence. Raise the minimum if the app is ever exposed to a wider audience.
Re-running the seed is safe: existing users and categories are left untouched.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run check` | Lint + typecheck |
| `npx tsx scripts/check-receipt-sequence.ts` | Concurrency test for receipt-number allocation |

## Project structure

```
prisma/
  schema.prisma          Data model
  migrations/            SQL migrations
  seed.ts                Admin + categories seed
scripts/                 Developer utilities
src/
  proxy.ts               Route protection (redirects anonymous users, admin-only paths)
  app/
    login/               Sign-in page
    (admin)/             Authenticated shell: dashboard, donations, reports, users, settings, account
    receipt/[token]/     Public receipt page (token protected)
    api/receipts/[token]/pdf   Receipt PDF download
    api/reports/export   CSV export (auth required)
  actions/               Server Actions (auth, donations, users, settings)
  components/            UI primitives and feature components
  lib/
    auth/                Sessions (jose), passwords (bcrypt), permissions, rate limiting
    donations/service.ts Create / update / cancel / list donations (transactions + audit)
    reports/             Report queries and export formats (CSV now, Excel later)
    pdf/                 React-PDF receipt template and bundled Noto Sans / Noto Sans Tamil fonts
    validation/          Zod schemas shared by client and server
    receipt-number.ts    Atomic per-year sequence allocation
    amount-in-words.ts   Indian numbering (lakh / crore) words
    money.ts, dates.ts   INR formatting, IST date helpers
```

## Branding the sign-in page

The sign-in page shows a full-height hero panel. Drop these files into `public/` (they are
not tracked until you add them):

- `public/login-hero.jpg` – deity photograph, 1600px+ on the long edge. Without it a gradient is shown.
- `public/logo.png` – square logo for the round badge (optional).

Tamil heading, name and location lines are in `src/lib/branding.ts`.

## Database schema

| Model | Purpose | Notable fields |
| --- | --- | --- |
| `User` | Staff accounts | `username` (unique), `email` (optional, unique), `passwordHash`, `role` (ADMIN/STAFF), `active` |
| `Donor` | Donor identity | `name`, `mobile` (indexed), `email`, `address` |
| `DonationCategory` | Configurable purposes | `name` (unique), `active`, `sortOrder` |
| `Donation` | One receipt | `receiptNumber` (unique), `amount` `DECIMAL(12,2)`, `paymentMethod`, `donationDate` `DATE`, `status` (ACTIVE/CANCELLED), `publicReceiptToken` (unique), `createdById`, `updatedById`, `cancelledAt/By/Reason` |
| `ReceiptSequence` | One row per year | `year` (PK), `lastNumber` |
| `ExpenseCategory` | Expense heads | `name` (unique), `active`, `sortOrder` |
| `Expense` | One payment | `voucherNumber` (unique), `paidTo`, `description`, `amount` `DECIMAL(12,2)`, `paymentMethod`, `expenseDate` `DATE`, `status` (ACTIVE/CANCELLED), audit columns like `Donation` |
| `ExpenseSequence` | One row per year | `year` (PK), `lastNumber` |
| `AuditLog` | Who did what | `action`, `entityType`, `entityId`, `userId`, `details` (JSON diff), `ipAddress` |
| `TempleSettings` | Singleton (id = 1) | Temple name (English + Tamil), registration number, address, contact, `receiptPrefix`, thank-you message, signatory labels |

Indexes exist on receipt number, donation date, donor mobile, donor name, status, payment method,
category, created-at and audit entity/user.

## Key design decisions

- **Money** is `DECIMAL(12,2)` in Postgres and travels through the app as decimal strings. All
  totals are computed by the database, never with JavaScript floats.
- **Receipt numbers** are allocated inside the same transaction that inserts the donation using
  `INSERT … ON CONFLICT DO UPDATE … RETURNING`, which row-locks the year's counter. Verified with
  `scripts/check-receipt-sequence.ts`. The year is the **IST calendar year at the time the receipt is
  issued**; the sequence resets each January.
- **Dates**: `donationDate` is a pure calendar date. "Today" and "this month" are computed in
  Asia/Kolkata regardless of server timezone (Vercel runs in UTC).
- **Sessions** are HS256 JWTs in an `httpOnly`, `SameSite=Lax`, `Secure` cookie. Every request
  re-checks the user exists and is active, so deactivating a user takes effect immediately.
  Next.js Server Actions provide built-in CSRF (origin) protection.
- **Donor matching**: a donor is reused when the same mobile *and* name (case-insensitive) already
  exist. Family members who share one phone stay separate.
- **Corrections**: donations are never deleted. Cancelling sets `status = CANCELLED` with who/when/why.
  Edits are admin-only and write a before/after diff to `AuditLog`.
- **Public receipts** are addressed only by a 32-character random token (192 bits). The public page
  and PDF show exactly what is printed on paper: no notes, no staff names.
- **PDF** is rendered server-side with React-PDF and a bundled Noto Sans font (the built-in PDF fonts
  cannot draw ₹).
- **Sharing** uses free channels only: Web Share API, `wa.me` deep link, clipboard. No paid SMS/WhatsApp API.
- **Rate limiting** for login is in-memory (best effort on serverless). Upgrade to a DB/KV store if needed.

## GitHub setup

```bash
git init -b main                     # skip if .git already exists
git add .
git commit -m "Initial commit: temple donation management MVP"

# create the repository on GitHub (private recommended), then:
git remote add origin git@github.com:<your-user>/selvamuthukumarasamy-temple.git
git push -u origin main
```

Or with the GitHub CLI: `gh repo create selvamuthukumarasamy-temple --private --source=. --push`.

Confirm `.env` is **not** in the commit: `git ls-files | grep -c '^\.env$'` must print `0`.

## Vercel deployment

1. At <https://vercel.com/new> import the GitHub repository. Framework preset: **Next.js** (auto-detected).
2. Under **Environment Variables** add for *Production* (and *Preview* if you use a Neon dev branch):
   - `DATABASE_URL` – Neon pooled connection string
   - `AUTH_SECRET` – output of `openssl rand -base64 48`
   - `NEXT_PUBLIC_APP_URL` – `https://selvamuthukumarasamy.in`
3. Build command stays `npm run build` (it runs `prisma generate`). Install command: `npm install`.
4. Click **Deploy**.
5. Apply migrations to Neon from your machine (first deploy and after any schema change):
   ```bash
   DATABASE_URL='<neon pooled url>' npm run db:migrate:deploy
   ```
   If you prefer migrations to run automatically, set the Vercel build command to
   `prisma migrate deploy && npm run build` – but only if Preview deployments use a separate database.
6. Seed the production admin once, from your machine, against the Neon URL (see *Seeding*).
7. Optionally install the [Neon Vercel integration](https://vercel.com/integrations/neon) to have
   `DATABASE_URL` managed automatically and get a database branch per preview deployment.

Function region: set the Vercel project's **Function Region** to Singapore (`sin1`) to sit next to the
Neon database.

## Custom domain: selvamuthukumarasamy.in

1. In the Vercel project go to **Settings → Domains** and add `selvamuthukumarasamy.in` and
   `www.selvamuthukumarasamy.in`. Choose to redirect `www` → apex.
2. At your domain registrar, set the DNS records Vercel shows:
   - `A` record for `@` → `76.76.21.21`
   - `CNAME` record for `www` → `cname.vercel-dns.com`
   (Alternatively move nameservers to Vercel: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`.)
3. Wait for DNS to propagate (minutes to a few hours). Vercel issues the TLS certificate automatically.
4. Set `NEXT_PUBLIC_APP_URL=https://selvamuthukumarasamy.in` in Vercel and redeploy so share links
   use the real domain.

## Production security checklist

- [ ] `AUTH_SECRET` is unique to production, ≥ 32 chars, stored only in Vercel env vars
- [ ] `DATABASE_URL` uses `sslmode=require` and is stored only in Vercel env vars
- [ ] `.env` is not tracked by Git (`git ls-files .env` prints nothing)
- [ ] Seeded admin password is not a dictionary word such as `admin`; change it after first login
- [ ] Every staff member has their own account; shared logins are not used
- [ ] Staff accounts use `STAFF` role; only trustees/treasurer have `ADMIN`
- [ ] Deactivate accounts of people who leave (Users → Edit → Deactivated)
- [ ] Neon project has **branch protection** / no public access; only Vercel IPs need reach it
- [ ] Neon point-in-time restore window is enabled (7 days on paid plans) for accidental data loss
- [ ] Vercel deployment protection is enabled for Preview deployments
- [ ] Review the `AuditLog` table periodically (Prisma Studio or SQL) for unexpected cancellations
- [ ] Keep dependencies updated: `npm audit` and `npm outdated` monthly. (Known: `npm audit` reports
      advisories in the Prisma CLI's dev-time dependencies (`mysql2`, `deepmerge-ts`); they do not ship
      in the runtime bundle.)
- [ ] HTTPS only (Vercel enforces it); security headers are set in `next.config.ts`

## Roadmap (version 2)

- Excel (`.xlsx`) export – the exporter interface in `src/lib/reports/export.ts` is ready for it
- Expense CSV export and an income-vs-expenditure statement on the Reports page
- Audit-log viewer in the admin UI (data is already captured)
- Donor directory page with per-donor history and autocomplete on the donation form
- Official WhatsApp Business / SMS API delivery of receipts
- Optional 80G/tax-exemption fields on receipts (PAN capture, 80G registration number)
- Tamil-language receipt option
- Session revocation list / device management
- Persistent (database-backed) login rate limiting and account lockout (important given short passwords)
- Financial-year (April–March) reporting presets
- Bulk import of historical receipts
- Automated tests (unit tests for money/date/words helpers, Playwright end-to-end flows)
