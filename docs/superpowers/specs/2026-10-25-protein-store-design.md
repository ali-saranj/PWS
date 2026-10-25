# Protein Store — Design Spec

- **Date:** 2026-10-25
- **Status:** Approved in conversation, awaiting written-spec review
- **Stack:** Spring Boot 3 (Java 17) API · Next.js storefront · Vite + React admin · PostgreSQL 16 · Docker Compose

## 1. Purpose and scope

A production online store for a real Iranian business selling protein and supplement products. It takes real orders and real payments through Zarinpal. The system serves retail customers and bulk buyers through per-variant volume pricing, and gives staff a full admin panel to run the catalog, orders, customers and reports.

### 1.1 Decisions made with the owner

| Topic | Decision |
|---|---|
| Market | Iran |
| Payments | Zarinpal (redirect, callback, server-side verify) |
| Languages | Persian (RTL, default) and English, with a language switcher, on both storefront and admin |
| Wholesale | Volume discounts only: per-variant quantity tiers that apply to everyone. No business accounts |
| Shipping | Admin-defined methods with fixed cost and optional free-over threshold; tracking code entered manually |
| Customer sign-in | Mobile number + SMS one-time code |
| Admin scope (v1) | Products, inventory, orders and shipping, customers, staff roles, dashboard and reports |
| Storefront extras (v1) | Discount codes, reviews and ratings, SMS order updates |
| Hosting | VPS inside Iran running Docker Compose |
| Architecture | Approach C: Next.js storefront (SSR for SEO), separate Vite admin SPA, Spring Boot API |

### 1.2 Working assumptions (accepted)

- Money is stored as whole Rials (`BIGINT`) and displayed as Toman.
- Persian UI uses Persian digits and Jalali (Shamsi) dates; English UI uses Western digits and Gregorian dates.
- Product, category, brand and shipping-method texts are entered in both languages; a missing English value falls back to Persian.
- The SMS provider sits behind an interface; Kavenegar is the default implementation.
- Staff sign in with username + password + SMS code. Customer tokens can never reach the admin API.
- No guest checkout: customers sign in with their mobile number before checkout.
- Stock is held for 15 minutes while the customer pays.
- Refunds are paid outside the system (through the Zarinpal dashboard or bank transfer) and recorded on the order by an admin.

### 1.3 Out of scope for v1

Wholesale business accounts and credit terms, carrier API integrations, multi-warehouse stock, nutrition-facts and lab-certificate fields, blog/CMS beyond static pages, native mobile apps, loyalty points.

## 2. System layout

### 2.1 Containers

| Container | Responsibility |
|---|---|
| `nginx` | TLS termination. Routes `shop.<domain>` → `storefront`, `admin.<domain>` → `admin` static files, `/api/**` on both hosts → `api`. Serves `/media/**` from the uploads volume. |
| `storefront` | Next.js (App Router, TypeScript), server-rendered. Locale-prefixed routes `/fa/...` and `/en/...`; `/` redirects to `/fa`. |
| `admin` | Vite + React + TypeScript SPA built to static files, MUI component library with RTL support. |
| `api` | Spring Boot 3, Java 17. The only component that talks to the database, Zarinpal and the SMS provider. |
| `postgres` | PostgreSQL 16; schema managed by Flyway. |

Volumes: `pgdata`, `uploads` (product images, shared read-only with nginx), `backups`.

### 2.2 Repository layout

```
PWS/
  api/          Spring Boot (Maven wrapper)
  storefront/   Next.js
  admin/        Vite + React
  deploy/       docker-compose.yml, docker-compose.dev.yml, nginx/, backup scripts, .env.example
  docs/         specs and plans
```

A single git repository.

### 2.3 API modules

The API is one Spring Boot app split into packages under `ir.<company>.store` (the base package name is fixed when the project is scaffolded). Each module exposes a service interface; other modules use only that interface, never another module's repositories.

