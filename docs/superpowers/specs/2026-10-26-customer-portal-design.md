# Customer Account & Order History Portal Design

**Date:** 2026-10-26  
**Status:** Approved Specification  
**Target:** Storefront (`shop/`) & Backend API (`api/`)

---

## 1. Intent and Why

Customers who purchase groceries and deli products currently lack an account hub after completing their checkout. If they navigate away from the payment callback page or close their browser, they have no way to view past receipts, check live status tracking codes, or manage saved delivery addresses without re-entering checkout.

Furthermore, grocery and deli shopping is highly habitual: customers frequently repurchase favorite staples (e.g. 500g sliced turkey ham, special pickles, sandwich bread). Providing a centralized Customer Portal with an inline order breakdown and a 1-click **"سفارش مجدد" (Re-order)** button dramatically reduces re-order friction and drives customer retention.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Order History:** Authenticated customers can view all their past and active completed orders (`status != 'PENDING_PAYMENT'`) sorted by creation date descending.
- **Inline Order Details:** Each order card expands to display full breakdown: items with portion/weight descriptions (e.g. ۲۵۰ گرم اسلایس), quantities, unit prices, delivery address, shipping fee, and permanent tracking code (`TRK-...`).
- **1-Click Re-Order:** A dedicated backend endpoint validates current variant availability and live pricing, adding all currently in-stock items back into the customer's cart with informative toast feedback if any items are discontinued or out-of-stock.
- **Address Book Management:** Dedicated tab allowing customers to view saved addresses, create a new address, edit address details, delete obsolete addresses, and toggle their default delivery location (with auto-promotion of default if the default address is deleted).
- **Personal Details:** Allow customers to update their first name, last name, and optional email, with verified mobile number displayed as the read-only identity anchor.
- **Seamless Navigation:** Header profile icon navigates directly to `/profile` when authenticated (or triggers the quick OTP modal if unauthenticated). `/auth` cleanly redirects to `/profile`.

### Non-Goals
- **Public/Anonymous Order History:** Unauthenticated users cannot view order lists without SMS OTP login (single order tracking via `TRK-...` remains public at `/track/[trackingCode]`).
- **Displaying Abandoned Checkout Attempts:** Unpaid `PENDING_PAYMENT` orders that were abandoned at the payment gateway are filtered out from the customer history.
- **Order Cancellation by Customer:** Once placed and paid, order cancellations require customer support intervention (or admin approval state machine).
- **Static Store Pages:** Policy and informational pages (`/faq`, `/terms`, etc.) are explicitly deferred to a separate workstream.

### Anti-Goals
- **No Page-Splitting / Fragmented Navigation:** Avoid scattering profile settings across separate, disjointed URL pages (like `/profile/orders`, `/profile/addresses`, `/profile/edit`) that force full page reloads. Everything is accessible in a unified, tabbed responsive hub.
- **No Discarding Cart Items on Re-Order:** Re-ordering past items appends or updates quantities in the existing cart rather than wiping unrelated items the customer might already have gathered.

---

## 3. Constraints

- **Monetary Units:** Whole Rials in backend DB and API payloads; formatted in Toman (`rials / 10`) with Persian-Indic digits in the UI.
- **Authentication:** Customer JWT cookies `pws_shop_at` (15 min) and `pws_shop_rt` (30 days), `HttpOnly`, `SameSite=Lax`. Protected endpoints return 401 when cookies are absent or expired.
- **Address Schema:** Retains exact DB columns: `province`, `city`, `line`, `postal_code` (10 digits), `recipient_name`, `recipient_mobile`, `is_default`.
- **Design System:** Emerald green palette (`#10B981` / `#059669`), crimson badges (`#EF4444`), warm neutral backgrounds (`#F8FAFC`), Vazirmatn Persian typography, RTL default.
- **Order Tracking Code Format:** Unique alphanumeric `TRK-XXXXXXXX`.
- **Order Number Format:** `PWS-YYMMDD-XXXX` (Jalali sequence).

