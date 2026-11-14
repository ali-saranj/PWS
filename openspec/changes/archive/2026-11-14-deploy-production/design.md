# Technical Design: Production Deployment

## Context

See `proposal.md` for motivation and system background. The target host is a remote Linux VPS (`94.184.25.112`) with 2GB RAM and 1 vCPU, intended to serve `https://proteinirany.ir`. The codebase is hosted at `https://github.com/ali-saranj/PWS.git`.

## Goals / Non-Goals

**Goals:**
- Provide a robust, containerized deployment topology using Docker Compose.
- Ensure 100% stability on a 2GB RAM host by enforcing strict memory limits and a 4GB Swap file.
- Unify all ingress routing behind Nginx (port 80/443): serving Admin SPA as static files, proxying `/` to Next.js SSR, and `/api/*` and `/media/*` to Spring Boot.
- Support immediate operation over IP (`http://94.184.25.112`) with smooth zero-downtime transition to HTTPS when `proteinirany.ir` DNS propagates.
- Provide a single bootstrap script (`setup-server.sh`) and deploy script (`deploy.sh`).

**Non-Goals:**
- Multi-node clustering or Kubernetes (unnecessary complexity for single VPS).
- Automated GitHub Actions runners on the host (deployment will run directly via Git pull on the server).
- Mocking external SMS/Payment beyond standard logging/sandbox modes.

## Decisions

### Decision 1: Next.js Standalone Output Mode
- **Choice**: Enable `output: 'standalone'` in `shop/next.config.ts` and use a multi-stage Alpine Dockerfile.
- **Rationale**: Standalone output traces dependencies and bundles only the required files, cutting image size from ~1GB to ~120MB and reducing memory usage during startup.
- **Alternative considered**: Running `next start` on full node_modules. Rejected due to excessive disk and memory consumption.

### Decision 2: Spring Boot Resource Constraints in Container
- **Choice**: Multi-stage build using Eclipse Temurin 17 Alpine, running with `-Xmx512m -XX:+UseSerialGC`.
- **Rationale**: On a 2GB system, default JVM Ergonomics would attempt to claim up to 1GB for heap, starving Postgres and Node. `-Xmx512m` provides plenty of headroom for PWS traffic while guaranteeing memory stability. SerialGC is lightweight for single/dual-core VPS.
- **Alternative considered**: Default G1GC without limits. Rejected due to high risk of OOM termination.

### Decision 3: Serve Admin SPA Directly Through Nginx
- **Choice**: Build the Vite Admin SPA during deploy and mount `admin/dist` directly into the Nginx container at `/admin`.
- **Rationale**: Vite produces pure static assets (HTML/JS/CSS). Serving them directly from Nginx uses zero Node.js memory and provides optimal caching and gzip compression.
- **Alternative considered**: Dedicated Node container for Admin. Rejected as redundant resource waste.

### Decision 4: Swap Allocation and Host Pre-flight
- **Choice**: Configure a 4GB swapfile (`/swapfile`) with `vm.swappiness=10` during server setup.
- **Rationale**: Compiling Next.js and Maven packages has transient memory spikes (~1.2GB). Without swap, the Linux kernel invokes OOM Killer and aborts builds.
- **Alternative considered**: Building images locally and pushing to a registry. Rejected because the user selected direct Git clone on the server.

### Decision 5: Two-Phase Nginx Configuration (HTTP Initial -> HTTPS Automated)
- **Choice**: Initial Nginx configuration listens on port 80 with ACME challenge proxy. Once DNS propagates, Certbot issues the certificate and upgrades the server block to SSL/TLS with HTTP->HTTPS redirect.
- **Rationale**: `proteinirany.ir` currently returns `NXDOMAIN`. A hard requirement for SSL at boot would fail container startup until the domain record is active.

## Risks / Trade-offs

- **[Risk: Out Of Memory during Docker build]** → **Mitigation**: Swap file is configured and verified before any build commands execute; Maven daemon is disabled (`-Dmaven.repo.local` cached).
- **[Risk: DNS delay prevents SSL issuance]** → **Mitigation**: Environment supports `APP_COOKIES_SECURE=false` while running on plain HTTP / IP, and switches to `true` once Certbot issues the certificate for `proteinirany.ir`.
- **[Risk: Database data loss on container recreation]** → **Mitigation**: PostgreSQL uses a named Docker volume (`pws_pgdata`), and media uses a mounted volume (`pws_media`). Flyway migrations run automatically on API boot to guarantee schema parity.