| Module | Owns |
|---|---|
| `catalog` | categories, brands, products, images, variants, volume tiers, stock and reservations |
| `customer` | customers, addresses, OTP sign-in |
| `cart` | server-side carts |
| `order` | checkout, orders, the status state machine, shipping methods |
| `payment` | `PaymentGateway` interface, Zarinpal implementation, reconciliation job |
| `promotion` | coupons |
| `review` | reviews and moderation |
| `notification` | `SmsSender` interface, Kavenegar implementation, logging fake, retry queue |
| `staff` | staff users, roles, audit log |
| `reporting` | dashboard and report queries, CSV export |
| `content` | static pages (about, contact, terms, shipping and returns) |
| `common` | errors, security, money and locale helpers |

### 2.4 API surface and auth

- `/api/store/**`: public catalog endpoints plus customer endpoints that require sign-in.
- `/api/admin/**`: staff only; every endpoint declares the roles allowed.
- Auth uses JWT access tokens (15 minutes) and refresh tokens (30 days for customers, 12 hours for staff). Both are httpOnly, Secure, SameSite=Lax cookies.
- Customer and staff tokens use different signing keys and audiences, and cookies are scoped to their own host.
- Refresh tokens are stored hashed in the database and rotated on each use, so signing out or blocking an account revokes them.
- Unsafe HTTP methods are protected against CSRF with the double-submit cookie pattern.

## 3. Data model

All tables have `id BIGSERIAL`, `created_at` and `updated_at`. Tables that admins edit concurrently (`product`, `variant`, `orders`, `coupon`, `shipping_method`, `staff_user`) carry `version` for optimistic locking. Money columns are `BIGINT` Rials.

### 3.1 Catalog

- **category**: `name_fa`, `name_en`, `slug` (unique), `parent_id` (nullable, self-reference), `sort_order`, `active`.
- **brand**: `name_fa`, `name_en`, `slug` (unique), `logo_path`, `active`.
- **product**: `brand_id`, `category_id`, `slug` (unique), `name_fa`, `name_en`, `description_fa`, `description_en` (sanitised rich text), `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`), `featured`, `seo_title_fa/en`, `seo_description_fa/en`, `rating_avg`, `rating_count`.
- **product_image**: `product_id`, `path`, `sort_order`, `alt_fa`, `alt_en`. Uploads accept JPEG, PNG or WebP up to 5 MB. The server re-encodes each upload to WebP at 1600 px and 400 px widths.
- **variant**: `product_id`, `sku` (unique), `flavour_fa`, `flavour_en`, `size_label`, `weight_grams`, `base_price`, `compare_at_price` (nullable), `stock_on_hand`, `low_stock_threshold`, `active`, `sort_order`.
- **volume_tier**: `variant_id`, `min_qty` (≥ 2, unique per variant), `unit_price` (must be lower than `base_price` and lower than any tier with a smaller `min_qty`).
- **stock_reservation**: `variant_id`, `order_id`, `qty`, `expires_at`, `status` (`ACTIVE`, `CONSUMED`, `RELEASED`).
- **stock_movement**: `variant_id`, `delta`, `reason` (`ORDER_PAID`, `ORDER_CANCELLED`, `MANUAL_ADJUSTMENT`, `INITIAL`), `ref_id`, `staff_user_id` (nullable), `note`.

**Pricing rule:** the unit price for quantity `q` is the `unit_price` of the tier with the largest `min_qty ≤ q`, or `base_price` if no tier qualifies. The price applies to every unit in that cart line.

**Available stock:** `stock_on_hand − SUM(qty of ACTIVE, unexpired reservations)`.

### 3.2 Customers

- **customer**: `mobile` (unique, normalised `09xxxxxxxxx`), `first_name`, `last_name`, `blocked`, `last_login_at`.
- **address**: `customer_id`, `province`, `city`, `line`, `postal_code` (10 digits), `recipient_name`, `recipient_mobile`, `is_default`.
- **otp_code**: `mobile`, `purpose` (`CUSTOMER_LOGIN`, `STAFF_LOGIN`), `code_hash`, `expires_at` (2 minutes), `attempts` (max 5), `consumed_at`.
- **refresh_token**: `subject_type` (`CUSTOMER`, `STAFF`), `subject_id`, `token_hash`, `expires_at`, `revoked_at`.

