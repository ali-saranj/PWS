# Deli & Grocery Store (پروتئینی و مواد غذایی) — Design Spec

- **Date:** 2026-10-26
- **Status:** Complete specification ready for owner approval (updated from sports protein to deli & grocery store)
- **Stack:** Spring Boot 3 (Java 17) API · Next.js storefront · Vite + React admin · PostgreSQL 16 · Docker Compose

---

## 1. Purpose and scope

A production online store for a real Iranian business selling deli meats, cold cuts, and sandwich grocery essentials (فروشگاه پروتئینی و سوپرمارکتی مواد غذایی ساندویچی): sausages, cold cuts, processed meats, pickles, sauces, sandwich breads, chips, and canned goods.

The store takes real orders and payments via Zarinpal. It caters to retail customers ordering home sandwich supplies as well as bulk buyers (small sandwich shops, party hosts, caterers) via per-variant volume tier pricing. It provides staff with a complete administrative back-office to manage catalog, inventory, orders, customer accounts, and sales analytics.

### 1.1 Decisions made with the owner

| Topic | Decision |
|---|---|
| Business domain | Iranian deli & grocery store (*پروتئینی*): sausages, cold cuts, pickles, sauces, sandwich bread, chips, canned goods |
| Market & Reach | Iran, serving the entire country (nationwide shipping) |
| Payments | Zarinpal (redirect, callback, server-side verify) |
| Languages | Persian (RTL, default) and English, with language switchers on both storefront and admin |
| Wholesale / Bulk | Volume discounts only: per-variant quantity tiers that apply to everyone. No business credit accounts |
| Shipping | Admin-defined methods: Nationwide postal shipping (پست پیشتاز / تیپاکس) with insulated thermal packaging for perishables, and local fast courier (پیک موتوری) in operating metro centers. Fixed fee and optional free-over threshold; tracking code recorded manually |
| Customer sign-in | Mobile number + SMS one-time code (OTP) |
| Admin scope (v1) | Products, inventory, orders & shipping, customers, staff roles, dashboard & reports |
| Storefront extras (v1) | Discount codes, verified customer reviews & ratings, SMS order status updates |
| Hosting | VPS inside Iran running Docker Compose |
| Architecture | Approach C: Next.js storefront (SSR for SEO), separate Vite admin SPA, Spring Boot API |

### 1.2 Working assumptions

- **Money:** Stored as whole Rials (`BIGINT`) and formatted/displayed as Toman in the UI.
- **Portions & Weights:** Fresh cold cuts, sausages, and processed meats are offered in pre-set portion/cut variants (e.g. 250g sliced, 500g sliced, 1kg roll) rather than continuous scale weighing, ensuring transparent pricing and exact stock tracking online.
- **Localization:** Persian UI uses Persian digits and Shamsi/Jalali dates; English UI uses Western digits and Gregorian dates.
- **Multilingual texts:** Product, category, brand, and shipping method texts are stored in both Persian and English (English falls back to Persian when blank).
- **Security & Tokens:** Staff sign in with username + password + SMS OTP. Customer tokens cannot access `/api/admin/**`. HttpOnly, Secure, SameSite=Lax cookies for authentication.
- **Cart & Reservations:** Stock is reserved for 15 minutes while the customer completes payment.
- **Refunds:** Recorded by staff on the order and settled out-of-band via bank transfer or payment gateway console.

### 1.3 Out of scope for v1

Open-ended continuous scale weighing at checkout, multi-warehouse routing, cold-chain temperature telemetry, native mobile apps, loyalty points.

---

## 2. System layout

### 2.1 Containers

| Container | Responsibility |
|---|---|
| `nginx` | TLS termination. Routes `shop.<domain>` → `storefront`, `admin.<domain>` → `admin` static files, `/api/**` on both hosts → `api`. Serves `/media/**` from the uploads volume. |
| `storefront` | Next.js (App Router, TypeScript), server-rendered. Locale-prefixed routes `/fa/...` and `/en/...`; `/` redirects to `/fa`. |
| `admin` | Vite + React + TypeScript SPA built to static files, MUI component library with RTL support. |
| `api` | Spring Boot 3, Java 17. The only component that talks to the database, Zarinpal, and the SMS provider. |
| `postgres` | PostgreSQL 16; schema managed by Flyway. |

Volumes: `pgdata`, `uploads` (product images, shared read-only with nginx), `backups`.

### 2.2 Repository layout

```
PWS/
  api/          Spring Boot (Maven wrapper)
  storefront/   Next.js (App Router, TypeScript)
  admin/        Vite + React + TypeScript + MUI
  deploy/       docker-compose.yml, docker-compose.dev.yml, nginx/, backup scripts, .env.example
  docs/         specs and plans
```

### 2.3 API modules