---

## 4. Architecture & Technical Design

### A. Backend API (`api/`)

#### 1. Database Migration: `V10__customer_email.sql`
- Add nullable `email VARCHAR(255)` column to `customer` table.

#### 2. Customer Order History Endpoint
- **Route:** `GET /api/shop/customer/orders`
- **Security:** Requires valid customer cookie authentication (`CustomerPrincipal`).
- **Handler:** `ShopCustomerOrderController.java` (delegating to `ShopCustomerOrderService`).
- **Filter:** Orders matching `customer_id` where `status != 'PENDING_PAYMENT'`, ordered by `created_at DESC`.
- **Response Payload:** `List<CustomerOrderSummaryDto>`
  ```json
  [
    {
      "id": 12,
      "orderNumber": "PWS-050805-0001",
      "trackingCode": "TRK-8K2N9F1X",
      "status": "DISPATCHED",
      "statusLabelFa": "ارسال با پیک",
      "totalAmountRials": 7200000,
      "totalAmountToman": 720000,
      "shippingFeeRials": 500000,
      "shippingFeeToman": 50000,
      "deliveryAddress": "تهران، خیابان شریعتی، کوچه بهار، پلاک ۴",
      "recipientName": "علی رضایی",
      "recipientMobile": "09121234567",
      "courierNotes": "تحویل به لابی برج",
      "createdAt": "2026-10-26T14:30:00Z",
      "createdAtJalali": "۱۴۰۵/۰۸/۰۴ - ۱۴:۳۰",
      "items": [
        {
          "variantId": 101,
          "productId": 5,
          "productTitle": "ژامبون بوقلمون ۹۰٪ آندره",
          "portionLabel": "۲۵۰ گرم اسلایس",
          "sku": "AND-TURK-250G",
          "quantity": 2,
          "unitPriceRials": 1850000,
          "unitPriceToman": 185000,
          "totalPriceToman": 370000,
          "imageUrl": "/images/products/placeholder-meat.svg"
        }
      ]
    }
  ]
  ```

#### 3. Re-Order Validation Endpoint
- **Route:** `POST /api/shop/customer/orders/{id}/reorder`
- **Security:** Requires customer authentication and verifies order ownership.
- **Service Logic:**
  - Iterates order line items.
  - Queries current active variant status, current live pricing (in case of price updates), and available stock from `stock_on_hand`.
  - Returns `ReorderResultDto`:
    - `addedItems`: List of validated cart items (with current `productId`, `variantId`, current `priceToman`, `maxStock`, and requested `quantity`).
    - `unavailableItems`: List of product titles that could not be added due to being discontinued or out-of-stock.

#### 4. Customer Profile Update Endpoint
- **Route:** `PUT /api/shop/customer/profile`
- **Security:** Requires customer authentication.
- **Request Body:**
  ```json
  {
    "firstName": "علی",
    "lastName": "محمدی",
    "email": "ali@example.com"
  }
  ```
- **Handler:** `ShopAuthController.java`.
- **Response:** Updated `CustomerDto`.

#### 5. Full Address Management Endpoints
- In `ShopCustomerAddressController.java`:
  - `GET /api/shop/customer/addresses`: Lists all addresses for the logged-in customer.
  - `POST /api/shop/customer/addresses`: Adds address (if first address, automatically sets `is_default = true`).
  - `PUT /api/shop/customer/addresses/{id}`: Updates existing address.
  - `DELETE /api/shop/customer/addresses/{id}`: Deletes address. If deleting the default address and other addresses exist, auto-promotes the most recent remaining address to `is_default = true`.
  - `PUT /api/shop/customer/addresses/{id}/default`: Explicitly sets the target address as default and unsets others.

---

### B. Storefront Frontend (`shop/`)

