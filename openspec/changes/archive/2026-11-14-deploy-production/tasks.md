# Tasks: Production Deployment

## 1. Containerization & App Build Configuration

- [x] 1.1 Create multi-stage `api/Dockerfile` with OpenJDK 17, JVM memory cap `-Xmx512m`, and verify docker build completes successfully.
- [x] 1.2 Configure `shop/next.config.ts` for `output: 'standalone'` and create `shop/Dockerfile` with Node 20 Alpine, verifying Next.js standalone build runs without missing modules.

## 2. Production Orchestration & Nginx Gateway

- [x] 2.1 Create `deploy/nginx/pws.conf` with upstream routing to Storefront (`:3000`), Core API (`:8080`), static Admin root, and ACME challenge support.
- [x] 2.2 Create `deploy/docker-compose.prod.yml` coordinating PostgreSQL 16, Spring Boot API, Next.js Storefront, and Nginx with persistent data volumes.
- [x] 2.3 Create `deploy/.env.prod.example` containing production configuration keys, fallback mode flags (`APP_SMS_PROVIDER=logging`, `APP_ZARINPAL_SANDBOX=true`), and owner credentials.

## 3. Host Automation & Deployment Scripts

- [x] 3.1 Create `deploy/setup-server.sh` to configure 4GB swap space (`/swapfile`), install Docker and Docker Compose plugin, and configure firewall ports 80/443/22.
- [x] 3.2 Create `deploy/deploy.sh` script to build Admin SPA (`npm run build`), build and start production Docker containers, and verify container health.

## 4. Remote Deployment & Live Verification

- [x] 4.1 Run host bootstrap on the target VPS (`94.184.25.112`), verify swap allocation (`free -h`), and clone/pull repository code.
- [x] 4.2 Execute production deploy on the server and verify HTTP 200 responses on `http://94.184.25.112` for Storefront, `/admin`, and `/api/actuator/health`.
