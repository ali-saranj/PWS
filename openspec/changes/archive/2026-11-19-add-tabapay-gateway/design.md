# Design: TabaPay Payment Gateway Integration

## Context

See `proposal.md` for motivation. Currently, `CheckoutService` is coupled to `ZarinpalClient`, and `payment.gateway` has a DB check constraint limited to `'ZARINPAL'`. Storefront `/checkout/callback` queries `/api/shop/payments/zarinpal/callback` with Zarinpal-specific parameters (`Authority`, `Status`).

## Goals / Non-Goals

**Goals:**
- Decouple checkout and verification logic from any single payment vendor via `PaymentGateway` interface.
- Implement `TabapayGatewayClient` supporting TabaPay V1 API (`/v1/create` and `/v1/verify` in live and sandbox modes).
- Support dynamic provider selection via Spring property `app.payment.active-gateway` (`TABAPAY` or `ZARINPAL`).
- Provide unified `/api/shop/payments/callback` supporting both TabaPay query parameters (`token`, `status`, `responseCode`) and legacy Zarinpal query parameters (`Authority`, `Status`).
- Add Flyway migration `V12__add_tabapay_gateway.sql` updating `chk_payment_gateway`.
- Update Storefront callback page to work transparently with the unified endpoint.

**Non-Goals:**
- Customer selection of payment gateway at checkout UI (single active gateway configured on server).
- TabaPay Moadian tax invoice integration (`invoiceProductId`).
- Automatic webhook verification daemon (standard synchronous redirect verification is used; webhook can be considered in a separate change if needed).

## Decisions

### 1. PaymentGateway Interface & Registry
Introduce an abstraction:
```java
public interface PaymentGateway {
    String gatewayName();
    PaymentInitiateResult initiatePayment(long amountRials, String description, String mobile, String callbackUrl);
    PaymentVerifyResult verifyPayment(long amountRials, String authorityOrToken);
}

public record PaymentInitiateResult(String trackingToken, String paymentUrl) {}
public record PaymentVerifyResult(boolean success, String refId, String cardPanMasked, String rawResponse, String errorMessage) {}
```
- `PaymentGatewayRegistry` registers all `PaymentGateway` beans into a map keyed by `gatewayName()`.
- `getActiveGateway()` returns the gateway specified by `app.payment.active-gateway`.
- `getGateway(String name)` retrieves a specific gateway for verification, ensuring callback verification always uses the gateway that initiated the payment, even if config changed subsequently.
- *Alternatives considered*: Conditional beans (`@ConditionalOnProperty`). Rejected because if an order was placed under Zarinpal and the config was switched to TabaPay before the customer returned, verifying the Zarinpal callback would fail without both beans available in application context.

### 2. TabaPay Client Implementation
- **Authentication**: HTTP Header `Authorization: Bearer <merchant-id>`.
- **Endpoints**:
  - Live: `https://api.tabapay.ir/v1/create` & `https://api.tabapay.ir/v1/verify`
  - Sandbox: `https://api.tabapay.ir/v1/sandbox/create` & `https://api.tabapay.ir/v1/sandbox/verify`
  - Redirection: `https://api.tabapay.ir/pay/{token}` (or sandbox `https://api.tabapay.ir/sandbox/pay/{token}`)
- **Payload & Responses**:
  - Initiation sends `amount` (Rials), `callbackURL`, `mobile`, `description`. Successful response returns `{ "responseCode": 1, "status": "success", "token": "...", "url": "..." }`.
  - Verification sends `token` and `amount` (Rials). Successful response returns `{ "responseCode": 1, "status": "success", "shaparakRefNumber": "...", "trackingCode": 40, "cardNumber": "..." }`.
  - HTTP client uses `RestClient` or `HttpClient` with configurable 10-second timeout.

### 3. Unified Callback Endpoint & Storefront Handling
- In `ShopCheckoutController`:
  `GET /api/shop/payments/callback`
  Accepts `@RequestParam(required = false)` for `token`, `status`, `responseCode`, `Authority`, `Status`.
- Normalizer determines:
  - If `token` present: TabaPay format. Success indicator: `responseCode == 1` and `status == "success"`.
  - If `Authority` present: Zarinpal format. Success indicator: `"OK".equalsIgnoreCase(Status)`.
- Re-route or alias `/api/shop/payments/zarinpal/callback` to the unified handler for backwards compatibility.
- Storefront `shop/src/app/checkout/callback/page.tsx`:
  Inspects URL search params for `token` or `Authority`, and requests `/api/shop/payments/callback?${searchParams.toString()}`.

### 4. Database Schema Evolution
In `api/src/main/resources/db/migration/V12__add_tabapay_gateway.sql`:
```sql
ALTER TABLE payment DROP CONSTRAINT chk_payment_gateway;
ALTER TABLE payment ADD CONSTRAINT chk_payment_gateway CHECK (gateway IN ('ZARINPAL', 'TABAPAY'));
```

## Risks / Trade-offs

- **[Risk] Parameter Mismatch in Callback**: TabaPay sends `token` and `status=success`, while Zarinpal sends `Authority` and `Status=OK`.
  → *Mitigation*: Unified callback handler explicitly checks for both parameter sets and normalizes before retrieving payment record.
- **[Risk] Amount Unit Discrepancy**: PWS stores amounts in Rials; TabaPay requires Rials (minimum 100,000 Rials).
  → *Mitigation*: PWS subtotal and shipping totals are already in Rials, matching TabaPay requirements directly. Integration tests verify amount precision.
- **[Risk] Mid-flight Gateway Switching**: If active gateway is changed while a pending payment is awaiting completion.
  → *Mitigation*: Verification retrieves gateway by `payment.gateway` column rather than active gateway configuration.

## Migration Plan

1. Deploy Flyway migration `V12__add_tabapay_gateway.sql`.
2. Configure environment variables `APP_PAYMENT_ACTIVE_GATEWAY=TABAPAY`, `APP_TABAPAY_MERCHANT_ID`, `APP_TABAPAY_SANDBOX`, `APP_TABAPAY_CALLBACK_URL`.
3. Deploy API and Storefront.
4. Rollback: If TabaPay has issues, switch `APP_PAYMENT_ACTIVE_GATEWAY=ZARINPAL` without code deployment.
