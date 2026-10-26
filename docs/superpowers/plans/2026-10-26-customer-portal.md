# Customer Account & Order History Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Provide an Iranian deli customer portal at `/profile` with authenticated order history, expandable order breakdown, 1-click re-order with live stock validation, self-service address book management, and profile info editing.

**Architecture:** 
- **Backend (`api/`):** Flyway migration adds optional `email` to `customer`. Exposes `GET /api/shop/customer/orders` (filtering out `PENDING_PAYMENT`) and `POST /api/shop/customer/orders/{id}/reorder` (validating live prices and stock). Extends `ShopCustomerAddressController` with `PUT`, `DELETE` (with default auto-promotion), and `PUT /default`. Adds `PUT /api/shop/customer/profile`.
- **Storefront (`shop/`):** Client-side `/profile` tabbed hub (Orders, Addresses, Profile Info) matching "سبد سبز" emerald green design identity and Persian RTL typography. Header user icon and `/auth` redirect to `/profile`.

**Tech Stack:** Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA, Flyway, PostgreSQL, Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest / React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-26-customer-portal-design.md`

## Global Constraints

- Monetary units: DB and API in whole **Rials** (`long`/`BIGINT`); all UIs display and accept **Toman** (`rials = toman × 10`) with Persian numerals.
- Customer cookies: `pws_shop_at` (15 min) and `pws_shop_rt` (30 days), `HttpOnly`, `SameSite=Lax`. Protected endpoints return 401 when cookies are absent or expired.
- Address schema: Retains existing columns (`province`, `city`, `line`, `postal_code` [10 digits], `recipient_name`, `recipient_mobile`, `is_default`).
- Order tracking code format: `TRK-<8-alphanumeric>` (e.g. `TRK-8K2N9F1X`).
- Order number format: `PWS-<Jalali YYMMDD>-<4-digit sequence>`.
- Order filtering: `GET /api/shop/customer/orders` only returns completed orders (`status != 'PENDING_PAYMENT'`).
- Testing: All backend tests pass with `./mvnw -q test`, shop tests with `npm test`.

## Review Focus

1. **Order data isolation:** Customer A must never be able to view or re-order Customer B's orders (404/403 returned).
2. **Re-order price & stock changes:** When re-ordering an old order where an item's price changed or became out-of-stock, current live prices are used and out-of-stock items are omitted with clear user notification.
3. **Default address auto-promotion:** Deleting a customer's default address when other addresses exist must automatically promote the most recently created remaining address to default.
4. **Unauthenticated redirect & state preservation:** Visiting `/profile` while logged out prompts the OTP login modal; verifying OTP immediately renders the customer portal without losing tab context.
5. **Jalali timestamp accuracy:** Order dates render in authentic Persian Jalali format (e.g. `۴ آبان ۱۴۰۵`).

---

## File Structure

```
api/
  src/main/resources/db/migration/
    V10__customer_email.sql
  src/main/java/ir/pws/store/customer/
    Customer.java (add email field)
    dto/UpdateCustomerProfileRequest.java
    dto/CustomerProfileDto.java
    dto/CustomerAddressDto.java
    ShopAuthController.java (add PUT /profile)
    ShopCustomerAddressController.java (add PUT, DELETE, PUT /default)
    CustomerAddressService.java (add update, delete, setDefault)
  src/main/java/ir/pws/store/order/
    ShopCustomerOrderController.java
    ShopCustomerOrderService.java
    dto/CustomerOrderSummaryDto.java
    dto/CustomerOrderItemDto.java
    dto/ReorderResultDto.java
  src/test/java/ir/pws/store/customer/
    CustomerProfileIntegrationTest.java
    CustomerAddressManagementIntegrationTest.java
  src/test/java/ir/pws/store/order/
    CustomerOrderHistoryIntegrationTest.java

shop/
  src/app/
    profile/page.tsx
    profile/ProfilePage.test.tsx
  src/components/profile/
    OrdersTab.tsx
    OrdersTab.test.tsx
    AddressBookTab.tsx
    AddressBookTab.test.tsx
    PersonalInfoTab.tsx
    PersonalInfoTab.test.tsx
  src/components/Header.tsx (update user button href)
  src/app/auth/page.tsx (update redirect)
