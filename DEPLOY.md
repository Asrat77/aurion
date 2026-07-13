# Deploying AURION

Backend (Rails API) → Dokploy. Frontend (Next.js) → Appwrite Sites.

They'll be on different domains, so this is a cross-site deployment: the
frontend calls the backend's public URL over `fetch`, and auth is a signed
httpOnly cookie. That only works cross-site over HTTPS with
`SameSite=None` cookies and an exact-match CORS origin — both are already
wired up in this repo (see "What was fixed for this" below).

## 1. Backend on Dokploy

The repo already has a production-ready multi-stage [Dockerfile](backend/Dockerfile)
(Rails 8's default: Ruby slim, Thruster in front of Puma, runs as non-root,
exposes port 80). Point Dokploy at the `backend/` directory as the build
context and it can build straight from that Dockerfile — nothing extra to
write.

**Before you deploy, smoke-test the build locally** (I did a full static
review — Gemfile.lock is in sync, `.dockerignore` correctly excludes
`config/master.key` and `.env*`, no Active Storage usage to worry about —
but couldn't run an actual `docker build` this session because the machine
was down to ~5GB free disk):

```bash
cd backend
docker build -t aurion-backend .
# If you're on Apple Silicon and Dokploy's host is x86_64:
docker build --platform linux/amd64 -t aurion-backend .
```

### Database

`config/database.yml` expects `DATABASE_URL` in production (comment in
[.env.example](backend/.env.example) references Neon Postgres — keep using
a managed Postgres rather than a container on Dokploy, so data survives
redeploys). Get a connection string from Neon (or whichever Postgres you
prefer) with `?sslmode=require`.

The container's entrypoint ([bin/docker-entrypoint](backend/bin/docker-entrypoint))
runs `rails db:prepare` on boot, which creates the schema **and runs
`db:seed` automatically the first time it creates the database** — so the
demo products/vendors/accounts populate themselves on first deploy. No
manual seed step needed. If for some reason they don't show up, Dokploy's
container console lets you run `bin/rails db:seed` by hand.

### Required environment variables

| Variable | Value |
|---|---|
| `RAILS_MASTER_KEY` | Contents of `backend/config/master.key` (don't commit this file — it isn't tracked in git; copy it into Dokploy's secret env var UI) |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` |
| `FRONTEND_ORIGIN` | The exact Appwrite frontend URL, e.g. `https://aurion.appwrite.network` — **no trailing slash**, must match exactly since CORS does a string match |

Optional (leave unset — checkout runs in mock/demo mode without them):
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`,
`CHAPA_SECRET_KEY`, `ETB_PER_USD`.

### Dokploy settings
- **Port**: container exposes `80` — point Dokploy's proxy at that.
- **Health check**: `GET /up` (Rails' built-in health endpoint).
- Dokploy's proxy (Traefik) terminates TLS and forwards plain HTTP —
  `config/environments/production.rb` already has `config.assume_ssl = true`
  and `config.force_ssl = true`, so this works without extra config.

## 2. Frontend on Appwrite Sites

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Root directory: `frontend/`

### Required environment variable

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-dokploy-backend-domain>/api/v1` |

This is the only env var the frontend reads (checked — nothing else touches
`process.env`).

## 3. Deploy order

The two URLs are circular (backend needs to know the frontend's origin,
frontend needs to know the backend's URL), so:

1. Deploy the backend first with a placeholder `FRONTEND_ORIGIN` (or your
   best guess at the Appwrite domain if you're picking a fixed subdomain).
2. Deploy the frontend with `NEXT_PUBLIC_API_URL` pointing at the backend's
   real Dokploy URL.
3. Update the backend's `FRONTEND_ORIGIN` to the frontend's actual final
   URL and redeploy the backend (cookie auth will silently fail — requests
   will 401 — until this matches exactly).

## What was fixed for this

`app/controllers/application_controller.rb` set the auth cookie with
`same_site: :lax`. That works locally because `localhost:3000` and
`localhost:3001` differ only by port, which the Same-Site spec treats as
same-site. On Appwrite + Dokploy the frontend and backend are on genuinely
different domains — cross-site — and `SameSite=Lax` cookies are not sent on
cross-site `fetch`/XHR requests (only top-level navigations), so every
authenticated request would have silently dropped the cookie and login
would appear to succeed but nothing after it would work. Fixed to use
`SameSite=None` (paired with `Secure`, already conditional on
`Rails.env.production?`) in production, keeping `Lax` for local dev.

## Demo accounts

All seeded with password `aurion123`:

| Role | Email |
|---|---|
| Buyer | `buyer@aurion.et` |
| Vendor (Aurion Coffee Co.) | `vendor@aurion.et` |
| Vendor (Aurion Jewels, richer order history) | `aurion.jewels@vendors.aurion.et` |
| Admin | `admin@aurion.et` |
