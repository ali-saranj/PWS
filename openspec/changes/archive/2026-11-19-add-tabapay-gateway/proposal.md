# Proposal: Add TabaPay Payment Gateway

## Why

PWS currently relies exclusively on Zarinpal for customer order payments, coupling checkout services, database constraints, and callback endpoints to a single gateway provider. Adding TabaPay (tabapay.ir) provides redundancy, competitive merchant commission rates, and high transaction success rates via Shaparak. Implementing this through a unified gateway abstraction allows PWS to seamlessly switch between TabaPay and Zarinpal via configuration without altering checkout workflows or storefront UI.

## What Changes

- **Payment Gateway Abstraction**: Introduce a decoupled `PaymentGateway` SPI and registry supporting both TabaPay (`TABAPAY`) and Zarinpal (`ZARINPAL`) behind a configurable provider selector (`app.payment.active-gateway`).
- **TabaPay Integration**: Implement `TabapayGatewayClient` supporting token generation (`/v1/create` and sandbox `/v1/sandbox/create`) with HTTP Bearer authorization and transaction verification (`/v1/verify` and sandbox `/v1/sandbox/verify`).
- **Unified Callback Endpoint**: Introduce `/api/shop/payments/callback` that normalizes gateway query parameters (`token`, `status`, `responseCode`, `Authority`) and delegates verification to the initiating gateway based on the stored payment record. Maintain backward-compatibility alias for `/api/shop/payments/zarinpal/callback`.
- **Database Check Constraint**: Add Flyway migration `V12__add_tabapay_gateway.sql` updating `chk_payment_gateway` to allow `'TABAPAY'` in addition to `'ZARINPAL'`.
- **Storefront Callback Normalization**: Update Next.js `/checkout/callback` to read either TabaPay (`token`) or Zarinpal (`Authority`) parameters and verify against the unified callback endpoint.

## Capabilities

### New Capabilities
- `payment/gateway`: Multi-provider payment gateway integration supporting TabaPay and Zarinpal with configurable active provider, transaction initiation, unified callback processing, and idempotent verification.

### Modified Capabilities
<!-- None: No existing specs under openspec/specs/ currently cover order payment gateways -->

## Impact

- **Backend (`api/`)**:
  - `PaymentGateway`, `TabapayGatewayClient`, `ZarinpalGatewayClient`, and `PaymentGatewayRegistry` in `ir.pws.store.order`.
  - `CheckoutService` refactored to delegate to `PaymentGateway`.
  - `ShopCheckoutController` and `SecurityConfig` updated with `/api/shop/payments/callback`.
  - `AppProperties` updated with `app.payment.active-gateway` and `app.tabapay.*` settings.
  - Flyway migration `V12__add_tabapay_gateway.sql`.
- **Storefront (`shop/`)**:
  - `shop/src/app/checkout/callback/page.tsx` updated to parse `token` and call `/api/shop/payments/callback`.
- **Database**:
  - Table `payment`: Check constraint `chk_payment_gateway` allows `'TABAPAY'`.
