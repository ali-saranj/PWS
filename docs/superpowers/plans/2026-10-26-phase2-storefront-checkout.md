# Phase 2 — Storefront & Customer Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A high-converting, modern Next.js customer storefront matching the Iranian deli & grocery design spec ("سبد سبز" aesthetic) with full-text search, guest cart, just-in-time SMS OTP login, stock-reserved Zarinpal payment, real-time public order tracking, and admin order lifecycle management with SMS notifications.

**Architecture:** 
- **Backend (`api/`):** Spring Boot 3.5 modular architecture (`ir.pws.store.customer`, `ir.pws.store.cart`, `ir.pws.store.order`, `ir.pws.store.payment`). Customer auth uses isolated HTTP-only JWT cookies (`pws_shop_at`, `pws_shop_rt`). Inventory reservations prevent overselling during checkout. Zarinpal integration supports both sandbox and production. Multi-stage SMS updates fire upon order milestones.
- **Admin (`admin/`):** Existing React 19 + MUI admin app extended with an `/orders` feature supporting status transitions (`AWAITING_APPROVAL` -> `APPROVED` -> `PREPARING` -> `DISPATCHED` -> `DELIVERED` or `CANCELLED`).
- **Storefront (`shop/`):** Next.js (App Router), TypeScript, Tailwind CSS, Vazirmatn Persian typography, RTL default. Emerald green brand identity (`#10B981` / `#059669`) with crimson discount badges and amber promo accents.

