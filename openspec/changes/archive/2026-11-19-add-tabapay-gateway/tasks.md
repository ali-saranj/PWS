# Tasks

## 1. Database & Configuration Setup

- [x] 1.1 Create Flyway migration `V12__add_tabapay_gateway.sql` updating `chk_payment_gateway` to allow `'TABAPAY'` and verify by running `./mvnw -q test -Dtest=OrderModelIntegrationTest`
- [x] 1.2 Update `AppProperties.java`, `application.yml`, and `application-prod.yml` with `app.payment.active-gateway` and `app.tabapay.*` configuration properties and verify with context load test

## 2. Gateway Abstraction & TabaPay Client

- [x] 2.1 Create `PaymentGateway` SPI, `PaymentInitiateResult`, `PaymentVerifyResult`, and `PaymentGatewayRegistry` in `ir.pws.store.order` and verify compilation
- [x] 2.2 Adapt `ZarinpalClient` into `ZarinpalGatewayClient` implementing `PaymentGateway` and verify existing tests pass with `./mvnw -q test -Dtest=CheckoutAndPaymentIntegrationTest`
- [x] 2.3 Implement `TabapayGatewayClient` implementing `PaymentGateway` with Bearer auth, `/v1/create`, and `/v1/verify` API calls
- [x] 2.4 Add WireMock unit and client tests for `TabapayGatewayClient` and verify with `./mvnw -q test -Dtest=TabapayGatewayClientTest`

## 3. Checkout Service & Unified Callback

- [x] 3.1 Refactor `CheckoutService.checkout` to delegate payment initiation to active gateway from `PaymentGatewayRegistry`
- [x] 3.2 Implement normalized callback handling in `CheckoutService` and add `GET /api/shop/payments/callback` to `ShopCheckoutController` (retaining `/api/shop/payments/zarinpal/callback` alias)
- [x] 3.3 Register `/api/shop/payments/callback` in `SecurityConfig.java` permitAll matchers and verify with security tests
- [x] 3.4 Create comprehensive integration test `TabapayCheckoutIntegrationTest` verifying checkout, TabaPay initiation, successful callback with stock deduction, failed callback, and idempotency

## 4. Storefront Integration & Full Verification

- [x] 4.1 Update `shop/src/app/checkout/callback/page.tsx` to support both `token` and `Authority` search params and call unified `/api/shop/payments/callback`
- [x] 4.2 Update storefront tests in `shop/src/app/track/OrderTrackingPage.test.tsx` to cover TabaPay callback responses and verify with `cd shop && npm test`
- [x] 4.3 Run full verification: backend `./mvnw -q verify` and storefront `npm run build`