### 3.3 Cart and orders

- **cart**: `customer_id` (unique). **cart_item**: `cart_id`, `variant_id`, `qty`, unique on (`cart_id`, `variant_id`).
- **shipping_method**: `name_fa`, `name_en`, `description_fa/en`, `cost`, `free_over` (nullable), `active`, `sort_order`.
- **orders**: `number` (unique, `PWS-<jalali yymmdd>-<4-digit daily sequence>`), `customer_id`, address snapshot columns, `shipping_method_id`, `shipping_name`, `shipping_cost`, `subtotal`, `discount_total`, `total`, `coupon_id`, `coupon_code`, `status`, `tracking_code`, `refund_amount`, `refund_note`, `admin_note`, `placed_at`, `paid_at`, `needs_attention` (boolean).
- **order_item**: `order_id`, `variant_id`, `product_name_fa/en`, `variant_label_fa/en`, `sku`, `unit_price`, `qty`, `line_total`.
- **order_status_history**: `order_id`, `from_status`, `to_status`, `actor_type` (`CUSTOMER`, `STAFF`, `SYSTEM`), `actor_id`, `note`.
- **payment**: `order_id`, `gateway` (`ZARINPAL`), `amount`, `authority` (unique), `status` (`INITIATED`, `PAID`, `FAILED`, `EXPIRED`), `ref_id`, `card_pan_masked`, `raw_request`, `raw_response` (JSONB).

### 3.4 Promotions, reviews, content, staff

- **coupon**: `code` (unique, case-insensitive), `type` (`PERCENT`, `FIXED`), `value`, `max_discount` (nullable), `min_order` (nullable), `starts_at`, `ends_at`, `usage_limit` (nullable), `per_customer_limit` (nullable), `used_count`, `active`. A coupon discounts the subtotal only, never shipping.
- **coupon_redemption**: `coupon_id`, `order_id`, `customer_id`.
- **review**: `product_id`, `customer_id`, `order_id`, `rating` (1–5), `body` (≤ 2000 characters), `status` (`PENDING`, `APPROVED`, `REJECTED`), one per customer per product. Approving or rejecting a review recomputes the product's `rating_avg` and `rating_count`.
- **content_page**: `slug`, `title_fa/en`, `body_fa/en`.
- **staff_user**: `username` (unique), `password_hash` (bcrypt, cost 12), `mobile`, `full_name`, `role` (`OWNER`, `PRODUCT_MANAGER`, `ORDER_OPERATOR`), `active`.
- **audit_log**: `staff_user_id`, `action`, `entity_type`, `entity_id`, `before` and `after` (JSONB), `ip`.
- **sms_outbox**: `mobile`, `template`, `params` (JSONB), `status` (`PENDING`, `SENT`, `FAILED`), `attempts`, `next_attempt_at`, `last_error`.

## 4. Flows

### 4.1 Customer sign-in

1. `POST /api/store/auth/otp {mobile}`. The server normalises the number (Persian digits and `+98` prefix accepted) and rate-limits requests: 1 code per mobile per 2 minutes, 5 per mobile per hour, 20 per IP per hour. It then generates a 5-digit code from `SecureRandom`, stores its hash and sends it by SMS synchronously. If the SMS provider fails, the request returns `SMS_UNAVAILABLE`.
2. `POST /api/store/auth/verify {mobile, code}` checks expiry, the attempt count and the hash, then marks the code consumed. The customer account is created on first sign-in (a blocked customer gets `ACCOUNT_BLOCKED`). The server sets the access and refresh cookies.
3. `POST /api/store/auth/refresh` and `POST /api/store/auth/logout`.

### 4.2 Staff sign-in

