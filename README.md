# InvestPro — Fractional Investment Platform

A full-stack multi-investor platform where assets can be listed and purchased fractionally. Built with Next.js 14, PostgreSQL, Prisma, NextAuth.js, and Stripe.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS (dark navy + gold theme)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js with JWT sessions
- **Payments:** Stripe
- **Validation:** Zod + React Hook Form
- **Notifications:** react-hot-toast

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Random secret (generate with `openssl rand -base64 32`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (whsec_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as STRIPE_PUBLISHABLE_KEY |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

---

## Setup & Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Make sure PostgreSQL is running, then run migrations:

```bash
npm run db:migrate
```

Or push schema directly (for development):

```bash
npm run db:push
```

### 3. Generate Prisma client

```bash
npm run db:generate
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Accounts

After seeding, the following accounts are available (all passwords: `password`):

| Email | Role | KYC |
|---|---|---|
| admin@platform.com | ADMIN | ✅ Approved |
| manager@platform.com | MANAGER | ✅ Approved |
| alice@example.com | INVESTOR | ✅ Approved |
| bob@example.com | INVESTOR | ✅ Approved |
| charlie@example.com | INVESTOR | ❌ Pending |

---

## Role Access Guide

### ADMIN (`admin@platform.com`)
Full platform control:
- `/investments` — View all investments (all statuses)
- `/admin/investments` — Manage all investments (activate, close, archive)
- `/admin/users` — Manage user roles and KYC status
- `/admin/settings/fees` — Configure management fee % and profit share %
- `/admin/distributions` — Process profit distributions with fee deductions
- `/admin/analytics` — Platform-wide analytics and recent transactions
- `/manager/investments/create` — Create new investments
- `/manager/investments/[id]/edit` — Edit any investment

### MANAGER (`manager@platform.com`)
Investment management:
- `/investments` — Browse all active investments
- `/manager/investments` — View and manage own investments
- `/manager/investments/create` — Create new investments
- `/manager/investments/[id]/edit` — Edit own investments
- Cannot modify fee settings or manage users

### INVESTOR (`alice@example.com`)
Portfolio and investing:
- `/investments` — Browse active investments
- `/investments/[id]` — View investment details and invest
- `/investor/portfolio` — View own holdings and transaction history
- Cannot see other investors' data or admin panels

---

## Key Features

### Fee System
Platform fees are configured by admins and applied automatically:
- **Management Fee** — deducted from gross distribution amount (0–20%)
- **Profit Share** — deducted from gross distribution amount (0–50%)
- Fee breakdown displayed transparently on investment pages and during purchase

### Purchase Flow
1. Investor selects units on investment detail page
2. Purchase modal shows cost + fee disclosure
3. On confirm: Holding created/updated, Transaction recorded, availableUnits decremented
4. Portfolio updates immediately

### Distribution Tool (Admin)
1. Select investment and enter gross profit amount
2. System calculates management fee + profit share deductions
3. Shows net amount to be distributed
4. On confirm: Distribution recorded, individual DISTRIBUTION transactions created per investor, split proportionally by unit count

---

## Project Structure

```
/app
  /(auth)/login, /register          — Public auth pages
  /(dashboard)/                     — Protected routes (requires auth)
    investments/[id]                — Investment detail + purchase
    investor/portfolio              — Investor portfolio & transactions
    manager/investments             — Manager investment CRUD
    admin/investments               — Admin investment management
    admin/users                     — User & KYC management
    admin/settings/fees             — Fee configuration
    admin/distributions             — Distribution processing
    admin/analytics                 — Platform analytics
  /api/                             — API routes

/components
  /ui/                              — Reusable UI primitives
  /investments/                     — Investment-specific components
  /portfolio/                       — Portfolio components
  /admin/                           — Admin panel components
  /layout/                          — Sidebar, Navbar

/lib
  auth.ts                           — NextAuth config
  fees.ts                           — Fee calculation utility
  permissions.ts                    — RBAC helpers
  prisma.ts                         — Prisma client singleton
  utils.ts                          — Formatting utilities
  validations.ts                    — Zod schemas

/prisma
  schema.prisma                     — Database schema
  seed.ts                           — Seed script
```

---

## Database Commands

```bash
npm run db:migrate    # Run migrations
npm run db:push       # Push schema (dev only, no migration files)
npm run db:seed       # Seed with test data
npm run db:studio     # Open Prisma Studio (GUI)
npm run db:reset      # Reset database and re-run migrations
```
