# PWS — Persian Web Store (فروشگاه پروتئینی و سوپرمارکتی)

Modern, production-grade e-commerce monorepo tailored for deli, protein, and grocery retail (سوسیس، کالباس، ترشیجات، سس، نان، چیپس، و کنسرو).

The platform features a **Next.js customer storefront**, a **Vite + React staff back-office**, and a **Spring Boot 3 REST API** powered by PostgreSQL.

---

## Architecture Overview

```
                                      ┌─────────────────────────────────────────┐
                                      │       Customer Storefront (shop/)       │
                                      │       Next.js 15 App Router (port 3000) │
                                      └────────────────────┬────────────────────┘
                                                           │ /api/*
                                                           ▼
┌─────────────────────────────────┐   /api/*  ┌─────────────────────────────────┐
│     Staff Back-Office (admin/)  │──────────▶│         Core API (api/)         │
│     Vite + React (port 5173)    │           │    Spring Boot 3.4 (port 8080)   │
└─────────────────────────────────┘           └────────────────┬────────────────┘
                                                               │ JDBC
                                                               ▼
                                              ┌─────────────────────────────────┐
                                              │      PostgreSQL 16 Database     │
                                              │      (Embedded on port 5433     │
                                              │       or Docker on port 5432)   │
                                              └─────────────────────────────────┘
```

### Components

1. **`api/` — Core Backend Service**
   - **Framework**: Spring Boot 3 with Java 17.
   - **Database**: PostgreSQL 16 (embedded via test-run or Docker) with Flyway migrations.
   - **Security**: Dual cookie-based JWT authentication (isolated contexts for staff and customers), Argon2 password hashing, SMS OTP verification.
   - **E-Commerce Engine**: Tier-based wholesale/volume pricing, stock ledger with optimistic concurrency, reservation expiry background jobs, and Zarinpal payment integration.

2. **`shop/` — Customer Storefront**
   - **Framework**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide icons, Zustand state management.
   - **Localization & UX**: RTL-first layout using Vazirmatn font, mobile-optimized navigation, and responsive touch-friendly shopping cart.
   - **Capabilities**: Category & brand browsing, tiered volume pricing calculators, customer OTP login/registration modal, address book management, checkout flow, Zarinpal gateway redirect, and tracking code lookup with one-click re-ordering.

3. **`admin/` — Staff Back-Office Portal**
   - **Framework**: Vite, React 19, TypeScript, Material UI (MUI 9).
   - **Features**: Bilingual RTL (Persian) / LTR (English) switching, staff authentication with 2FA OTP, catalog management (categories, brands, products, variants, volume tiers, image gallery with WebP processing), inventory adjustments with stock ledger history, order management with status transitions, and audit logs.

---

## Tech Stack

| Domain | Technologies |
|---|---|
| **Backend** | Spring Boot 3.4, Java 17, Spring Security 6, Spring Data JPA, Flyway, Maven Wrapper |
| **Storefront** | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, Lucide React, Vazirmatn |
| **Admin** | Vite, React 19, TypeScript, Material-UI (MUI), TanStack React Query, React Hook Form, Zod |
| **Database** | PostgreSQL 16 (Embedded Zonky for zero-install local dev, or Docker Compose) |
| **Testing** | JUnit 5, Vitest, Testing Library, MSW (Mock Service Worker), Playwright E2E |

---

## Prerequisites

- **Java 17+**: Maven wrapper (`./mvnw`) is included; no standalone Maven installation is required.
- **Node.js 22+ & npm**: Make sure standard Node is first on your `$PATH`.
  > *Note on macOS*: If `node` points to an application bundle (e.g. ChatGPT.app), Vite native bindings may fail. Use `nvm` or Homebrew Node.

---

## Local Development Setup

### 1. Start the API (Backend)

The API ships with an embedded PostgreSQL 16 server running on port `5433` (storing data in `api/.devdb`). No Docker is needed to get started:

```bash
cd api
./mvnw -q spring-boot:test-run
```

- **Port**: `http://localhost:8080`
- **Database**: Embedded PostgreSQL on `localhost:5433`
- **Default Seed Data**: Applies automatically (`api/src/main/resources/db/dev`) with categories, brands, variants, volume tiers, and initial stock.
- **Default Staff Account**:
  - **Username**: `owner`
  - **Password**: `ChangeMe12345`
  - **Mobile**: `09120000000`
- **SMS OTP in Dev**: The `LoggingSmsSender` prints SMS verification codes directly to the API terminal log. Copy the OTP code from the console.

> **Resetting Dev Data**: Stop the API process and run `rm -rf api/.devdb`.

*(Alternative: Docker PostgreSQL)*
If you prefer running standard PostgreSQL via Docker:
```bash
docker compose -f deploy/docker-compose.dev.yml up -d
```
Then configure `spring.datasource.*` in `api/src/main/resources/application.properties` to target port `5432`.

---

### 2. Start the Staff Admin Portal

In a new terminal window:

```bash
cd admin
npm install
npm run dev
```

- **URL**: `http://localhost:5173`
- Proxies `/api` and `/media` requests directly to `http://localhost:8080`.
- Log in with `owner` / `ChangeMe12345`, then check the API console for the 6-digit OTP code.

---

### 3. Start the Customer Storefront

In a new terminal window:

```bash
cd shop
npm install
npm run dev
```

