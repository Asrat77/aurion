# AURION Marketplace

The channel architecture, Business workflow, provider boundary, and acceptance
gates are documented in [`docs/AURION_PRODUCT_SPEC.md`](docs/AURION_PRODUCT_SPEC.md).

Multi-vendor marketplace for Ethiopian goods, at retail and at commercial scale.

- `backend/` — Rails 8 API-only app, Postgres (Neon)
- `frontend/` — Next.js (App Router) + TypeScript

**Retail:** faceted discovery → cart → server-priced checkout → per-vendor
fulfilment with tracking → delivery → verified review, with buyer protection
covering the whole path.

**Commercial:** a wholesale catalogue carrying MOQ, volume pricing, lead times
and sample terms, feeding an RFQ pipeline an admin can quote against.

**Both sides:** public vendor onboarding with admin approval, buyer–vendor
messaging, vendor sales analytics and inventory, and an English/Amharic
interface with USD or ETB pricing.

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

## Isolated staging seed accounts

`db:seed` creates demo users only outside production. Set
`STAGING_DEMO_PASSWORD` through the staging secret store before seeding; the
repository does not publish or assume a demo password.

| Role | Email |
|---|---|
| Admin | admin@aurion.et |
| Buyer | buyer@aurion.et |
| Vendor (Aurion Coffee Co.) | vendor@aurion.et |

Seeding also creates buyer accounts with real delivered orders and reviews
behind them, so ratings, vendor analytics and fulfilment history are populated
rather than fabricated.

## Demo script (the full loop)

1. Sign in as **buyer** → filter `/store` by price, origin, rating or free
   shipping → open a product → set a quantity → checkout. Shipping and VAT are
   priced by the server from the destination: Ethiopia is domestic with 15% VAT
   and quoted in birr, exports are zero-rated.
2. Sign in as **vendor** → `/vendor` → Orders → move your line from awaiting to
   processing to shipped, adding carrier and tracking. In a multi-vendor order
   the buyer's order only reads "shipped" once every vendor has shipped.
3. Back as **buyer** → `/orders` shows the timeline and tracking. Once
   delivered, write a review; the product's rating recomputes. Or report a
   problem to open a buyer protection claim.
4. Sign in as **admin** → `/admin` → uphold the claim: the vendor's payout for
   that line is reversed and the stock returned.
5. Still as **vendor** → Analytics for revenue over time, best sellers and open
   fulfilment; Inventory for low-stock warnings and inline stock edits.

Other paths worth showing: `/sell` (vendor application → admin approval →
dashboard access), `/source` (wholesale catalogue → RFQ → admin quote),
`/messages` (buyer–vendor threads), and the EN | አማርኛ and USD | ETB switchers
in the account menu.

## Currency

All `*_cents` values are denominated in the platform's base currency (USD). An
order additionally carries the currency the buyer was quoted in and the FX rate
used, so figures stay comparable across orders while buyers see their own
currency. `Order#charge_amount_cents` gives a gateway the amount to charge.
`ETB_PER_USD` sets the rate.

## Payments

No live payment gateway is wired yet. Checkout uses a **mock gateway** that
completes the order instantly, so the full loop works with zero external
accounts configured.

**Chapa** is the intended live gateway for real transactions: it fronts
Telebirr and CBE Birr behind a single REST API, which is why it beats
integrating Telebirr directly (whose RSA signature verification is the usual
source of production `60200099` errors). It requires registered-business
credentials, so the adapter is intentionally unwritten rather than half-wired
— see `backend/app/services/payment_gateway.rb` for where it plugs in.
