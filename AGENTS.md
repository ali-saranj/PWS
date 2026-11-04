# PWS Monorepo — Master AI Agent Constitution & Architecture Guide

This document is the Single Source of Truth and Master Constitution for all AI agents working in this repository (Claude, Antigravity, Gemini, Cursor, etc.). `CLAUDE.md` is symlinked directly to this file.

---

## 1. Core Engineering & SDLC Principles

All agents working on PWS must adhere to the following workflow discipline:

### Spec-Driven Development (OpenSpec)
- For any non-trivial feature, refactor, or architectural change, work through **OpenSpec**:
  - Specs and task plans reside in `openspec/changes/<change-name>/`.
  - Proposals define rationale, scope boundaries, and non-goals.
  - Delta specifications live in `openspec/changes/<change-name>/specs/` using `ADDED / MODIFIED / REMOVED` requirements and `WHEN / THEN` acceptance criteria.
  - Tasks are tracked atomically in `tasks.md`.
  - Once verified, changes are synced and archived to `openspec/specs/` via `openspec archive`.

### Test-Driven Development (TDD)
- Follow the strict **RED → GREEN → REFACTOR** cycle:
  1. Write failing automated tests (unit, slice, or integration) that define expected behavior.
  2. Run the test and verify that it fails for the expected reason.
  3. Write the minimal production code necessary to turn tests green.
  4. Refactor while keeping all tests passing.
- Never write implementation code before automated tests exist.

### Verification Before Completion
- Never assume changes work without executing the exact verification commands.
- Run tests (`./mvnw test`, `npm test`), type-checks (`tsc -b`), linters (`npm run lint`), and builds (`npm run build`) in terminal before declaring a task done.
- Supply concrete command outputs as proof of verification.

### Scope Discipline & Chesterton's Fence
- **Touch only in-scope files**: Do not perform unsolicited refactorings or reformat unrelated files.
- **Chesterton's Fence**: Never delete or alter existing validations, filters, or security rules without understanding and demonstrating why they were introduced (consult `git log` and `git blame`).

### Master Anti-Rationalization Guardrails

| Forbidden Rationalization | Reality & Mandatory Behavior |
| :--- | :--- |
| *"This change is simple, I don't need a spec."* | Even small features have hidden edge cases. Clarify requirements and acceptance criteria first. |
| *"I'll write the tests after the code."* | Tests written post-hoc prove little because they were never observed failing against the bug/feature. Test first (RED). |
| *"Too simple to test."* | Simple code breaks silently. A unit test takes under a minute to write. |
| *"I already manually tested it in dev."* | Manual checks are ephemeral and untracked. Automated regression tests run on every build. |
| *"The check looks redundant, I'll delete it."* | Investigate git blame and design specs first. Guardrails are usually placed after regressions. |
| *"Should work now / I'm confident."* | Confidence is not evidence. Execute the test command in terminal and inspect output. |

---

## 2. Monorepo Architecture Overview

PWS (Persian Web Store) is a Persian (RTL-first) grocery and deli e-commerce platform (فروشگاه پروتئینی و سوپرمارکتی: سوسیس، کالباس، ترشیجات، سس، نان، پنیر و کنسرو).

The repository contains three independent applications with no root build tooling:

```
                                      ┌─────────────────────────────────────────┐
                                      │       Customer Storefront (shop/)       │
                                      │       Next.js 15 App Router (port 3000) │
                                      └────────────────────┬────────────────────┘
                                                           │ /api/* (reverse proxy)
                                                           ▼
┌─────────────────────────────────┐   /api/*  ┌─────────────────────────────────┐
│     Staff Back-Office (admin/)  │──────────▶│         Core API (api/)         │
│     Vite + React 19 (port 5173) │  /media/* │    Spring Boot 3.5 (port 8080)  │
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
   - **Framework**: Spring Boot 3.5.16 / Java 17 REST API (`ir.pws.store`).
   - **Database**: PostgreSQL 16 (Zonky embedded Postgres in local test-run; Flyway migrations `V1..V11`).
   - **Security**: Dual cookie-based JWT authentication (isolated contexts for staff and customers), BCrypt password hashing, SMS OTP verification.
   - **Domain Engine**: Tiered volume pricing, stock ledger with optimistic concurrency, reservation expiration jobs, and Zarinpal payment integration.

2. **`shop/` — Customer Storefront**
   - **Framework**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide icons, Zustand stores (`authStore.ts`, `cartStore.ts`).
   - **Localization**: RTL layout, Vazirmatn font typography, mobile-first responsive shopping cart, customer OTP modal, address management, and order tracking.
   - **Reverse Proxy**: Proxies `/api/*` to `http://localhost:8080` (browser talks same-origin, preserving cookies).

3. **`admin/` — Staff Back-Office**
   - **Framework**: Vite, React 19, TypeScript, Material UI (MUI 9) with `@mui/stylis-plugin-rtl`.
   - **State & Data**: TanStack Query v5, React Hook Form + Zod, i18next (`fa` default, `en` fallback).
   - **Features**: Catalog management (categories, brands, products, variants, volume tiers, image gallery), stock ledger adjustments, order lifecycle management, and audit logs.
   - **Reverse Proxy**: Proxies `/api/*` and `/media/*` to `http://localhost:8080`.

---

## 3. Domain Model & Business Invariants

### 1. Catalog & Tiered Volume Pricing (تخفیف پلکانی)
- Products have multiple variants (e.g., packages, weights in grams).
- Pricing supports tiered volume thresholds (e.g., 1–4 units at base price, 5–9 units at tier 1, 10+ units at wholesale tier).
- Published products require at least one active variant with valid pricing.

### 2. Inventory & Stock Ledger
- Inventory is tracked in `stock_ledger` using double-entry ledger delta records (`IN`, `OUT`, `RESERVE`, `RELEASE`, `EXPIRE`).
- Concurrency is protected via optimistic locking (`version` column) and database constraints.
- Cart checkout creates temporary stock reservations with a 15-minute expiration time. Background scheduled tasks expire stale reservations and return quantities to available stock.

### 3. Dual Authentication & Security Model
- **Staff Back-Office**:
  - Login via username + password, followed by mandatory 2FA SMS OTP.
  - Authentication tokens stored in HttpOnly cookies: access token `pws_admin_at` (15m), refresh token `pws_admin_rt` (7d).
  - CSRF protection is **strictly enforced** (`XSRF-TOKEN` cookie read and mirrored into `X-XSRF-TOKEN` header).
  - Method-level authorization via `@PreAuthorize(Roles.X)`:
    - `Roles.OWNER` (`hasRole('OWNER')`)
    - `Roles.CATALOG` (`hasAnyRole('OWNER','PRODUCT_MANAGER')`)
    - `Roles.ORDER` (`hasAnyRole('OWNER','ORDER_OPERATOR')`)
- **Customer Storefront**:
  - Passwordless authentication via Iranian mobile numbers (`09...`) and 6-digit SMS OTP.
  - Authentication tokens stored in HttpOnly cookies: access token `pws_shop_at` (15m), refresh token `pws_shop_rt` (30d).
  - CSRF protection is disabled on `/api/shop/**` because storefront uses same-origin proxy and isolated cookie domain.
  - Role: `Roles.CUSTOMER` (`hasRole('CUSTOMER')`).

### 4. Persian Localization & Text Processing
- **Text Normalization**: `ir.pws.store.common.text`:
  - `Digits.java`: Converts Persian/Arabic digits (`۱۲۳۴۵۶۷۸۹۰`) to ASCII numbers and formats currency/display strings.
  - `MobileNumbers.java`: Validates and normalizes Iranian mobile numbers (converts `+98...` or `0098...` to `09XXXXXXXXX`).
  - `JalaliDate.java`: Solar Hijri (Shamsi) calendar formatting and conversions.
  - `Slugs.java`: Persian slug generation for SEO URLs.
- **Frontend RTL**: Both storefront and admin are RTL-first (`dir="rtl"`) with Vazirmatn typography.

---

## 4. Commands Quick Reference

### Backend (`api/`)
```bash
cd api
./mvnw -q spring-boot:test-run       # Run API locally with embedded Postgres on :5433 (seed data, port 8080)
./mvnw -q verify                     # Run entire test suite (Zonky embedded Postgres, no Docker needed)
./mvnw -q test -Dtest=ProductApiTest                  # Run a single test class
./mvnw -q test -Dtest='ProductApiTest#someMethod'     # Run a single test method
rm -rf .devdb                        # Reset local dev database (API must be stopped)
```

### Staff Admin (`admin/`)
```bash
cd admin
npm run dev                          # Start Vite dev server on http://localhost:5173
npm test                             # Run Vitest test suite
npx vitest run src/features/products/TierEditor.test.tsx  # Run single test file
npm run lint                         # Run oxlint
npm run build                        # Type-check (tsc -b) & bundle (vite build)
```

### Customer Storefront (`shop/`)
```bash
cd shop
npm run dev                          # Start Next.js dev server on http://localhost:3000
npm test                             # Run Vitest test suite
npx vitest run src/components/CartDrawer.test.tsx         # Run single test file
npm run lint                         # Next.js ESLint
npm run build                        # Verify Next.js production build
```

### End-to-End (E2E) Browser Tests
```bash
# Repo root (drives Storefront & Admin against running API):
node run-browser-e2e.mjs
# Screenshots are saved to docs/screenshots/e2e/
```

### OpenSpec CLI Workflows
```bash
# Skills located in .agents/skills/
openspec-propose        # Propose a new change (proposal, specs, tasks)
openspec-apply-change   # Implement tasks from an active change
openspec-sync-specs     # Sync delta specs into main specs
openspec-archive-change # Archive completed change
```

---

## 5. Inviolable Architectural Rules

### 1. API Security & Matchers
- Any endpoint not explicitly matched in `SecurityConfig.java` is rejected with `403 Forbidden` (`anyRequest().denyAll()`).
- When introducing a new controller or route, explicitly register its path and HTTP method in `SecurityConfig.java`.
- Use method security `@PreAuthorize(Roles.CATALOG)`, `@PreAuthorize(Roles.ORDER)`, or `@PreAuthorize(Roles.OWNER)` on admin endpoints.

### 2. Error Handling & Bilingual Problem Details
- Never return generic error maps or throw raw `RuntimeException`.
- Throw `ApiException(ErrorCode.X)` or `ApiException.field("fieldName", ErrorCode.X)`.
- Renders RFC 7807 problem JSON with bilingual message details:
  ```json
  {
    "type": "https://api.pws.ir/errors/VALIDATION_FAILED",
    "title": "Validation Failed",
    "status": 400,
    "code": "VALIDATION_FAILED",
    "message": {
      "fa": "داده‌های ورودی نامعتبر است",
      "en": "Validation failed"
    }
  }
  ```
- **Rule**: Whenever a new `ErrorCode` is added to `ErrorCode.java`, corresponding entries **MUST** be added to both `api/src/main/resources/messages_fa.properties` and `api/src/main/resources/messages_en.properties`.

### 3. Database & Flyway Migrations
- `spring.jpa.hibernate.ddl-auto` is set to `validate`. Hibernate will never generate or alter DDL automatically.
- Every schema change requires a new migration script in `api/src/main/resources/db/migration/V<n>__<description>.sql`.
- **Never modify already committed or applied migration files**.

### 4. Time & Audit Logging
- Never call `Instant.now()`, `LocalDate.now()`, or `new Date()`. Inject `java.time.Clock` (configured in `ClockConfig.java`) to ensure deterministic testability.
- All mutating staff operations (create, update, delete, stock adjustments, order status changes) must record audit log entries using `AuditService.record(...)`.

### 5. Frontend i18n & RTL Typography
- **Admin**: All strings displayed in the back-office must be translated in both `admin/src/i18n/fa.json` and `admin/src/i18n/en.json`. Default locale is `fa` (RTL).
- **Storefront**: Styled RTL-first using Tailwind and Vazirmatn font.
- Numbers in user-facing Persian text should be rendered with Persian digits where appropriate.

---

## 6. Dev Credentials & Testing Cheat-Sheet

| Service | Address | Default Credentials / Context |
| :--- | :--- | :--- |
| **API Backend** | `http://localhost:8080` | Port 8080 (Embedded DB on 5433) |
| **Admin Back-Office** | `http://localhost:5173` | **User**: `owner` / **Password**: `ChangeMe12345` / **Mobile**: `09120000000` |
| **Storefront** | `http://localhost:3000` | Any Iranian mobile number (e.g. `09121112233`) |
| **SMS OTP in Dev** | Terminal console | `LoggingSmsSender` prints 6-digit OTP codes directly to the API terminal log. |
| **Dev DB Reset** | Local disk | Stop API, run `rm -rf api/.devdb`, restart `./mvnw -q spring-boot:test-run` |