`POST /api/admin/auth/login {username, password}` checks the password, then sends an SMS code to the staff member's mobile number and returns a short-lived challenge token. `POST /api/admin/auth/verify {challenge, code}` sets the admin cookies. After 5 failed passwords in 15 minutes the username is locked for 15 minutes. The first `OWNER` account is created from environment variables on first startup if no staff users exist.

### 4.3 Checkout and payment

1. `POST /api/store/checkout {addressId, shippingMethodId, couponCode?}` runs in a single transaction. It:
   - loads the cart;
   - locks the variant rows (`SELECT … FOR UPDATE`);
   - re-prices the cart from current prices and tiers;
   - checks that variants are active and stock is available;
   - validates the coupon (date window, limits, minimum order);
   - computes shipping (free when the subtotal after discount ≥ `free_over`);
   - creates the order (`PENDING_PAYMENT`), its items and reservations that expire in 15 minutes.

   The customer's cart is cleared only when the payment is confirmed.
2. The API calls Zarinpal `POST https://payment.zarinpal.com/pg/v4/payment/request.json` with `merchant_id`, `amount` (Rials), `callback_url`, `description` (the order number) and `metadata.mobile`. On `code = 100` it saves a `payment` row (`INITIATED`, `authority`) and returns `https://payment.zarinpal.com/pg/StartPay/{authority}`. Otherwise the reservations are released and the request returns `PAYMENT_GATEWAY_ERROR`.
3. `POST /api/store/orders/{number}/pay` re-runs step 2 for an order that is still `PENDING_PAYMENT` and whose reservations are active (it re-reserves stock if they lapsed and stock is available).
4. The callback is `GET /api/store/payments/zarinpal/callback?Authority=&Status=`. It looks up the payment by `authority`:
   - **Already `PAID`:** redirect to the success page (the callback can safely run more than once).
   - **`Status=NOK`:** the payment becomes `FAILED`. The order stays `PENDING_PAYMENT` until its reservations expire, and the customer is redirected to the failure page with a retry button.
   - **`Status=OK`:** the server calls `POST .../pg/v4/payment/verify.json` with `merchant_id`, `authority` and the amount stored on our side. Code `100` or `101` counts as success. In one transaction the server then:
     - sets the payment to `PAID` and stores `ref_id` and `card_pan`;
     - sets the order to `PAID` and stores `paid_at`;
     - turns the reservations into `CONSUMED` and lowers `stock_on_hand`, writing `stock_movement` rows;
     - records the coupon redemption and increases `used_count`;
     - clears the cart;
     - adds a "paid" SMS to `sms_outbox`.

     Any other verify code sets the payment to `FAILED`.
5. **Reservation expiry job (every minute):** releases expired `ACTIVE` reservations. A `PENDING_PAYMENT` order with no active reservations and no successful payment becomes `CANCELLED` (actor `SYSTEM`) 30 minutes after it was placed.
6. **Reconciliation job (every 10 minutes):** calls Zarinpal's `unVerified.json` endpoint. Each listed authority that matches one of our payments goes through the same verify path as step 4. If the order was already cancelled or the stock is gone, the payment is still recorded as `PAID`, and the order gets `needs_attention = true` and is shown on the admin dashboard so an admin can arrange a refund. Stock is never taken below zero.
7. Sandbox mode (`ZARINPAL_SANDBOX=true`) switches the base URL to `https://sandbox.zarinpal.com`.

### 4.4 Order state machine

```
PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED
PENDING_PAYMENT → CANCELLED   (customer cancels, or expiry job)
PAID | PROCESSING → CANCELLED (staff; restocks; refund_amount and refund_note required)
```

- Every other transition is rejected with `INVALID_STATUS_TRANSITION`.
- `→ SHIPPED` requires `tracking_code` and adds a "shipped" SMS to the outbox.
- Every transition writes `order_status_history`; staff transitions also write to `audit_log`.

### 4.5 SMS sending

