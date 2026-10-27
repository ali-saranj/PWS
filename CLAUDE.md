# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PWS is a Persian (RTL-first) grocery/deli e-commerce monorepo with three independent apps and no root build tooling:

- `api/` — Spring Boot 3.5 / Java 17 REST API (Maven wrapper), PostgreSQL 16 + Flyway. Package root `ir.pws.store`.
- `admin/` — staff back-office: Vite + React 19 + TypeScript + MUI, TanStack Query, react-hook-form + zod, i18next (fa/en).
- `shop/` — customer storefront: Next.js 15 App Router + Tailwind + Zustand.

Both frontends proxy `/api` to `http://localhost:8080` (admin also proxies `/media`), so the browser always talks same-origin and auth works via cookies.

Design specs and phase plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`; read the relevant spec before changing a feature area.

## Commands

### API (`cd api`)
```bash
./mvnw -q spring-boot:test-run      # run locally: embedded Postgres on :5433 (data in api/.devdb), dev seed, port 8080
./mvnw -q verify                    # all tests (each test class boots an embedded Zonky Postgres; no Docker needed)
./mvnw -q test -Dtest=ProductApiTest                 # single test class
./mvnw -q test -Dtest='ProductApiTest#someMethod'    # single test method
rm -rf .devdb                       # reset local dev data (API must be stopped)
```
Dev login: `owner` / `ChangeMe12345`. SMS is the `LoggingSmsSender` in dev, so OTP codes (staff 2FA and customer login) are printed to the API console.

### Admin (`cd admin`)
```bash
npm run dev            # http://localhost:5173
npm test               # vitest run
npx vitest run src/features/products/TierEditor.test.tsx   # single file (add -t "name" for one test)
npm run lint           # oxlint
npm run build          # tsc -b && vite build (also the type check)
```

### Shop (`cd shop`)
```bash
npm run dev            # http://localhost:3000
npm test               # vitest run
npx vitest run src/components/CartDrawer.test.tsx
npm run build
```

### E2E
`node run-browser-e2e.mjs` (repo root; Playwright from root `node_modules`) drives shop + admin against a running stack and writes screenshots to `docs/screenshots/e2e/`. It is machine-specific: it launches the local Chrome binary and scrapes OTP codes from a hard-coded API log file path (`LOG_FILE`) — update that path to wherever your API output is logged before running.

## API architecture

**Local dev entry point is a test-scope class.** `spring-boot:test-run` starts `src/test/java/.../DevStoreApplication`, which wraps `StoreApplication` with `support/DevDatabaseConfig` (persistent embedded Postgres on 5433) and the `dev` profile. The `dev` profile adds `classpath:db/dev` to Flyway locations, so `V1000__dev_seed.sql` only runs locally. `application.yml` holds dev-safe default secrets; `application-prod.yml` requires every secret from env vars, and `config/SecretsGuard` enforces that.

**Packages are by feature** (`catalog/{brand,category,product,variant,image,inventory}`, `customer`, `order`, `staff`, `otp`, `audit`, `notification`), each with entity, repository, service, controllers and a `dto/` subpackage. Cross-cutting code is in `common/` (`error`, `security`, `text`, `web`) and `config/`.

**URL namespaces drive security** (`common/security/SecurityConfig.java`):
- `/api/admin/**` — staff. Cookie JWT (`pws_admin_at`, refresh `pws_admin_rt` scoped to `/api/admin/auth`), CSRF enforced via `XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header. Login is password + SMS OTP (`/login` then `/verify`).
- `/api/shop/**` — customers. Separate cookie JWT (`pws_shop_at` / `pws_shop_rt`), separate secret, CSRF disabled. OTP-only login.
- Anything not explicitly listed is `denyAll()`. **A new endpoint must be added to the matcher list** (public or authenticated) or it will 403.
- Role checks use `@PreAuthorize(Roles.X)` with constants from `common/security/Roles.java` (`OWNER`, `PRODUCT_MANAGER`, `ORDER_OPERATOR`, `CUSTOMER`).

**Errors**: throw `ApiException(ErrorCode.X)` (or `ApiException.field(field, code)` for validation). `ApiExceptionHandler` + `ProblemFactory` render RFC 7807 problem JSON with `code`, bilingual `messages: {fa, en}` (from `messages_fa.properties` / `messages_en.properties`, key `error.<CODE>`), field `errors`, and `requestId`. Adding an `ErrorCode` means adding both message entries. The admin `ApiError` (`admin/src/api/client.ts`) consumes this shape directly.

**Audit**: staff mutations call `AuditService.record(action, entityType, id, before, after)`; it joins the caller's transaction so audit rows roll back with the change.

**Orders**: checkout creates `StockReservation`s against variant stock; `ReservationExpiryJob` releases expired ones; payment goes through `ZarinpalClient` (sandbox in dev) with a public callback endpoint. Status changes go through explicit transitions (`INVALID_STATUS_TRANSITION`). SMS notifications go through the `SmsSender` interface (`logging` or `kavenegar` provider, via `app.sms.provider`).

**Persistence**: `ddl-auto: validate` — every schema change needs a new Flyway migration in `db/migration/` (`V<n>__name.sql`, next number after the highest). `out-of-order` is enabled. Uploaded media goes to `app.media.dir` (default `api/.media`) and is served at `/media/**`.

**Time**: inject `java.time.Clock` (from `ClockConfig`) rather than calling `Instant.now()`; tests swap in `MutableClock`.

### API tests
Integration tests extend `support/IntegrationTest`: `@SpringBootTest` + MockMvc + embedded Zonky Postgres + `test` profile. Before each test `DbCleaner` truncates every table and the clock resets to `2026-01-01T00:00:00Z`, so tests must create their own data (the dev seed is not loaded). For staff endpoints, `@Autowired AdminAuth adminAuth`, then `adminAuth.createStaff(StaffRole.OWNER)` and `.with(adminAuth.staff(user))` on the MockMvc request (adds a valid access cookie and CSRF token); media writes go to a per-JVM temp dir. External HTTP (Kavenegar, Zarinpal) is stubbed with WireMock.

## Admin architecture

- `src/api/` — one module per resource on top of `apiFetch` in `client.ts`, which handles CSRF headers, a single shared in-flight refresh on 401 (the API revokes all sessions on refresh-token reuse, so never refresh concurrently), and conversion to `ApiError`.
- `src/auth/` — `AuthContext` boot (`/csrf` → `/me`), `LoginPage` (password + OTP), `RequireRole` route guard. Routes are in `src/routes.tsx`; nav items and their role visibility in `src/layout/nav.ts`.
- `src/features/<area>/` — pages, dialogs and colocated tests.
- i18n: all UI strings go in both `src/i18n/fa.json` and `en.json`. Default locale is `fa` (RTL; MUI RTL via stylis plugin in `theme/ThemeRoot.tsx`). `lib/format.ts` handles Persian digits/money; `components/LocalizedNumberField` accepts Persian digits in inputs.
- Tests: Vitest + Testing Library + MSW. `src/test/setup.ts` starts an MSW server that errors on unhandled requests, so every request a test triggers needs a `server.use(http...)` handler. `src/test/renderRoutes.tsx` renders the real route tree with a given signed-in staff (or `null`).

## Shop architecture

- App Router pages in `src/app/`; `/product/[slug]` just re-exports `/products/[slug]`.
- `src/lib/api.ts` is a thin `fetch` wrapper (`api.get/post/put/delete`, `credentials: 'include'`, base URL from `NEXT_PUBLIC_API_URL`, default same-origin via the Next rewrite).
- State: Zustand — `authStore.ts` (customer OTP auth against `/api/shop/auth/*`) and `cartStore.ts` (persisted to localStorage as `sabad-sabz-cart`).
- Several catalog pages (home, products, category, search, discounts, product detail) still read from `src/lib/mockProducts.ts` rather than the API; check before assuming data comes from `/api/shop/catalog`.
- Some components exist twice (e.g. `components/HeroBanner.tsx` and `components/home/HeroBanner.tsx`, `VariantSelector` under `components/` and `components/product/`). Check which one is actually imported before editing.
- Tests: Vitest with `globals: true`, jsdom, a localStorage mock and a mocked `next/navigation` in `src/test/setup.ts`; API calls are mocked with `vi` (no MSW here).

## Notes

- README is slightly stale in places: password hashing is BCrypt (not Argon2), Spring Boot is 3.5, and API config is YAML (`application*.yml`), not `application.properties`.
- Use Node 22+ from nvm/Homebrew; on macOS a `node` resolved from an app bundle breaks Vite native bindings.
