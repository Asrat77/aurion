# Deploying AURION

Backend (Rails API) → Dokploy **or** Azure Container Apps (both documented
below; Azure is what's actually live). Frontend (Next.js) → Appwrite Sites.

They'll be on different domains, so this is a cross-site deployment: the
frontend calls the backend's public URL over `fetch`, and auth is a signed
httpOnly cookie. That only works cross-site over HTTPS with
`SameSite=None` cookies and an exact-match CORS origin — both are already
wired up in this repo (see "What was fixed for this" below).

## 1. Backend

The repo has a production-ready multi-stage [Dockerfile](backend/Dockerfile)
(Rails 8's default: Ruby slim, Thruster in front of Puma, runs as
non-root). It listens on **port 8080**, not 80 — non-root processes can't
bind privileged ports (<1024) in most container sandboxes (this bit us on
Azure Container Apps with `bind: permission denied`; Dokploy would hit the
same wall). Whatever platform you use, point its ingress/target port at
`8080`.

**Smoke-test the build locally before deploying:**

```bash
cd backend
docker build -t aurion-backend .
# If you're on Apple Silicon and the target host is x86_64:
docker build --platform linux/amd64 -t aurion-backend .
docker run --rm -p 8080:8080 -e RAILS_MASTER_KEY=$(cat config/master.key) -e DATABASE_URL=... aurion-backend
curl http://localhost:8080/up   # should return 200
```

### 1a. Dokploy

Point Dokploy at the `backend/` directory as the build context — it builds
straight from the Dockerfile, nothing extra to write. Set the container
port to `8080` in Dokploy's proxy settings.

### 1b. Azure Container Apps

This repo's [.github/workflows/aurion-api-AutoDeployTrigger-...yml](.github/workflows)
builds `backend/` with plain `docker build` (not Azure's buildpack
auto-detection — that path failed with a CNB lifecycle permission error
when it couldn't find a Dockerfile at the repo root), pushes to **GitHub
Container Registry**, then runs `az containerapp update --image`.

Two Azure-specific gotchas we hit getting this working:
- **Region allow-list**: lab/student subscriptions often have a policy
  restricting which Azure regions you can deploy into (`RequestDisallowedByAzure`).
  Check the resource group's existing region, or Subscription → Policies →
  Compliance, rather than guessing regions one at a time.
- **GHCR image pulls**: the workflow authenticates the Container App's
  registry pull using the job's `GITHUB_TOKEN`, which expires when the job
  ends. Fine for the deploy itself, but Azure may fail to re-pull the image
  later (e.g. on scale-out) once that token is stale. Simplest fix for a
  project with nothing sensitive in the image: make the `aurion-api` GHCR
  package **public** (repo → Packages → package settings) so Azure never
  needs credentials to pull at all.

Set the Container App's **Ingress → Target port** to `8080`.

### Database

`config/database.yml` expects `DATABASE_URL` in production (comment in
[.env.example](backend/.env.example) references Neon Postgres — keep using
a managed Postgres rather than a container on Dokploy, so data survives
redeploys). Get a connection string from Neon (or whichever Postgres you
prefer) with `?sslmode=require`.

The container's entrypoint ([bin/docker-entrypoint](backend/bin/docker-entrypoint))
does not migrate production automatically. Run migrations as an explicit
release step (`RUN_DB_PREPARE=true ./bin/rails db:prepare`), verify them, and
then start the web process. Production seeds intentionally skip demo users and
fixed passwords; seed only an isolated staging database with a secret
`STAGING_DEMO_PASSWORD`.

### Required environment variables

| Variable | Value |
|---|---|
| `RAILS_MASTER_KEY` | Contents of `backend/config/master.key` (don't commit this file — it isn't tracked in git; copy it into Dokploy's secret env var UI) |
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` |
| `FRONTEND_ORIGINS` | Comma-separated exact origins for Express, Business, and Operations; no trailing slash |
| `COOKIE_SAME_SITE` | `none` in production, with HTTPS and secure cookies |
| `ALLOW_MOCK_PAYMENTS` | Legacy staging flag; production code always fails closed regardless of its value |
| `PROTECTED_PAYMENT_PROVIDER` | `disabled` until an approved provider account and settlement agreement exist; `sandbox` only outside production |
| `ALLOW_SANDBOX_PAYMENTS` | Legacy flag; sandbox is code-gated to non-production environments |
| `SANDBOX_WEBHOOK_SECRET` | Staging-only HMAC secret for the signed provider simulator |
| `ACTIVE_STORAGE_SERVICE` | `azure` after Azure Blob is provisioned; `local` is for development only |
| `AZURE_STORAGE_ACCOUNT_NAME` / `AZURE_STORAGE_ACCESS_KEY` | Azure Blob credentials from the platform secret store |
| `AZURE_STORAGE_CONTAINER` | Durable private container for contracts and evidence |
| `STAGING_DEMO_PASSWORD` | Staging-only secret used when deliberately seeding demo accounts |
| `RUN_DB_PREPARE` | `false` by default; enable only on the migration release process |

Optional: `ETB_PER_USD` (defaults to 140) sets the birr rate used to price
orders shipping to Ethiopia. `CHAPA_SECRET_KEY` is reserved for the later
ordinary retail gateway milestone; it does not activate Business protected
funds.

### Both platforms
- **Health check**: `GET /up` (Rails' built-in health endpoint).
- Both Dokploy (Traefik) and Azure Container Apps terminate TLS and forward
  plain HTTP to the container — `config/environments/production.rb` already
  has `config.assume_ssl = true` and `config.force_ssl = true`, so this
  works without extra config.

## 2. Frontend on Appwrite Sites

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Root directory: `frontend/`

There are two supported shapes. Both run the same commit; only environment
differs, so moving between them is a configuration change, not a rebuild of
the product.

### Option A — one Site (what ships before subdomains exist)

Leave `NEXT_PUBLIC_CHANNEL` unset and leave the channel origins blank. One
deployment then serves all three products from a single host:

| Path | Product |
|---|---|
| `/` and `/store`, `/checkout`, `/orders`, … | AURION Express |
| `/business` and everything beneath it | AURION Business |
| `/admin`, `/vendor` | AURION Operations |

This is the fastest way to put both products in front of a reviewer, and it
needs no DNS work.

### Option B — three Sites (one per product)

Create three independently rollbackable Sites from the same accepted commit.
Only the build-time channel differs:

| Site | `NEXT_PUBLIC_CHANNEL` | Scope |
|---|---|---|
| Express | `express` | Retail catalogue, cart, checkout, orders, returns |
| Business | `business` | Organizations, RFQs, supplier offers, protected trades |
| Operations | `operations` | Admin and supplier operations dashboards |

On the Business Site, `proxy.ts` rewrites every path into the `/business`
tree, so `business.<domain>/rfqs` serves the workspace with no visible prefix.
Each Site redirects paths belonging to another channel to that channel's
origin, which is why the origin variables below must be set in Option B.

Setting `NEXT_PUBLIC_CHANNEL=express` only takes effect once
`NEXT_PUBLIC_BUSINESS_ORIGIN` is also set; until then the deployment stays
unified, so a half-finished cutover cannot strand the Business product.

### Required environment variable

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-api-domain>/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Exact preview or production site URL |
| `NEXT_PUBLIC_EXPRESS_ORIGIN` | Express site origin (Option B only) |
| `NEXT_PUBLIC_BUSINESS_ORIGIN` | Business site origin (Option B only) |
| `NEXT_PUBLIC_OPERATIONS_ORIGIN` | Operations site origin (Option B only) |

See `frontend/.env.example` for the complete channel configuration.

## 2b. AI assistant (optional)

The assistant is off unless a provider is configured, and says so in the UI.
Set `AI_ASSISTANT_PROVIDER` on the **API** to one of `openai`, `anthropic`,
`gemini`, `mistral`, `deepseek`, `perplexity`, `xai`, `openrouter`, `ollama`,
plus that provider's key (`OLLAMA_API_BASE` for self-hosted). Optionally pin
`AI_ASSISTANT_MODEL`; otherwise a small, cheap model is chosen per provider.

`AI_ASSISTANT_HOURLY_LIMIT` caps messages per user per hour, since every turn
costs money at the provider. Answers are grounded on AURION's own records, and
every turn is recorded in `assistant_exchanges` and visible under Operations →
Matching. See `backend/.env.example`.

## 3. Deploy order

The two URLs are circular (backend needs to know the frontend's origin,
frontend needs to know the backend's URL), so:

1. Create isolated staging API/database/object-storage/jobs resources and list
   all three Appwrite preview origins in `FRONTEND_ORIGINS`.
2. Run migrations as a release, then deploy the backend with
   `PROTECTED_PAYMENT_PROVIDER=sandbox` only in staging.
3. Deploy all three Sites from the same frontend commit and verify channel
   route allowlists and absolute cross-channel links.
4. Replace `FRONTEND_ORIGINS` with final controlled origins only after DNS is
   confirmed. The base domain is a client prerequisite; do not assume
   `aurion.com` is controlled.
5. Start the Solid Queue worker separately with `backend/bin/jobs` and monitor
   failed provider-event jobs.

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

## Staging demo accounts

Created only when explicitly seeding an isolated staging database; never run
the seed task against production:

| Role | Email |
|---|---|
| Buyer | `buyer@aurion.et` |
| Vendor (Aurion Coffee Co.) | `vendor@aurion.et` |
| Vendor (Aurion Jewels, richer order history) | `aurion.jewels@vendors.aurion.et` |
| Admin | `admin@aurion.et` |
