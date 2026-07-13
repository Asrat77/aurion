# AURION Marketplace — Phase 1

Full-loop multi-vendor marketplace: vendor lists a product → buyer purchases it →
admin sees the order → vendor gets a payout line.

- `backend/` — Rails 8 API-only app, Postgres (Neon)
- `frontend/` — Next.js (App Router) + TypeScript

## Prerequisites

- Ruby 3.4+, Rails 8.1+
- Node 20+
- A Postgres connection string (Neon or local)

## Setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL at minimum
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails s -p 3001

# Frontend (separate shell)
cd frontend
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

## Demo accounts (seeded, password: `aurion123`)

| Role | Email |
|---|---|
| Admin | admin@aurion.et |
| Buyer | buyer@aurion.et |
| Vendor (Aurion Coffee Co.) | vendor@aurion.et |

## Demo script (the full loop)

1. Sign in as **vendor** → add a new product → confirm it appears in `/store`.
2. Sign out, sign in as **buyer** → add products to cart → checkout → pay (mock
   or sandbox gateway) → order confirmed → visible in `/orders`.
3. Sign in as **admin** → order appears in `/admin/orders`; revenue/customer
   stats update.
4. Sign in as **vendor** again → `/vendor/payouts` shows the payout line
   (line total minus 15% commission) for the item sold.

## Payments

Gateway is chosen by currency: **Chapa** for ETB (Ethiopia), **Stripe** test
mode for USD. If the relevant API key isn't set, checkout falls back to a
**mock gateway** that completes the order instantly — the full loop works with
zero external accounts configured.
