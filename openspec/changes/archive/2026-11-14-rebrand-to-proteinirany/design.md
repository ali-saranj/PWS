# Design

## Context

The repository contains three primary applications:
1. `shop/`: Next.js 15 customer storefront (RTL, Tailwind CSS, Zustand, Vazirmatn).
2. `admin/`: React 19 + MUI staff portal (TanStack Query, i18next).
3. `api/`: Spring Boot 3.5 REST API (`ir.pws.store`).

See `proposal.md` for background and motivation.

## Goals / Non-Goals

**Goals:**
- Provide a unified, consistent brand appearance across Storefront, Admin, and customer communications as **پروتئین ایرانی (Protein Irany)**.
- Adopt the domain `http://proteinirany.ir` across metadata, canonical tags, and contact links.
- Gracefully migrate client-side cart storage from `sabad-sabz-cart` to `protein-irany-cart` without losing items for existing visitors.
- Update checkout order number formatting from `PWS-YYMMDD-XXXX` to `PI-YYMMDD-XXXX`.
- Centralize storefront brand strings to minimize future divergence.

**Non-Goals:**
- Renaming internal Java package trees (`ir.pws.store`) or database names (`pws_dev`), which are invisible internal development constructs and carry regression risks.
- Changing authentication session cookies (`pws_shop_at`, `pws_admin_at`), allowing existing customer and staff sessions to persist smoothly.

## Decisions

### Decision 1: Centralized Storefront Branding Config
Instead of scattering raw strings across `layout.tsx`, `Header.tsx`, `Footer.tsx`, and individual pages, create `shop/src/config/branding.ts`:
```ts
export const BRAND = {
  nameFa: 'پروتئین ایرانی',
  nameEn: 'Protein Irany',
  titleFa: 'پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی',
  sloganFa: 'سوسیس، کالباس، ترشیجات و محصولات تازه پروتئینی',
  domain: 'http://proteinirany.ir',
  supportEmail: 'support@proteinirany.ir',
  cartStorageKey: 'protein-irany-cart',
  legacyCartStorageKey: 'sabad-sabz-cart',
} as const;
```
*Rationale*: Ensures single source of truth across components, layout metadata, and test mocks.

### Decision 2: Seamless Cart Migration in Zustand Store
In `shop/src/lib/cartStore.ts`, implement a storage wrapper or migration check during store hydration:
- Check for `localStorage.getItem('protein-irany-cart')`.
- If absent, check `localStorage.getItem('sabad-sabz-cart')`. If present, migrate the JSON payload to the new key and purge the legacy key.
*Rationale*: Avoids cart emptying for users with items currently reserved in their browser.

### Decision 3: Order Number Generation Prefix
In `api/src/main/java/ir/pws/store/order/CheckoutService.java`:
- Change prefix from `PWS-` to `PI-`:
  ```java
  String candidate = "PI-" + datePart + "-" + randomNum;
  ```
- Update regex validator and test assertions in `CustomerOrderHistoryIntegrationTest`, `AdminOrderIntegrationTest`, and `CheckoutAndPaymentIntegrationTest`.
*Rationale*: `PI` clearly identifies "Protein Irany" in customer SMS messages and printed delivery labels.

## Risks / Trade-offs

- **[Risk] Test regressions across storefront and API test suites** → **Mitigation**: Update test fixtures and mock data in `Header.test.tsx`, `Footer.test.tsx`, `OrdersTab.test.tsx`, and Spring Boot integration tests; run all verification commands before completion.
- **[Risk] Search engines indexing outdated meta titles** → **Mitigation**: Update OpenGraph, canonical URLs, and meta description in `shop/src/app/layout.tsx`.
