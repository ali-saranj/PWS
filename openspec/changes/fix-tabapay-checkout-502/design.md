# Design: TabaPay Gateway Resilience & Error Diagnostics

## Context

See `proposal.md` for background and problem motivation.

In the current architecture:
1. `TabapayGatewayClient` initiates payment via `RestClient`. When the HTTP response body parses with `responseCode != 1`, it logs a raw string and throws `ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR)`.
2. `ErrorCode.PAYMENT_GATEWAY_ERROR` maps to `HttpStatus.BAD_GATEWAY` (HTTP 502) in RFC 7807 problem details format (`{ code, status: 502, message: { fa, en } }`).
3. Storefront's `checkout/page.tsx` catches `err` and assigns `err?.data?.message || err?.message`. Because `err.data.message` is an object, JavaScript fallback selects `err.message` (`"API Error: 502 Bad Gateway"`), obscuring the actual cause.
4. Upstream, TabaPay validates the registered domain for the merchant UUID and rejects `localhost` callback URLs (code `-27`), while production is returning code `-29` (gateway deactivated in TabaPay dashboard).

## Goals / Non-Goals

**Goals:**
- Provide a working default out-of-the-box development setup where local test-runs and developers use TabaPay sandbox without hitting production gateway blocks.
- Preserve upstream error diagnostic information (`responseCode` and Persian `message`) in backend logs and structured error responses.
- Ensure the storefront customer checkout UI renders clear, readable Persian error messages from problem details instead of raw HTTP codes.
- Update checkout payment button labels to avoid provider misbranding.

**Non-Goals:**
- Automating merchant verification or tax approvals inside the TabaPay partner portal (must be performed by store operators in TabaPay dashboard).
- Redesigning the unified payment callback architecture (already established in `payment/gateway`).

## Decisions

### 1. Enable Sandbox by Default in Development Profile
- **Decision**: In `api/src/main/resources/application.yml`, set `app.tabapay.sandbox: ${APP_TABAPAY_SANDBOX:true}`. In `application-prod.yml`, keep `app.tabapay.sandbox: ${APP_TABAPAY_SANDBOX:false}`.
- **Rationale**: Local developers and integration testers should never be blocked by production gateway approval cycles. In sandbox mode, TabaPay immediately returns test tokens and redirect URLs for this merchant ID.
- **Alternative considered**: Requiring every developer to export `APP_TABAPAY_SANDBOX=true` in their shell. Rejected because dev defaults should work out-of-the-box.

### 2. Upstream Error Translation & Structured Logging
- **Decision**: In `TabapayGatewayClient`, when `responseCode != 1`, extract both `responseCode` and `message` from TabaPay's response JSON.
  - Log a structured warning: `Tabapay payment initiation rejected: code={}, message={}`.
  - Throw `ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR)` with a specific bilingual message detail when known upstream codes occur (e.g. code `-29` -> "درگاه پرداخت غیرفعال است", code `-27` -> "دامنه درگاه تایید نشده است").
- **Rationale**: Operators and automated monitors can immediately diagnose whether a gateway failure is due to deactivated credentials, expired certificates, or network failure, without grepping raw JSON dumps.
- **Alternative considered**: Returning raw TabaPay message strings directly to the client without sanitization. Rejected to prevent internal provider leakage or unformatted English strings if upstream format shifts.

### 3. Storefront RFC 7807 Object Resolution
- **Decision**: In `shop/src/app/checkout/page.tsx`, resolve error text as:
  ```typescript
  const errorObj = err?.data?.message;
  const msg =
    (typeof errorObj === 'object' && errorObj !== null ? errorObj.fa : errorObj) ||
    err?.message ||
    'خطا در برقراری ارتباط با درگاه پرداخت یا ثبت سفارش.';
  ```
- **Rationale**: PWS standardizes on RFC 7807 bilingual message objects `{ fa: string, en: string }`. The frontend checkout page must gracefully unpack this object.

### 4. Provider-Agnostic Checkout Payment Button
- **Decision**: Update the payment button copy in `shop/src/app/checkout/page.tsx` to "پرداخت آنلاین شاپرک" (Online Payment via Shaparak) with subtitle "پرداخت امن و معتبر از طریق درگاه بانکی (شاپرک)".
- **Rationale**: Eliminates hardcoded references to "زرین‌پال" while `TABAPAY` is the active gateway, preventing customer confusion.

## Risks / Trade-offs

- **[Risk]** Running in sandbox mode might cause operators to mistake sandbox orders for real payments.
  → **Mitigation**: Sandbox is strictly gated by environment configuration (`application-prod.yml` defaults to `false` and requires explicit override; sandbox URLs contain `/sandbox/`).
- **[Risk]** TabaPay upstream API response structure changes.
  → **Mitigation**: Defensive JSON path lookups with fallback defaults in `TabapayGatewayClient`.