Organised under `ir.pws.store`:

| Module | Owns |
|---|---|
| `catalog` | categories, brands, products, images, variants (cuts/weights/styles), volume tiers, stock ledger and reservations |
| `customer` | customers, addresses, OTP sign-in |
| `cart` | server-side carts |
| `order` | checkout, orders, status state machine, shipping methods |
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
- Customer and staff tokens use different signing keys and audiences; cookies are scoped to their own host.
- Refresh tokens are stored hashed in the database and rotated on each use; signing out or blocking an account revokes them.
- Unsafe HTTP methods are protected against CSRF with the double-submit cookie pattern.

---

## 3. Data model

All tables have `id BIGSERIAL`, `created_at` and `updated_at`. Tables that admins edit concurrently (`product`, `variant`, `orders`, `coupon`, `shipping_method`, `staff_user`) carry `version` for optimistic locking. Money columns are `BIGINT` Rials.

### 3.1 Catalog

- **category**: `name_fa`, `name_en`, `slug` (unique), `parent_id` (nullable, self-reference), `sort_order`, `active`.
  - Categories: سوسیس و هات‌داگ (Sausages), کالباس و ژامبون (Cold Cuts & Deli Meats), خیارشور و ترشیجات (Pickles & Condiments), سس و چاشنی (Sauces & Condiments), نان ساندویچی (Sandwich Breads), چیپس و تنقلات (Chips & Snacks), کنسروجات (Canned Goods).
- **brand**: `name_fa`, `name_en`, `slug` (unique), `logo_path`, `active`.
  - Leading brands: آندره, سولیکو/کاله, ۲۰۲, میکائیلیان, مهرام, دلپذیر, چاکلز, etc.
- **product**: `brand_id`, `category_id`, `slug` (unique), `name_fa`, `name_en`, `description_fa`, `description_en` (sanitised rich text), `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`), `featured`, `seo_title_fa/en`, `seo_description_fa/en`, `rating_avg`, `rating_count`.
- **product_image**: `product_id`, `path`, `sort_order`, `alt_fa`, `alt_en`. Uploads accept JPEG, PNG or WebP up to 5 MB. Server re-encodes to WebP at 1600 px and 400 px.
- **variant**: `product_id`, `sku` (unique), `flavour_fa`, `flavour_en` (deli style/recipe/cut, e.g. "دودی", "پنیری", "سیردار", "تند", "ساده"), `size_label` (e.g. "۲۵۰ گرم اسلایس", "۵۰۰ گرم", "۱ کیلوگرم"), `weight_grams`, `base_price`, `compare_at_price` (nullable), `stock_on_hand`, `low_stock_threshold`, `active`, `sort_order`.
- **volume_tier**: `variant_id`, `min_qty` (≥ 2, unique per variant), `unit_price` (lower than `base_price` and lower than preceding tiers).
- **stock_reservation**: `variant_id`, `order_id`, `qty`, `expires_at`, `status` (`ACTIVE`, `CONSUMED`, `RELEASED`).
- **stock_movement**: `variant_id`, `delta`, `reason` (`ORDER_PAID`, `ORDER_CANCELLED`, `MANUAL_ADJUSTMENT`, `INITIAL`), `ref_id`, `staff_user_id` (nullable), `note`.

**Pricing rule:** the unit price for quantity `q` is the `unit_price` of the tier with the largest `min_qty ≤ q`, or `base_price` if no tier qualifies.

**Available stock:** `stock_on_hand − SUM(qty of ACTIVE, unexpired reservations)`.

### 3.2 Customers

- **customer**: `mobile` (unique, normalised `09xxxxxxxxx`), `first_name`, `last_name`, `blocked`, `last_login_at`.
- **address**: `customer_id`, `province`, `city`, `line`, `postal_code` (10 digits), `recipient_name`, `recipient_mobile`, `is_default`.
- **otp_code**: `mobile`, `purpose` (`CUSTOMER_LOGIN`, `STAFF_LOGIN`), `code_hash`, `expires_at` (2 minutes), `attempts` (max 5), `consumed_at`.
- **refresh_token**: `subject_type` (`CUSTOMER`, `STAFF`), `subject_id`, `token_hash`, `expires_at`, `revoked_at`.

### 3.3 Cart and orders

- **cart**: `customer_id` (unique). **cart_item**: `cart_id`, `variant_id`, `qty`, unique on (`cart_id`, `variant_id`).
- **shipping_method**: `name_fa`, `name_en`, `description_fa/en`, `cost`, `free_over` (nullable), `active`, `sort_order`.
  - Default methods: "پست پیشتاز / تیپاکس سراسری (بسته‌بندی عایق برای اقلام پروتئینی)" and "پیک اکسپرس درون‌شهری (تحویل فوری)".
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

---

