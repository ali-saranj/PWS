# Tasks

## 1. Storefront Core Branding & Config

- [x] 1.1 Create `shop/src/config/branding.ts` defining centralized brand constants (`nameFa`, `nameEn`, `titleFa`, `sloganFa`, `domain`, `supportEmail`, `cartStorageKey`, `legacyCartStorageKey`) and verify compilation with `npm run build -- --dry-run` or `npx tsc --noEmit` in `shop/`
- [x] 1.2 Update `shop/src/app/layout.tsx` metadata (title template, description, metadataBase `http://proteinirany.ir`, OpenGraph branding) and verify in dev build
- [x] 1.3 Update `shop/src/lib/cartStore.ts` to persist cart state under `protein-irany-cart` with automatic legacy migration from `sabad-sabz-cart`, and verify with `npx vitest run src/components/CartDrawer.test.tsx` in `shop/`

## 2. Storefront UI Components & Informational Pages

- [x] 2.1 Update `shop/src/components/Header.tsx` brand titles ("پروتئین ایرانی" mobile, "پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی" desktop, search placeholder "جستجو در پروتئین ایرانی...") and verify `npx vitest run src/components/Header.test.tsx` passes
- [x] 2.2 Update `shop/src/components/Footer.tsx` (brand copy, copyright statement, support email `support@proteinirany.ir`) and verify `npx vitest run src/components/Footer.test.tsx` passes
- [x] 2.3 Update informational pages and marketing components (`about/page.tsx`, `contact/page.tsx`, `categories/page.tsx`, `brands/page.tsx`, `HeroBanner.tsx`, `ValueBadges.tsx`, `not-found.tsx`, `track/page.tsx`) and verify all `shop/` tests pass with `npm test`

## 3. Admin Back-Office Branding

- [x] 3.1 Update `admin/index.html` title tag to "پنل مدیریت پروتئین ایرانی"
- [x] 3.2 Update `admin/src/i18n/fa.json` and `admin/src/i18n/en.json` application branding titles and verify with `npm test` in `admin/`

## 4. API Order Number Prefix

- [x] 4.1 Update `CheckoutService.java` to format order numbers with "PI-" prefix (`PI-YYMMDD-XXXX`)
- [x] 4.2 Update order number assertions in `CustomerOrderHistoryIntegrationTest`, `AdminOrderIntegrationTest`, and `CheckoutAndPaymentIntegrationTest`, and verify with `cd api && ./mvnw -q test -Dtest=CheckoutAndPaymentIntegrationTest,CustomerOrderHistoryIntegrationTest,AdminOrderIntegrationTest`

## 5. End-to-End Build & Verification

- [x] 5.1 Run full type checks and builds for `shop/` (`npm run build`) and `admin/` (`npm run build`) to ensure zero broken references or regressions

## Workflow follow-up

- Archive the change after implementation and test verification via `openspec archive`.
