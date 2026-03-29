# ⛳ GolfGive — Golf Charity Subscription Platform

> Play Golf. Win Prizes. Fund Charity.

A full-stack subscription platform built with **Next.js 14**, **Supabase**, and **Stripe** — combining Stableford golf score tracking, monthly prize draws, and charity fundraising.

---

## 🚀 Tech Stack

| Layer          | Technology                    |
|----------------|-------------------------------|
| Frontend       | Next.js 14 (App Router), TypeScript |
| Styling        | Tailwind CSS + Custom Design System |
| Database       | Supabase (PostgreSQL + RLS)   |
| Auth           | Supabase Auth                 |
| Payments       | Stripe (Subscriptions + Portal) |
| Email          | Resend                        |
| Deployment     | Vercel                        |

---

## 📁 Project Structure

```
golf-charity-platform/
├── apps/web/                    ← Next.js 14 Application
│   ├── src/
│   │   ├── app/                 ← App Router pages + API routes
│   │   │   ├── page.tsx         ← Homepage
│   │   │   ├── auth/            ← Login, Register, Sign out
│   │   │   ├── subscribe/       ← Subscription + Charity selection
│   │   │   ├── charities/       ← Public charity listing
│   │   │   ├── draws/           ← Public draws page
│   │   │   ├── dashboard/       ← User dashboard (protected)
│   │   │   │   ├── scores/      ← Score entry (rolling 5)
│   │   │   │   ├── draws/       ← Draw participation history
│   │   │   │   ├── charity/     ← Charity management
│   │   │   │   ├── winnings/    ← Prize tracking
│   │   │   │   └── settings/    ← Account + billing
│   │   │   ├── admin/           ← Admin panel (protected)
│   │   │   │   ├── users/       ← User management
│   │   │   │   ├── draws/       ← Draw creation + simulation
│   │   │   │   ├── charities/   ← Charity CRUD
│   │   │   │   ├── winners/     ← Verification + payouts
│   │   │   │   └── reports/     ← Analytics dashboard
│   │   │   └── api/             ← API routes
│   │   │       ├── scores/      ← Score management
│   │   │       ├── draws/       ← Draw engine
│   │   │       ├── charities/   ← Charity CRUD
│   │   │       ├── subscriptions/ ← Stripe checkout
│   │   │       ├── user/        ← User data
│   │   │       ├── admin/       ← Admin operations
│   │   │       └── webhooks/    ← Stripe webhooks
│   │   ├── lib/
│   │   │   ├── draw-engine/     ← Core draw logic
│   │   │   ├── stripe/          ← Payment utilities
│   │   │   ├── supabase/        ← DB client
│   │   │   └── email/           ← Email templates
│   │   ├── types/               ← TypeScript types
│   │   └── middleware.ts        ← Auth + route protection
│   └── ...config files
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  ← Complete DB schema
```

---

## ⚙️ Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo>
cd golf-charity-platform/apps/web
npm install
```

### 2. Supabase Setup

1. Create a **new project** at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Go to **Storage** → Create a bucket called `winner-proofs` (set to public)
4. Copy your **Project URL** and **Anon Key** from Settings → API

### 3. Stripe Setup

1. Create a **new Stripe account** (or test mode)
2. Go to **Products** → Create two products:
   - **Monthly Membership** — Recurring, £9.99/month → Copy Price ID
   - **Yearly Membership** — Recurring, £99.99/year → Copy Price ID
3. Set up **Webhook**:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the **Webhook Secret**

### 4. Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key

### 5. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=GolfGive

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Create Admin User

After signing up on the platform:
```sql
-- Run in Supabase SQL Editor
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

### 7. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🚢 Deploy to Vercel

1. Push to a **new GitHub repo**
2. Create a **new Vercel project** (not personal account)
3. Connect the repo
4. Set **Root Directory** to `apps/web`
5. Add all environment variables from `.env.example`
6. Deploy!

---

## 🧪 Test Credentials (after setup)

| Role       | How to Access                               |
|------------|---------------------------------------------|
| Subscriber | Register at `/auth/register`                |
| Admin      | Set `role = 'admin'` in Supabase profiles   |

### Stripe Test Cards

| Card Number         | Result    |
|---------------------|-----------|
| 4242 4242 4242 4242 | Success   |
| 4000 0000 0000 9995 | Declined  |
| 4000 0025 0000 3155 | 3D Secure |

---

## 🎯 Feature Checklist

### User Features
- [x] Sign up / login with email
- [x] Monthly and yearly subscription via Stripe
- [x] Choose charity + set contribution percentage (min 10%)
- [x] Enter Stableford scores (1–45), rolling 5 system
- [x] View upcoming and past draws
- [x] See draw participation and match results
- [x] Upload proof screenshot for winner verification
- [x] View winnings and payment status
- [x] Manage billing via Stripe Customer Portal
- [x] Email notifications (welcome, draw results, winner alerts)

### Admin Features
- [x] View all users + subscriptions + scores
- [x] Toggle user admin status
- [x] Create monthly draws (random or algorithmic)
- [x] Run simulations before publishing
- [x] Publish draws (auto-calculates winners)
- [x] Jackpot rollover logic
- [x] Approve / reject winner verifications
- [x] Mark prizes as paid
- [x] CRUD for charities + featured selection
- [x] Platform analytics and revenue reports

---

## 🎨 Design System

The platform uses a **dark, emotion-driven** design deliberately avoiding golf clichés:

- **Primary colour**: `#22c55e` (brand green)
- **Accent colour**: `#f59e0b` (gold for prizes/jackpot)
- **Background**: Deep navy (`#020617` → `#0f172a`)
- **Typography**: Playfair Display (headings) + DM Sans (body)
- **Motion**: Framer Motion for page transitions, CSS animations for micro-interactions

---

## 📐 Draw Engine

Located at `src/lib/draw-engine/index.ts`:

| Function               | Description                                      |
|------------------------|--------------------------------------------------|
| `generateRandomDraw()` | 5 unique random numbers 1–45                     |
| `generateAlgorithmicDraw()` | Weighted toward least-frequent user scores  |
| `getMatchType()`       | Returns `5-match`, `4-match`, `3-match`, or `no-match` |
| `calculatePrizePool()` | Splits pool 40/35/25% + rollover support         |
| `simulateDraw()`       | Full dry run — winners + prizes — before publish |

---

## 📧 Email Templates

All emails in `src/lib/email/index.ts`:

- Welcome email on signup
- Draw results notification (win or no-win)
- Winner verification approved
- Winner verification rejected
- Subscription cancelled

---

*Built for Digital Heroes Trainee Selection — digitalheroes.co.in*
