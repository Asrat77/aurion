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

Optional: `ETB_PER_USD` (defaults to 140) sets the birr rate used to price
orders shipping to Ethiopia. `CHAPA_SECRET_KEY` is reserved for the live
gateway, which is not implemented yet — checkout always runs in mock/demo mode
regardless of whether it is set.

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

### Required environment variable

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend-domain>/api/v1` |

This is the only env var the frontend reads (checked — nothing else touches
`process.env`).

## 3. Deploy order

The two URLs are circular (backend needs to know the frontend's origin,
frontend needs to know the backend's URL), so:

1. Deploy the backend first with a placeholder `FRONTEND_ORIGIN` (or your
   best guess at the Appwrite domain if you're picking a fixed subdomain).
2. Deploy the frontend with `NEXT_PUBLIC_API_URL` pointing at the backend's
   real public URL.
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
