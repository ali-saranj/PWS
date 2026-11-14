# Proposal: Production Deployment

## Why

The PWS application (Storefront, Staff Admin, and Spring Boot Core API) currently runs only in local development environments. To launch the business online at `https://proteinirany.ir` on the target Linux VPS (`94.184.25.112`), we need a reproducible, memory-governed containerized deployment architecture that reliably serves all three applications, persists PostgreSQL data, terminates SSL, and guards against Out-Of-Memory (OOM) crashes on a 2GB RAM host.

## What Changes

- Add production Dockerfiles for:
  - Spring Boot API (`api/Dockerfile` multi-stage build, OpenJDK 17, JVM memory cap `-Xmx512m`)
  - Next.js Storefront (`shop/Dockerfile` standalone output build, Node.js 20 Alpine)
- Add production Nginx reverse proxy configuration (`deploy/nginx/pws.conf`) to:
  - Route `/` to Next.js Storefront
  - Route `/admin` to Admin SPA static build
  - Route `/api/*` and `/media/*` to Spring Boot Core API
  - Enable gzip compression, cache headers, and HTTPS/SSL readiness
- Add a unified production Docker Compose orchestration file (`deploy/docker-compose.prod.yml`) managing:
  - `postgres` (PostgreSQL 16 with persistent volume `pws_pgdata`)
  - `api` (Spring Boot Core API with automatic Flyway migration on start)
  - `shop` (Next.js SSR Storefront)
  - `nginx` (Gateway routing and static Admin serving)
- Add environment template (`deploy/.env.prod.example`) with production security defaults, and fallback modes for unconfigured external services (`APP_SMS_PROVIDER=logging`, `APP_ZARINPAL_SANDBOX=true`).
- Add server bootstrap & deployment scripts (`deploy/setup-server.sh` and `deploy/deploy.sh`) to configure a 4GB Swap file on the 2GB VPS, install Docker/Compose, configure firewall rules, and automate pulling/building and container restarts.

## Capabilities

### New Capabilities
- `deployment/production`: Defines production operational requirements including container orchestration, reverse proxy routing, persistent storage volumes, memory governance for constrained host environments, and unconfigured service fallbacks.

### Modified Capabilities
*(None - existing catalog and business domain specs remain unchanged)*

## Impact

- **New files in `deploy/`**: `docker-compose.prod.yml`, `nginx/pws.conf`, `.env.prod.example`, `setup-server.sh`, `deploy.sh`.
- **New build artifacts**: `api/Dockerfile`, `shop/Dockerfile`.
- **Admin**: Built statically during deploy and copied into Nginx web root.
- **Shop**: Next.js `next.config.ts` configured for standalone output.
- **Server host**: 4GB Swapfile configured, Docker CE installed, ports 80/443 exposed.