#### 1. Page Route: `/profile`
- Client-side Next.js page (`shop/src/app/profile/page.tsx`).
- Protected by `useAuthStore`: If unauthenticated, displays OTP Login modal with an intuitive prompt; once verified, displays the portal without page reload.
- Header User Icon links directly to `/profile`.
- `/auth/page.tsx` redirects automatically to `/profile`.

#### 2. Layout Structure (Tabbed Hub)
- **Top Summary Card:** User avatar, customer full name, verified mobile badge (`۰۹۱۲...`), total order count, and "خروج از حساب" (Logout) button.
- **Tab Bar (Desktop & Mobile):**
  - `سفارش‌های من` (با شمارنده تعداد سفارش)
  - `آدرس‌های تحویل` (با شمارنده تعداد آدرس‌ها)
  - `اطلاعات حساب کاربری`

#### 3. Tab 1: Orders (سفارش‌های من)
- **Order Card Accordion:**
  - Header: Order Number, Jalali Date, Status Pill, Total Price in Toman.
  - Expanded Details: Item list with thumbnails, weight portions, unit prices, delivery destination address, and courier tracking details.
  - Action 1: **"سفارش مجدد" (Re-order Button):** Calls `/api/shop/customer/orders/{id}/reorder`, populates valid items into `cartStore`, opens cart drawer, and shows toast:
    - If all items available: `"X قلم کالا به سبد خرید اضافه شد."`
    - If some items unavailable: `"X قلم کالا اضافه شد. اقلام ناموجود: Y"`
  - Action 2: **"رهگیری زنده" (Live Tracker Button):** Opens `/track/[trackingCode]`.
- **Empty State:** Illustrated card with message "هنوز سفارشی ثبت نکرده‌اید" and button "مشاهده محصولات و شروع خرید" navigating to `/products`.

#### 4. Tab 2: Addresses (آدرس‌های تحویل)
- Grid of saved addresses:
  - Recipient name, mobile, full street address, 10-digit postal code.
  - "پیش‌فرض" badge on active default address.
  - Actions: "ویرایش", "حذف", "انتخاب به عنوان پیش‌فرض".
- "افزودن آدرس جدید" button:
  - Opens clean modal with fields: استان و شهر (پیش‌فرض تهران), نشانی پستی دقیق (`line`), کد پستی ۱۰ رقمی, نام و نام خانوادگی تحویل‌گیرنده, شماره موبایل.

#### 5. Tab 3: Personal Details (اطلاعات حساب کاربری)
- Form fields:
  - شماره موبایل (غیرقابل تغییر با نشان تأیید سبز).
  - نام و نام خانوادگی.
  - ایمیل (اختیاری).
- "ذخیره تغییرات" button with optimistic UI and toast feedback.

---

## 5. Verification & Testing

1. **Backend Integration Tests:**
   - `CustomerOrderIntegrationTest`:
     - Customer logs in via OTP, places order via checkout, calls `GET /api/shop/customer/orders`.
     - Verifies order presence with line items, portions, and Jalali dates.
     - Verifies `PENDING_PAYMENT` orders are excluded.
     - Verifies unauthenticated calls return 401.
     - Verifies customer A cannot see customer B's orders.
     - Calls `POST /api/shop/customer/orders/{id}/reorder` and verifies returned items and stock validation.
   - `CustomerProfileIntegrationTest`:
     - Updates customer name and email, verifies persistence in database.
   - `CustomerAddressManagementIntegrationTest`:
     - Tests full CRUD (`GET`, `POST`, `PUT`, `DELETE`, `PUT /default`).
     - Verifies default address promotion when default address is deleted.
2. **Storefront Component & Page Tests:**
   - `ProfilePage.test.tsx`:
     - Renders unauthenticated state with login prompt.
     - Renders order list with status badge and expand/collapse accordion.
     - Clicking "سفارش مجدد" triggers reorder API and populates cart store items.
     - Renders address cards with default toggle, add address modal, edit address modal, and delete confirmation.
     - Renders personal info form and submits profile update.