- **URL**: `http://localhost:3000`
- Proxies `/api` calls directly to `http://localhost:8080`.
- Browse products, add items to cart, test OTP login with any Iranian mobile number (e.g. `09121112233`), and inspect the checkout flow.

---

## Testing & Quality Assurance

### Backend Tests
```bash
cd api
./mvnw -q verify
```
Runs unit tests and integration slice tests with embedded PostgreSQL.

### Admin Tests
```bash
cd admin
npm test                  # Run Vitest test suite
npx tsc -b                # Type check
npm run build             # Verify production bundle
```

### Storefront Tests
```bash
cd shop
npm test                  # Run Vitest test suite
npm run build             # Verify Next.js production build
```

### End-to-End (E2E) Browser Verification
Automated browser test with Chrome verifying the full flow (Storefront browsing, customer OTP login, address addition, order placement, order tracking, and admin order fulfillment):

```bash
node run-browser-e2e.mjs
```
Screenshots from the E2E run are saved to `docs/screenshots/e2e/`.

---

## Repository Layout

```
.
├── admin/                    # Vite + React 19 + MUI staff back-office portal
│   ├── src/                  # App components, pages, RTL theme, and i18n
│   └── vite.config.ts        # Dev server & reverse proxy configuration
├── api/                      # Spring Boot 3 REST service
│   ├── src/main/java/        # ir.pws.store packages (catalog, inventory, customer, order, staff)
│   ├── src/main/resources/   # Flyway migrations, dev seeds, application config
│   └── pom.xml               # Maven configuration
├── shop/                     # Next.js 15 customer storefront (App Router)
│   ├── src/app/              # Next.js routes (catalog, cart, checkout, orders)
│   ├── src/components/       # Reusable UI widgets, header, footer, modals
│   └── tailwind.config.ts    # Tailwind styling & Vazirmatn typography
├── deploy/                   # Deployment assets (Docker Compose dev database)
├── docs/                     # Specifications, alignment plans, and screenshots
│   ├── screenshots/          # E2E test run screenshots
│   └── superpowers/
│       ├── specs/            # Architecture and product design specifications
│       └── plans/            # Implementation milestone plans
└── run-browser-e2e.mjs       # Automated end-to-end browser test script
```

---

## Production Deployment & SSL (HTTPS)

PWS is configured for automated, zero-downtime HTTPS deployments via Docker Compose, Nginx, and Certbot (Let's Encrypt):

### 1. Server Bootstrap (One-Time)
Run on a fresh AlmaLinux / EL10 or Ubuntu / Debian server:
```bash
sudo bash deploy/setup-server.sh
```
This configures a 4GB swap file, anti-sanction DNS mirrors, container runtime (Docker / Podman), and firewall rules for ports `22`, `80`, and `443`.

### 2. Configure Production Secrets
```bash
cp deploy/.env.prod.example deploy/.env.prod
# Edit deploy/.env.prod with strong secrets, database passwords, and your CERTBOT_EMAIL:
# APP_COOKIES_SECURE=true
# CERTBOT_EMAIL=ali.saranj1384@gmail.com
# APP_ZARINPAL_CALLBACK_URL=https://proteinirany.ir/api/shop/payments/zarinpal/callback
```

### 3. Bootstrap SSL Certificate (Initial Chicken-and-Egg Resolution)
```bash
# Test with Let's Encrypt Staging API first (optional):
bash deploy/init-ssl.sh --staging

# Issue genuine production certificate:
bash deploy/init-ssl.sh
```
`init-ssl.sh` creates a temporary self-signed certificate allowing Nginx to boot on port 443, issues genuine certificates for `proteinirany.ir` and `www.proteinirany.ir` via ACME webroot (`/.well-known/acme-challenge/`), and reloads Nginx gracefully.

### 4. Deploy & Verify Production Stack
```bash
bash deploy/deploy.sh
```
- **Port 80 (HTTP)**: Serves ACME challenges and Enamad verification file (`/13642013.txt`); permanently redirects (HTTP 301) all other traffic to `https://proteinirany.ir`.
- **Port 443 (HTTPS)**: Modern TLSv1.2/1.3 termination, HSTS, `www` redirect to apex domain, and reverse proxying to Storefront (`:3000`), Admin SPA (`/admin/`), and API (`:8080`).
- **Auto-Renewal**: The `pws-certbot` container checks for renewal every 12 hours, while `pws-nginx` reloads certificates periodically in the background without dropping active connections.

---

## Specifications & Documentation

- [Grocery & Deli Store Design Spec](file:///Users/ali/Documents/PWS/docs/superpowers/specs/2026-10-25-grocery-deli-store-design.md)
- [Customer Portal Design Spec](file:///Users/ali/Documents/PWS/docs/superpowers/specs/2026-10-26-customer-portal-design.md)
- [Phase 1 Foundation & Catalog Plan](file:///Users/ali/Documents/PWS/docs/superpowers/plans/2026-10-25-phase1-foundation-catalog.md)
- [Phase 2 Storefront & Checkout Plan](file:///Users/ali/Documents/PWS/docs/superpowers/plans/2026-10-26-phase2-storefront-checkout.md)
- [Customer Portal & Tracking Plan](file:///Users/ali/Documents/PWS/docs/superpowers/plans/2026-10-26-customer-portal.md)