**Tech Stack:** 
- Backend: Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA, Flyway, PostgreSQL 16, jjwt 0.12, WireMock 3, Zonky Embedded Postgres.
- Admin: React 19, TypeScript, MUI, TanStack Query 5, Vitest, RTL.
- Storefront: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, `@fontsource/vazirmatn`, Vitest / React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-25-grocery-deli-store-design.md`, `docs/superpowers/specs/2026-10-25-protein-store-design.md`.

## Global Constraints

- Monetary units: DB and API in whole **Rials** (`long`/`BIGINT`); all UIs display and accept **Toman** (`rials = toman × 10`) with Persian numerals.
- Customer cookies: `pws_shop_at` (15 min) and `pws_shop_rt` (30 days), `HttpOnly`, `SameSite=Lax`, `Secure` when `app.cookies.secure=true`. Path `/api/shop`.
- Order tracking code format: `TRK-<8-alphanumeric>` (e.g. `TRK-8K2N9F1X`), unique and indexable for instant tracking without requiring account sign-in.
- Order number format: `PWS-<Jalali YYMMDD>-<4-digit daily sequence>` (e.g. `PWS-050805-0001`).
- Stock reservation: 15-minute expiration window before unconsumed reservations return to available stock.
- Order state machine:
  `PENDING_PAYMENT` -> `AWAITING_APPROVAL` -> `APPROVED` -> `PREPARING` -> `DISPATCHED` -> `DELIVERED`
  `*` -> `CANCELLED` (auto-restocks inventory via stock ledger).
- Mobile normalization: `09xxxxxxxxx` (Persian/Arabic-Indic digits normalized automatically).
- SMS templates: Kavenegar lookup templates (`pws-otp`, `pws-order-paid`, `pws-order-approved`, `pws-order-shipped`).
- Testing: All backend tests pass with `./mvnw -q test`, admin tests with `npm test`, shop tests with `npm test`.

## Review Focus

1. **Race condition during stock reservation:** Two customers checking out the last unit of a deli product simultaneously. One must succeed and reserve the stock; the other must receive `OUT_OF_STOCK` (409) with no stock oversold.
2. **Duplicate payment callbacks:** Zarinpal callback invoked multiple times for the same authority must be idempotent—first verify updates order and consumes stock; subsequent calls safely return existing success details without re-decrementing stock.
3. **Expired reservation payment:** If a customer completes payment after the 15-minute reservation expires and stock was taken by someone else, payment records as `PAID`, order flags `needs_attention = true`, and stock is never forced negative.
4. **Guest cart to authenticated checkout:** Guest adds items to cart in localStorage; upon entering phone number and verifying OTP at checkout, cart merges smoothly into customer order without dropping items or quantities.
5. **Admin status progression & SMS triggering:** Transitioning an order through `APPROVED` and `DISPATCHED` dispatches corresponding customer SMS notifications and logs state transitions in `order_status_history`.

---

## File Structure

```
api/
  src/main/resources/db/migration/
    V8__customer_accounts_addresses.sql
    V9__orders_reservations_payments.sql
  src/main/java/ir/pws/store/
    config/AppProperties.java (extended with Zarinpal config)
    customer/
      Customer.java, CustomerRepository.java
      Address.java, AddressRepository.java
      CustomerPrincipal.java, CustomerJwtCookieFilter.java
      CustomerAuthService.java, CustomerAuthController.java
      CustomerAddressService.java, CustomerAddressController.java
      dto/*.java
    catalog/
      PublicCatalogController.java, PublicCatalogService.java
      dto/HomeCatalogResponse.java, ProductSearchResponse.java
    order/
      ShippingMethod.java, ShippingMethodRepository.java
      StockReservation.java, StockReservationRepository.java
      Order.java, OrderRepository.java, OrderStatus.java
      OrderItem.java, OrderItemRepository.java
      OrderStatusHistory.java, OrderStatusHistoryRepository.java
      Payment.java, PaymentRepository.java, PaymentStatus.java
      OrderService.java, CheckoutService.java
      ReservationExpiryJob.java
      PublicOrderController.java, ShopCheckoutController.java
      AdminOrderController.java, AdminOrderService.java
      dto/*.java
    payment/
      ZarinpalClient.java, ZarinpalProperties.java, ZarinpalPaymentResponse.java
admin/
  src/
    api/orders.ts
    features/orders/
      OrdersPage.tsx, OrdersPage.test.tsx
      OrderDetailDialog.tsx
      OrderStatusChip.tsx
shop/
  package.json, tsconfig.json, next.config.ts, tailwind.config.ts
  src/
    app/
      layout.tsx, page.tsx
      search/page.tsx
      category/[slug]/page.tsx
      products/[slug]/page.tsx
      checkout/page.tsx
      checkout/callback/page.tsx
      track/[trackingCode]/page.tsx
    components/
      Header.tsx, Footer.tsx
      HeroBanner.tsx, CategoryCircles.tsx, PromoTiles.tsx
      SpecialOffersCarousel.tsx, PopularProductsCarousel.tsx
      ProductCard.tsx, AddToCartButton.tsx
      CartDrawer.tsx, QuickAuthModal.tsx
    lib/
      api.ts, cartStore.ts, authStore.ts, format.ts
```

---

## Tasks

### Task 1: Customer DB Schema & Customer Auth Module

**Files:**
- Create: `api/src/main/resources/db/migration/V8__customer_accounts_addresses.sql`
- Create: `api/src/main/java/ir/pws/store/customer/Customer.java`
- Create: `api/src/main/java/ir/pws/store/customer/CustomerRepository.java`
- Create: `api/src/main/java/ir/pws/store/customer/Address.java`
- Create: `api/src/main/java/ir/pws/store/customer/AddressRepository.java`
- Create: `api/src/main/java/ir/pws/store/customer/CustomerAuthService.java`
- Create: `api/src/main/java/ir/pws/store/customer/CustomerAuthController.java`
- Create: `api/src/main/java/ir/pws/store/customer/CustomerAddressService.java`
- Create: `api/src/main/java/ir/pws/store/customer/CustomerAddressController.java`
- Create: `api/src/main/java/ir/pws/store/common/security/CustomerJwtCookieFilter.java`
- Modify: `api/src/main/java/ir/pws/store/common/security/SecurityConfig.java`
- Test: `api/src/test/java/ir/pws/store/customer/CustomerAuthIntegrationTest.java`

**Interfaces:**
- Produces:
  - `POST /api/shop/auth/otp`: sends 5-digit OTP via `OtpPurpose.CUSTOMER_LOGIN`.
  - `POST /api/shop/auth/verify`: verifies OTP, creates or loads `Customer`, sets `pws_shop_at` and `pws_shop_rt` cookies.
  - `GET /api/shop/auth/me`: returns authenticated customer profile.
  - `POST /api/shop/auth/logout`: clears customer cookies.
  - `GET/POST /api/shop/customer/addresses`: CRUD for delivery addresses with `is_default` handling.

- [x] **Step 1: Write `V8__customer_accounts_addresses.sql` migration**
- [x] **Step 2: Write failing test in `CustomerAuthIntegrationTest.java`**
  - Verify requesting OTP, verifying code, retrieving profile via `/api/shop/auth/me`, and address management.
- [x] **Step 3: Run test to confirm failure**
  - `cd api && ./mvnw test -Dtest=CustomerAuthIntegrationTest`
- [x] **Step 4: Implement Customer entities, repositories, auth service, controller, and security filter**
- [x] **Step 5: Run test to verify pass**
  - `cd api && ./mvnw test -Dtest=CustomerAuthIntegrationTest`
- [x] **Step 6: Commit**
  - `git commit -m "feat(api): customer accounts, addresses, and shop auth module"`

---

### Task 2: Public Storefront Catalog & Search API

**Files:**
- Create: `api/src/main/java/ir/pws/store/catalog/PublicCatalogService.java`
- Create: `api/src/main/java/ir/pws/store/catalog/PublicCatalogController.java`
- Create: `api/src/main/java/ir/pws/store/catalog/dto/HomeCatalogResponse.java`
- Create: `api/src/main/java/ir/pws/store/catalog/dto/ProductSummaryResponse.java`
- Create: `api/src/main/java/ir/pws/store/catalog/dto/ProductDetailResponse.java`
- Test: `api/src/test/java/ir/pws/store/catalog/PublicCatalogIntegrationTest.java`

**Interfaces:**
- Produces:
  - `GET /api/shop/catalog/home`: Returns featured categories, promotional banner items, "پیشنهادهای شگفت‌انگیز" (items with tiers or special discounts), and "پرفروش‌ترین محصولات".
  - `GET /api/shop/catalog/products`: Filterable by `categoryId`, `brandId`, `onSale` (boolean), `minPrice`, `maxPrice`, `sort` (`newest`, `price_asc`, `price_desc`, `popular`), with pagination.
  - `GET /api/shop/catalog/search?q=...`: Robust full-text search matching product `nameFa`, `nameEn`, `descriptionHtml`, brand name, category name, and variant SKU.
  - `GET /api/shop/catalog/products/{slug}`: Active product detail, sorted variants, volume discount ladder, images, stock availability.

- [x] **Step 1: Write failing tests in `PublicCatalogIntegrationTest.java`**
  - Tests home response sections, keyword search in product descriptions, price sorting, and slug detail.
- [x] **Step 2: Run test to confirm failure**
  - `cd api && ./mvnw test -Dtest=PublicCatalogIntegrationTest`
- [x] **Step 3: Implement `PublicCatalogService` and `PublicCatalogController` with Spring Data Specifications**
- [x] **Step 4: Run test to verify pass**
  - `cd api && ./mvnw test -Dtest=PublicCatalogIntegrationTest`
- [x] **Step 5: Commit**
  - `git commit -m "feat(api): public storefront catalog and multi-attribute search endpoints"`

---

### Task 3: Orders, Stock Reservations & Shipping Schema

**Files:**
- Create: `api/src/main/resources/db/migration/V9__orders_reservations_payments.sql`
- Create: `api/src/main/java/ir/pws/store/order/ShippingMethod.java`
- Create: `api/src/main/java/ir/pws/store/order/ShippingMethodRepository.java`
- Create: `api/src/main/java/ir/pws/store/order/StockReservation.java`
- Create: `api/src/main/java/ir/pws/store/order/StockReservationRepository.java`
- Create: `api/src/main/java/ir/pws/store/order/Order.java`
- Create: `api/src/main/java/ir/pws/store/order/OrderStatus.java`
- Create: `api/src/main/java/ir/pws/store/order/OrderItem.java`
- Create: `api/src/main/java/ir/pws/store/order/OrderStatusHistory.java`
- Create: `api/src/main/java/ir/pws/store/order/Payment.java`
- Create: `api/src/main/java/ir/pws/store/order/PaymentStatus.java`
- Test: `api/src/test/java/ir/pws/store/order/OrderModelIntegrationTest.java`

**Interfaces:**
- Produces: Tables for shipping methods, stock reservations with 15-min expiration, orders with tracking code, order items, status history, and payment gateway logs.

- [x] **Step 1: Write `V9__orders_reservations_payments.sql` migration**
- [x] **Step 2: Write failing test in `OrderModelIntegrationTest.java`**
- [x] **Step 3: Run test to confirm failure**
  - `cd api && ./mvnw test -Dtest=OrderModelIntegrationTest`
- [x] **Step 4: Implement entity models and Spring Data repositories**
- [x] **Step 5: Run test to verify pass**
  - `cd api && ./mvnw test -Dtest=OrderModelIntegrationTest`
- [x] **Step 6: Commit**
  - `git commit -m "feat(api): order, stock reservation, and payment database models"`

---

### Task 4: Checkout, Zarinpal Gateway & Idempotent Payment Callback

**Files:**
- Create: `api/src/main/java/ir/pws/store/payment/ZarinpalClient.java`
- Create: `api/src/main/java/ir/pws/store/order/CheckoutService.java`
- Create: `api/src/main/java/ir/pws/store/order/ShopCheckoutController.java`
- Create: `api/src/main/java/ir/pws/store/order/PublicOrderController.java`
- Create: `api/src/main/java/ir/pws/store/order/ReservationExpiryJob.java`
- Modify: `api/src/main/java/ir/pws/store/config/AppProperties.java`
- Test: `api/src/test/java/ir/pws/store/order/CheckoutAndPaymentIntegrationTest.java` (WireMock for Zarinpal)

**Interfaces:**
- Produces:
  - `POST /api/shop/checkout`: Reserves stock for 15 minutes, creates order, initiates Zarinpal transaction, returns gateway redirect URL.
  - `GET /api/shop/payments/zarinpal/callback?Authority=&Status=`: Handles gateway callback, verifies payment, transitions order to `AWAITING_APPROVAL`, deducts stock on hand, enqueues SMS with tracking code.
  - `GET /api/shop/orders/track/{trackingCode}`: Public tracking endpoint returning live order progress and masked delivery info.
  - `ReservationExpiryJob`: Background scheduler releasing expired unconsumed reservations.

- [x] **Step 1: Write failing tests in `CheckoutAndPaymentIntegrationTest.java`**
  - Tests stock reservation hold, successful payment callback with tracking code generation, duplicate callback idempotency, and public tracking lookup.
- [x] **Step 2: Run test to confirm failure**
  - `cd api && ./mvnw test -Dtest=CheckoutAndPaymentIntegrationTest`
- [x] **Step 3: Implement `ZarinpalClient`, `CheckoutService`, callback handler, and public tracking controller**
- [x] **Step 4: Run test to verify pass**
  - `cd api && ./mvnw test -Dtest=CheckoutAndPaymentIntegrationTest`
- [x] **Step 5: Commit**
  - `git commit -m "feat(api): checkout stock reservation, Zarinpal gateway adapter, and tracking lookup"`

---

### Task 5: Admin Order Processing & Multi-Stage SMS Status Transitions

**Files:**
- Create: `api/src/main/java/ir/pws/store/order/AdminOrderService.java`
- Create: `api/src/main/java/ir/pws/store/order/AdminOrderController.java`
- Create: `api/src/main/java/ir/pws/store/order/dto/AdminOrderSummaryResponse.java`
- Create: `api/src/main/java/ir/pws/store/order/dto/AdminOrderDetailResponse.java`
- Create: `api/src/main/java/ir/pws/store/order/dto/OrderStatusTransitionRequest.java`
- Test: `api/src/test/java/ir/pws/store/order/AdminOrderIntegrationTest.java`

**Interfaces:**
- Produces:
  - `GET /api/admin/orders`: List orders filtered by status (`AWAITING_APPROVAL`, `APPROVED`, etc.), customer mobile, or date.
  - `GET /api/admin/orders/{id}`: Detailed view with items, address snapshot, and audit timeline.
  - `POST /api/admin/orders/{id}/status`: Transitions status with audit logging:
    - `APPROVED`: Triggers SMS "سفارش شما تایید شد".
    - `PREPARING`: Marks in preparation.
    - `DISPATCHED`: Stores courier note and sends SMS "سفارش شما ارسال شد".
    - `DELIVERED`: Marks completed.
    - `CANCELLED`: Auto-restocks inventory via stock ledger.

- [x] **Step 1: Write failing tests in `AdminOrderIntegrationTest.java`**
  - Verifies status transitions, role permissions (`OWNER`, `ORDER_OPERATOR`), SMS outbox logging, and cancellation restocking.
- [x] **Step 2: Run test to confirm failure**
  - `cd api && ./mvnw test -Dtest=AdminOrderIntegrationTest`
- [x] **Step 3: Implement `AdminOrderService` and `AdminOrderController`**
- [x] **Step 4: Run test to verify pass**
  - `cd api && ./mvnw test -Dtest=AdminOrderIntegrationTest`
- [x] **Step 5: Commit**
  - `git commit -m "feat(api): admin order management and multi-stage SMS notifications"`

---

### Task 6: Admin UI Orders Management Feature

**Files:**
- Create: `admin/src/api/orders.ts`
- Create: `admin/src/features/orders/OrdersPage.tsx`
- Create: `admin/src/features/orders/OrderDetailDialog.tsx`
- Create: `admin/src/features/orders/OrderStatusChip.tsx`
- Modify: `admin/src/layout/nav.ts` (add Orders navigation item)
- Modify: `admin/src/routes.tsx` (add `/orders` route)
- Modify: `admin/src/i18n/fa.json`, `admin/src/i18n/en.json`
- Test: `admin/src/features/orders/OrdersPage.test.tsx`

**Interfaces:**
- Produces: React Admin interface with order filter tabs, order details modal, and action buttons for "تایید سفارش" (Approve), "آماده‌سازی" (Prepare), "ارسال پیک" (Dispatch with tracking note).

- [x] **Step 1: Add order translation keys and API client functions**
- [x] **Step 2: Write failing test in `OrdersPage.test.tsx`**
- [x] **Step 3: Run test to confirm failure**
  - `cd admin && npx vitest run src/features/orders/OrdersPage.test.tsx`
- [x] **Step 4: Implement `OrdersPage`, `OrderDetailDialog`, `OrderStatusChip`, and update navigation routes**
- [x] **Step 5: Run admin tests and build**
  - `cd admin && npm test && npm run build`
- [x] **Step 6: Commit**
  - `git commit -m "feat(admin): orders management page with status transition controls"`

---

### Task 7: Next.js Storefront Scaffold, Theme & Layout

**Files:**
- Create: `shop/package.json`
- Create: `shop/tsconfig.json`
- Create: `shop/next.config.ts`
- Create: `shop/tailwind.config.ts`
- Create: `shop/src/app/layout.tsx`
- Create: `shop/src/components/Header.tsx`
- Create: `shop/src/components/Footer.tsx`
- Create: `shop/src/lib/api.ts`
- Create: `shop/src/lib/cartStore.ts`
- Test: `shop/src/components/Header.test.tsx`

**Interfaces:**
- Produces: Responsive Next.js 15 App Router app with Persian RTL Vazirmatn layout, emerald green header with live search, sticky category navigation, customer auth trigger, and dynamic cart pill with badge count.

- [x] **Step 1: Initialize `shop/` project with Next.js, Tailwind CSS, Vazirmatn fonts, Lucide icons, and Vitest**
- [x] **Step 2: Write failing test for `Header` component**
- [x] **Step 3: Implement Root Layout, Tailwind theme configuration, Header, and Footer matching reference design**
- [x] **Step 4: Run tests and build**
  - `cd shop && npm test && npm run build`
- [x] **Step 5: Commit**
  - `git commit -m "feat(shop): scaffold Next.js storefront with emerald green theme and RTL layout"`

---

### Task 8: Storefront Homepage (Reference Design Alignment)

**Files:**
- Create: `shop/src/components/HeroBanner.tsx`
- Create: `shop/src/components/CategoryCircles.tsx`
- Create: `shop/src/components/PromoTiles.tsx`
- Create: `shop/src/components/SpecialOffersCarousel.tsx`
- Create: `shop/src/components/PopularProductsCarousel.tsx`
- Create: `shop/src/components/ValueBadges.tsx`
- Create: `shop/src/app/page.tsx`
- Test: `shop/src/app/HomePage.test.tsx`

**Interfaces:**
- Produces: Storefront landing page faithful to the "سبد سبز" reference:
  - Hero banner with headline "تأمین روزانه مواد غذایی با بهترین قیمت" and fresh produce styling.
  - Category circle row (سوسیس و کالباس, لبنیات, ترشیجات, تنقلات, etc.).
  - 3 promo banners (Red deli offer, Green fresh dairy, Warm snacks).
  - "پیشنهادهای شگفت‌انگیز" carousel with discount badge and direct add-to-cart.
  - Fast courier delivery value proposition banner.
  - "پرفروش‌ترین محصولات" carousel with customer ratings and prices in Toman.

- [x] **Step 1: Write failing test for `HomePage.test.tsx`**
- [x] **Step 2: Run test to confirm failure**
  - `cd shop && npm test`
- [x] **Step 3: Implement homepage sections and connect to `/api/shop/catalog/home`**
- [x] **Step 4: Run test and verify pass**
  - `cd shop && npm test`
- [x] **Step 5: Commit**
  - `git commit -m "feat(shop): homepage layout with carousels, promo tiles, and category circles"`

---

### Task 9: Search, Category & Catalog Listing Pages

**Files:**
- Create: `shop/src/app/search/page.tsx`
- Create: `shop/src/app/category/[slug]/page.tsx`
- Create: `shop/src/components/ProductCard.tsx`
- Create: `shop/src/components/FilterSidebar.tsx`
- Create: `shop/src/components/SortDropdown.tsx`
- Test: `shop/src/app/search/SearchPage.test.tsx`

**Interfaces:**
- Produces:
  - `/search?q=...`: Displays search query results matching categories, brands, or description keywords with active filters.
  - `/category/[slug]`: Subcategory filter, price range slider, in-stock toggle, and sort controls.
  - Reusable `ProductCard` with price in Toman, discount badge, weight/portion label, and instant add-to-cart button.

- [x] **Step 1: Write failing test for `SearchPage.test.tsx`**
- [x] **Step 2: Implement search page, category listing page, and filtering controls**
- [x] **Step 3: Run tests and verify pass**
  - `cd shop && npm test`
- [x] **Step 4: Commit**
  - `git commit -m "feat(shop): search results and category listing with faceted filters"`

---

### Task 10: Product Detail Page (PDP) & Volume Pricing

**Files:**
- Create: `shop/src/app/products/[slug]/page.tsx`
- Create: `shop/src/components/VariantSelector.tsx`
- Create: `shop/src/components/VolumeTierTable.tsx`
- Create: `shop/src/components/ProductImageGallery.tsx`
- Test: `shop/src/app/products/ProductDetailPage.test.tsx`

**Interfaces:**
- Produces: Detailed product page with image gallery, portion/cut selector (e.g. ۲۵۰ گرم اسلایس vs ۵۰۰ گرم), tiered volume discount table, quantity adjustment, and stock availability indicator.

- [x] **Step 1: Write failing test for `ProductDetailPage.test.tsx`**
- [x] **Step 2: Implement PDP components and server-rendered product loader**
- [x] **Step 3: Run test and verify pass**
  - `cd shop && npm test`
- [x] **Step 4: Commit**
  - `git commit -m "feat(shop): product detail page with variant selector and volume tiers"`

---

### Task 11: Cart Drawer, Just-in-Time OTP Checkout & Zarinpal Redirect

**Files:**
- Create: `shop/src/components/CartDrawer.tsx`
- Create: `shop/src/components/QuickAuthModal.tsx`
- Create: `shop/src/app/checkout/page.tsx`
- Create: `shop/src/lib/authStore.ts`
- Test: `shop/src/app/checkout/CheckoutPage.test.tsx`

**Interfaces:**
- Produces:
  - Slide-out Cart Drawer with item increment/decrement, Toman price calculations, and subtotal.
  - Checkout screen: prompts for mobile number & OTP if not already logged in, address entry/selection, courier shipping method, and "پرداخت آنلاین با زرین‌پال" button that redirects to payment gateway.

- [x] **Step 1: Write failing test for `CheckoutPage.test.tsx`**
- [x] **Step 2: Implement `CartDrawer`, `QuickAuthModal`, and `CheckoutPage` with Zarinpal redirect handling**
- [x] **Step 3: Run test and verify pass**
  - `cd shop && npm test`
- [x] **Step 4: Commit**
  - `git commit -m "feat(shop): cart drawer, SMS OTP checkout flow, and Zarinpal payment initiation"`

---

### Task 12: Payment Result & Real-Time Public Order Tracking

**Files:**
- Create: `shop/src/app/checkout/callback/page.tsx`
- Create: `shop/src/app/track/[trackingCode]/page.tsx`
- Create: `shop/src/components/OrderTrackingTimeline.tsx`
- Test: `shop/src/app/track/OrderTrackingPage.test.tsx`

**Interfaces:**
- Produces:
  - `/checkout/callback`: Handles return from Zarinpal, displays success/failure status, receipt reference ID, and tracking code button.
  - `/track/[trackingCode]`: Publicly accessible order status page showing live progress tracker:
    - ثبت سفارش (Placed & Paid)
    - تایید ادمین (Admin Approved)
    - در حال آماده‌سازی (Preparing)
    - ارسال با پیک (Dispatched with Courier notes)
    - تحویل داده شده (Delivered)

- [ ] **Step 1: Write failing test for `OrderTrackingPage.test.tsx`**
- [ ] **Step 2: Implement payment callback page and public tracking timeline view**
- [ ] **Step 3: Run test and verify pass**
  - `cd shop && npm test`
- [ ] **Step 4: Commit**
  - `git commit -m "feat(shop): payment result page and real-time public order tracking"`