Sign-in codes are sent synchronously. Order SMS messages go through `sms_outbox`: a job runs every 30 seconds and retries each message up to 5 times with exponential backoff. Kavenegar's template messages (`verify/lookup`) are used for both, so the message text is managed in the provider's panel. In development a fake `SmsSender` writes messages to the log.

### 4.6 Reviews

Customers can post a review only for a product that appears in one of their `DELIVERED` orders, and only once per product. Reviews start as `PENDING` and become public once an admin approves them.

## 5. Error handling and operations

- Errors follow RFC 7807 `application/problem+json` with `code`, `title`, `detail`, `messages: {fa, en}`, `requestId` and, for validation failures, `errors: [{field, code, message}]`.
- Error codes: `VALIDATION_FAILED`, `NOT_FOUND`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT` (optimistic lock), `OUT_OF_STOCK`, `VARIANT_INACTIVE`, `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_LIMIT_REACHED`, `COUPON_MIN_ORDER`, `OTP_INVALID`, `OTP_EXPIRED`, `OTP_TOO_MANY_ATTEMPTS`, `RATE_LIMITED`, `SMS_UNAVAILABLE`, `ACCOUNT_BLOCKED`, `PAYMENT_GATEWAY_ERROR`, `INVALID_STATUS_TRANSITION`, `REVIEW_NOT_ALLOWED`.
- Outbound HTTP calls (Zarinpal and SMS) use a 10-second timeout; only idempotent calls are retried.
- Logs are JSON with a `requestId` (an `X-Request-Id` header, generated if missing); secrets and full card numbers are never logged.
- Spring Actuator `health` is exposed to nginx and Docker health checks only.
- User-supplied rich text is sanitised on the server. Uploads are checked by content type and decoded as images before being saved.

## 6. Front ends

### 6.1 Storefront (Next.js)

- **Routes:** `/[locale]` (home), `/[locale]/c/[slug]` (category), `/[locale]/search`, `/[locale]/p/[slug]` (product), `/[locale]/cart`, `/[locale]/checkout`, `/[locale]/payment/result`, `/[locale]/login`, `/[locale]/account/{orders,orders/[number],addresses,profile}`, `/[locale]/pages/[slug]`.
- **Data fetching:** catalog pages fetch from the API on the server, cached with tag-based revalidation for 60 seconds. Pages for signed-in customers are rendered on demand.
- **Listing:** filters for brand, flavour, size, price range and in-stock; sorting by newest, price ascending/descending or popular; 24 items per page; filter state kept in the query string.
- **Product page:** gallery, a variant selector (flavour × size), live tier pricing for the chosen quantity, a tier table, stock badge, approved reviews and Product JSON-LD.
- **SEO:** a `sitemap.xml` covering both locales, `hreflang` alternate links, canonical URLs, Open Graph tags.
- **i18n:** message files `fa.json` and `en.json`; `dir="rtl"` for `fa`; the Vazirmatn font for Persian and Inter for English; formatting helpers for Toman with Persian digits and Jalali dates (`date-fns-jalali`).
- **Layout:** mobile-first.

### 6.2 Admin (Vite + React + MUI)

- **Libraries:** React Router, TanStack Query and React Hook Form with Zod; MUI with RTL support through the `stylis-plugin-rtl` cache; the same fa/en message approach as the storefront; MUI X Date Pickers with a Jalali adapter.
- **Screens:**
  - dashboard (sales KPIs, chart, best-sellers, low stock, orders to process, `needs_attention` orders);
  - products list and editor (tabs: basics in both languages, images, variants grid, volume tiers, SEO);
  - categories (tree) and brands;
  - inventory (bulk stock edits and movement log);
  - orders list and detail;
  - customers;
  - shipping methods;
  - coupons;
  - review moderation;
  - content pages;
  - reports with CSV export;
  - staff;
  - audit log.
- **Access by role:**

| Area | OWNER | PRODUCT_MANAGER | ORDER_OPERATOR |
|---|---|---|---|
| Dashboard | ✔ | ✔ (no revenue figures) | ✔ (no revenue figures) |
| Catalog, inventory, coupons, reviews, content | ✔ | ✔ | — |
| Orders, customers, shipping methods | ✔ | — | ✔ |
| Reports, staff, audit log | ✔ | — | — |

The API enforces the same rules; the UI only hides what the role can't use.

## 7. Testing

- **API:** JUnit 5 + AssertJ unit tests for pricing and tiers, coupon rules, the state machine, OTP, mobile normalisation and order numbers. Spring Boot integration tests run against PostgreSQL in Testcontainers and cover:
  - checkout, including concurrent purchases of the last unit;
  - the callback success, failure and replay paths;
  - the reconciliation job;
  - reservation expiry;
  - role checks for every admin endpoint group.

  Zarinpal and Kavenegar are replaced with WireMock in tests.
- **Front ends:** Vitest + React Testing Library for components and the formatting and i18n helpers.
- **End-to-end:** Playwright runs against the dev Compose stack with the Zarinpal sandbox. It covers sign-in → browse → add a tiered quantity to the cart → coupon → checkout → pay → the order appears in the admin panel → mark it shipped.
- Logic-heavy units are written test-first.

## 8. Deployment

- `deploy/docker-compose.yml` (production) and `deploy/docker-compose.dev.yml` (dev: PostgreSQL, logging fake SMS sender, seed data, Zarinpal sandbox).
- Images are built in CI or on a build machine with internet access and delivered to the VPS through a reachable registry or `docker save`/`docker load`, so the server never needs npm, Maven or Docker Hub. Dockerfiles are multi-stage and dependencies are pinned.
- Production settings come from `.env`, with `.env.example` committed:
  - `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX`, `PUBLIC_BASE_URL_SHOP`, `PUBLIC_BASE_URL_ADMIN`
  - `KAVENEGAR_API_KEY`, `KAVENEGAR_TEMPLATE_OTP`, `KAVENEGAR_TEMPLATE_PAID`, `KAVENEGAR_TEMPLATE_SHIPPED`
  - `JWT_CUSTOMER_SECRET`, `JWT_STAFF_SECRET`, `DB_PASSWORD`
  - `BOOTSTRAP_OWNER_USERNAME`, `BOOTSTRAP_OWNER_PASSWORD`, `BOOTSTRAP_OWNER_MOBILE`
- TLS uses Let's Encrypt via certbot in the nginx setup, or ArvanCloud certificates when ArvanCloud's CDN is in front.
- `deploy/backup.sh` runs a nightly `pg_dump` and a tar of the uploads volume, keeps 14 days, and has a documented restore procedure.
- Flyway runs migrations on API startup.

## 9. Delivery phases

Each phase gets its own implementation plan and ends with working, tested software.

1. **Foundation and catalog:**
   - repository scaffold and dev Compose stack;
   - API skeleton (errors, security, staff sign-in, audit);
   - catalog module and admin CRUD for categories, brands, products, images, variants, tiers and inventory;
   - admin app shell with RTL/i18n and role-aware navigation.
2. **Storefront and checkout:**
   - Next.js storefront (home, listing, search, product page, i18n, SEO);
   - customer SMS sign-in, addresses, cart, shipping methods;
   - checkout with reservations, the Zarinpal adapter, callback, expiry and reconciliation jobs;
   - payment result pages.
3. **Operations:**
   - admin order management and state machine, customers, SMS outbox and order SMS messages;
   - customer account order history;
   - production Compose, nginx, TLS, backups.
4. **Growth features:**
   - coupons;
   - reviews and moderation;
   - dashboard, reports and CSV export;
   - content pages;
   - end-to-end test suite.

## 10. Inputs needed from the owner before launch

These are not needed to build; development uses sandbox and fake values.

- Zarinpal merchant ID (and a confirmed callback domain).
- Kavenegar account, API key and three approved templates: sign-in code, order paid, order shipped.
- Shop and admin domain names and DNS access.
- Brand assets: logo and colours.
- Initial category and brand list.