## 4. Flows

### 4.1 Customer sign-in

1. `POST /api/store/auth/otp {mobile}`. Server normalises number and rate-limits (1 per 2 min, 5 per hour per mobile, 20 per IP per hour). Generates 5-digit code via `SecureRandom`, stores hash and sends SMS synchronously.
2. `POST /api/store/auth/verify {mobile, code}` checks expiry, attempts, and hash, marks code consumed, creates customer record on first sign-in, and sets access and refresh cookies.
3. `POST /api/store/auth/refresh` and `POST /api/store/auth/logout`.

### 4.2 Staff sign-in

`POST /api/admin/auth/login {username, password}` checks password, sends SMS OTP challenge to staff member's mobile. `POST /api/admin/auth/verify {challenge, code}` sets admin cookies. 5 failed passwords in 15 minutes locks account for 15 minutes. Bootstrap OWNER created on startup if no staff user exists.

### 4.3 Checkout and payment

1. `POST /api/store/checkout {addressId, shippingMethodId, couponCode?}` in a single transaction:
   - loads cart;
   - locks variant rows (`SELECT ... FOR UPDATE`);
   - re-prices cart from current prices and tiers;
   - checks variant activity and available stock;
   - validates coupon;
   - calculates shipping;
   - creates order (`PENDING_PAYMENT`), line items, and 15-minute reservations.
2. API calls Zarinpal `payment/request.json`. On success, saves payment row (`INITIATED`, `authority`) and redirects customer to `StartPay/{authority}`.
3. Callback `GET /api/store/payments/zarinpal/callback?Authority=&Status=`:
   - If `Status=OK`: calls Zarinpal `verify.json`. On code 100/101, sets payment to `PAID`, order to `PAID`, converts reservations to `CONSUMED`, decrements `stock_on_hand`, clears cart, queues order paid SMS.
   - If `Status=NOK`: payment marked `FAILED`, order stays `PENDING_PAYMENT` until reservations expire, customer redirected to retry page.
4. **Reservation expiry job (every minute):** releases expired `ACTIVE` reservations. A `PENDING_PAYMENT` order without active reservations becomes `CANCELLED` (SYSTEM) after 30 minutes.
5. **Reconciliation job (every 10 minutes):** queries Zarinpal `unVerified.json` to verify orphaned payments and prevent unrecorded transactions.

### 4.4 Order state machine

```
PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED
PENDING_PAYMENT → CANCELLED   (customer cancels, or expiry job)
PAID | PROCESSING → CANCELLED (staff; restocks; refund_amount and refund_note required)
```
- `→ SHIPPED` requires tracking code / courier info and triggers customer SMS notification.

---

## 5. Front ends

### 5.1 Storefront (Next.js)

- **Routes:** `/[locale]` (home), `/[locale]/c/[slug]` (category), `/[locale]/search`, `/[locale]/p/[slug]` (product), `/[locale]/cart`, `/[locale]/checkout`, `/[locale]/payment/result`, `/[locale]/login`, `/[locale]/account/{orders,addresses,profile}`, `/[locale]/pages/[slug]`.
- **Catalog display:** Categories for deli meats, sausages, pickles, sauces, sandwich breads, snacks, and canned items. Product variant selector handles cut/recipe (دودی، تند، ساده) and weight package (۲۵۰ گرم، ۵۰۰ گرم، ۱ کیلوگرم).
- **SEO & i18n:** Server-rendered with metadata, Persian RTL by default with Vazirmatn font, English LTR with Inter font, Toman formatting with Persian digits, Jalali dates.

### 5.2 Admin (Vite + React + MUI)

- Products & inventory with batch stock adjustments.
- Categories tree and brands management.
- Orders list with status transition actions and tracking code entry.
- Customer management, shipping methods, discount coupons, review moderation, reports, and staff audit log.
- RBAC enforcement across OWNER, PRODUCT_MANAGER, and ORDER_OPERATOR roles.

---

## 6. Dev seed catalog alignment

To reflect the grocery & deli domain in development:
- Replace initial bodybuilding supplement seed with authentic deli items (e.g., ژامبون بوقلمون ۹۰٪ آندره, سوسیس فرانکفورتر ۲۰۲, خیارشور ویژه یک‌و‌یک, سس هزارجزیره دلپذیر, نان باگت فرانسوی).
- Keep exact schema tables and constraints intact so the existing Spring Boot Phase 1 foundation runs cleanly.

---

## 7. Testing & Quality Assurance

- **API Unit & Integration Tests:** JUnit 5, AssertJ, MockMvc, and Zonky embedded PostgreSQL covering pricing, tier calculation, OTP normalisation, coupon logic, stock movements, and concurrency.
- **Admin Tests:** Vitest, React Testing Library, and TypeScript compiler checks.