```

---

### Task 1: Customer Email Migration & Profile Update API

**Files:**
- Create: `api/src/main/resources/db/migration/V10__customer_email.sql`
- Modify: `api/src/main/java/ir/pws/store/customer/Customer.java`
- Create: `api/src/main/java/ir/pws/store/customer/dto/UpdateCustomerProfileRequest.java`
- Modify: `api/src/main/java/ir/pws/store/customer/ShopAuthController.java`
- Modify: `api/src/main/java/ir/pws/store/customer/CustomerAuthService.java`
- Test: `api/src/test/java/ir/pws/store/customer/CustomerProfileIntegrationTest.java`

**Interfaces:**
- Produces: `PUT /api/shop/customer/profile` consuming `{ "firstName": string, "lastName": string, "email": string }` returning updated `CustomerDto`.

- [x] **Step 1: Write failing test in `CustomerProfileIntegrationTest.java`**

```java
@Test
void updateProfile_authenticated_updatesNameAndEmail() throws Exception {
    Customer customer = customerRepository.save(Customer.builder().mobile("09121113355").build());
    String token = jwtService.generateCustomerAccessToken(customer.getId(), customer.getMobile());

    mockMvc.perform(put("/api/shop/customer/profile")
            .cookie(new Cookie("pws_shop_at", token))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"firstName\":\"علی\",\"lastName\":\"محمدی\",\"email\":\"ali@example.com\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.firstName").value("علی"))
        .andExpect(jsonPath("$.lastName").value("محمدی"))
        .andExpect(jsonPath("$.email").value("ali@example.com"));
}
```

- [x] **Step 2: Run test to verify failure**
  - Run: `cd api && ./mvnw test -Dtest=CustomerProfileIntegrationTest`
  - Expected: FAIL (404 endpoint not found).

- [x] **Step 3: Implement Flyway migration, Entity update, and Controller**
  - Create `V10__customer_email.sql`: `ALTER TABLE customer ADD COLUMN email VARCHAR(255);`.
  - Add `private String email;` to `Customer.java`.
  - Add `updateProfile(Long customerId, UpdateCustomerProfileRequest req)` in `CustomerAuthService.java`.
  - Expose `PUT /api/shop/customer/profile` in `ShopAuthController.java`.

- [x] **Step 4: Run test to verify pass**
  - Run: `cd api && ./mvnw test -Dtest=CustomerProfileIntegrationTest`
  - Expected: PASS.

- [x] **Step 5: Commit**
  - `git commit -m "feat(api): customer email migration and profile update endpoint"`

---

### Task 2: Customer Address Management API (`PUT`, `DELETE`, `PUT /default`)

**Files:**
- Modify: `api/src/main/java/ir/pws/store/customer/CustomerAddressService.java`
- Modify: `api/src/main/java/ir/pws/store/customer/ShopCustomerAddressController.java`
- Test: `api/src/test/java/ir/pws/store/customer/CustomerAddressManagementIntegrationTest.java`

**Interfaces:**
- Produces:
  - `PUT /api/shop/customer/addresses/{id}` (updates province, city, line, postalCode, recipientName, recipientMobile)
  - `DELETE /api/shop/customer/addresses/{id}` (deletes address; auto-promotes latest remaining address to default if target was default)
  - `PUT /api/shop/customer/addresses/{id}/default` (marks target address as default and unsets previous default)

- [x] **Step 1: Write failing tests in `CustomerAddressManagementIntegrationTest.java`**
  - Test update address.
  - Test delete non-default address.
  - Test delete default address with auto-promotion of next remaining address.
  - Test set default address.
  - Test address isolation (cannot edit/delete address belonging to another customer).

- [x] **Step 2: Run test to verify failure**
  - Run: `cd api && ./mvnw test -Dtest=CustomerAddressManagementIntegrationTest`
  - Expected: FAIL (endpoints missing).

- [x] **Step 3: Implement service methods and controller endpoints**
  - In `CustomerAddressService.java`:
    - `updateAddress(Long customerId, Long addressId, AddressRequest req)`
    - `deleteAddress(Long customerId, Long addressId)`
    - `setDefaultAddress(Long customerId, Long addressId)`
  - In `ShopCustomerAddressController.java`: map `PUT /{id}`, `DELETE /{id}`, `PUT /{id}/default`.

- [x] **Step 4: Run test to verify pass**
  - Run: `cd api && ./mvnw test -Dtest=CustomerAddressManagementIntegrationTest`
  - Expected: PASS.

- [x] **Step 5: Commit**
  - `git commit -m "feat(api): address update, deletion with default promotion, and set-default endpoints"`

---

### Task 3: Customer Order History & 1-Click Re-Order API

**Files:**
- Create: `api/src/main/java/ir/pws/store/order/dto/CustomerOrderSummaryDto.java`
- Create: `api/src/main/java/ir/pws/store/order/dto/CustomerOrderItemDto.java`
- Create: `api/src/main/java/ir/pws/store/order/dto/ReorderResultDto.java`
- Create: `api/src/main/java/ir/pws/store/order/ShopCustomerOrderService.java`
- Create: `api/src/main/java/ir/pws/store/order/ShopCustomerOrderController.java`
- Test: `api/src/test/java/ir/pws/store/order/CustomerOrderHistoryIntegrationTest.java`

**Interfaces:**
- Produces:
  - `GET /api/shop/customer/orders`: Returns list of orders where `customerId == principal.id` and `status != PENDING_PAYMENT`, ordered by `createdAt DESC`.
  - `POST /api/shop/customer/orders/{id}/reorder`: Inspects order line items against current catalog variants and `stock_on_hand`; returns available items with live pricing and unavailable item names.

- [x] **Step 1: Write failing tests in `CustomerOrderHistoryIntegrationTest.java`**
  - Test customer sees their placed orders with line items, portion sizes, prices in Toman, and Jalali dates.
  - Test `PENDING_PAYMENT` orders are excluded.
  - Test order isolation (Customer A cannot see Customer B's orders).
  - Test re-order endpoint returns current prices and marks out-of-stock items as unavailable.

- [x] **Step 2: Run test to verify failure**
  - Run: `cd api && ./mvnw test -Dtest=CustomerOrderHistoryIntegrationTest`
  - Expected: FAIL.

- [x] **Step 3: Implement `ShopCustomerOrderService` and `ShopCustomerOrderController`**
  - Query orders by `customerId` and `status != OrderStatus.PENDING_PAYMENT`.
  - Map to `CustomerOrderSummaryDto` with Jalali date format (`persianDate(order.getCreatedAt())`).
  - Implement `reorder(Long customerId, Long orderId)` checking `variant.isActive()` and stock balance.

- [x] **Step 4: Run test to verify pass**
  - Run: `cd api && ./mvnw test -Dtest=CustomerOrderHistoryIntegrationTest`
  - Expected: PASS.

- [x] **Step 5: Commit**
  - `git commit -m "feat(api): customer order history and reorder validation endpoints"`

---

### Task 4: Storefront Address Book & Profile Info Tabs

**Files:**
- Create: `shop/src/components/profile/AddressBookTab.tsx`
- Create: `shop/src/components/profile/PersonalInfoTab.tsx`
- Test: `shop/src/components/profile/AddressBookTab.test.tsx`
- Test: `shop/src/components/profile/PersonalInfoTab.test.tsx`

**Interfaces:**
- Produces:
  - `<AddressBookTab />`: Renders address cards, default pill, modal for adding/editing addresses, delete confirmation, and default selection.
  - `<PersonalInfoTab />`: Form to update name and email, read-only verified mobile badge.

- [x] **Step 1: Write failing tests for `AddressBookTab` and `PersonalInfoTab`**
  - Verify address listing, default badge, add modal submission, delete click.
  - Verify personal info prefill, editing, and save submission.

- [x] **Step 2: Run test to verify failure**
  - Run: `cd shop && npm test src/components/profile`
  - Expected: FAIL.

- [x] **Step 3: Implement `AddressBookTab` and `PersonalInfoTab`**
  - Persian RTL layout, emerald primary theme, validation on 10-digit postal code.
  - Integration with `/api/shop/customer/addresses` and `/api/shop/customer/profile`.

- [x] **Step 4: Run test to verify pass**
  - Run: `cd shop && npm test src/components/profile`
  - Expected: PASS.

- [x] **Step 5: Commit**
  - `git commit -m "feat(shop): address book management and personal info tab components"`

---

### Task 5: Storefront Orders Tab with Expandable Accordion & 1-Click Re-Order

**Files:**
- Create: `shop/src/components/profile/OrdersTab.tsx`
- Test: `shop/src/components/profile/OrdersTab.test.tsx`

**Interfaces:**
- Produces:
  - `<OrdersTab />`: Renders list of orders with collapsible accordion.
  - Displays Jalali dates, order number, status pills (`در حال آماده‌سازی`, `ارسال شده`, etc.), total in Toman.
  - Expanded view shows line items (portion labels, prices, thumbnails), delivery address, and tracking link.
  - "سفارش مجدد" button calls `/api/shop/customer/orders/{id}/reorder`, loads returned items into `cartStore`, opens cart drawer, and shows toast.

- [x] **Step 1: Write failing test in `OrdersTab.test.tsx`**
  - Test renders empty state when orders list is empty.
  - Test renders order cards with collapsed header.
  - Test click expands line items.
  - Test click "سفارش مجدد" calls reorder endpoint and adds items to cart store.

- [x] **Step 2: Run test to verify failure**
  - Run: `cd shop && npm test src/components/profile/OrdersTab.test.tsx`
  - Expected: FAIL.

- [x] **Step 3: Implement `OrdersTab.tsx`**
  - Accordion animation, status badge colors, Toman formatting, 1-click reorder integration.

- [x] **Step 4: Run test to verify pass**
  - Run: `cd shop && npm test src/components/profile/OrdersTab.test.tsx`
  - Expected: PASS.

- [x] **Step 5: Commit**
  - `git commit -m "feat(shop): customer order history tab with accordion and reorder action"`

---

### Task 6: Unified `/profile` Hub & Header / Auth Routing

**Files:**
- Create: `shop/src/app/profile/page.tsx`
- Modify: `shop/src/components/Header.tsx` (change user profile button link to `/profile`)
- Modify: `shop/src/app/auth/page.tsx` (redirect authenticated and guest users to `/profile`)
- Test: `shop/src/app/profile/ProfilePage.test.tsx`

**Interfaces:**
- Produces:
  - `/profile` route with top customer summary card and 3 tabs (`سفارش‌های من`, `آدرس‌های تحویل`, `اطلاعات حساب`).
  - Auth protection: if unauthenticated, shows login prompt and launches `QuickAuthModal`.
  - Header profile button links to `/profile`.

- [x] **Step 1: Write failing test in `ProfilePage.test.tsx`**
  - Unauthenticated user sees login prompt.
  - Authenticated user sees summary card and can switch between the 3 tabs.
  - Logout clears session.

- [x] **Step 2: Run test to verify failure**
  - Run: `cd shop && npm test src/app/profile/ProfilePage.test.tsx`
  - Expected: FAIL.

- [x] **Step 3: Implement `/profile/page.tsx` and update `Header.tsx` and `auth/page.tsx`**

- [x] **Step 4: Run all shop tests to verify pass**
  - Run: `cd shop && npm test`
  - Expected: All test suites PASS.

- [x] **Step 5: Run full project test verification**
  - Run: `cd api && ./mvnw -q test`
  - Run: `cd admin && npm test`
  - Run: `cd shop && npm test`
  - Expected: ALL test suites PASS.

- [x] **Step 6: Commit**
  - `git commit -m "feat(shop): unified customer profile portal and header navigation integration"`
