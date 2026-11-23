# Tasks: Fix TabaPay Checkout 502 Error & Enhance Gateway Diagnostics

## 1. Backend Configuration & Sandbox Routing

- [x] 1.1 Update `api/src/main/resources/application.yml` so `app.tabapay.sandbox` defaults to `${APP_TABAPAY_SANDBOX:true}` for local development and verify configuration loading via test.
- [x] 1.2 Add unit tests in `TabapayGatewayClientTest` verifying that sandbox mode correctly sets target URL to `https://api.tabapay.ir/v1/sandbox/create` and payment URL to `https://api.tabapay.ir/sandbox/pay/{token}`.

## 2. Backend Error Handling & Upstream Diagnostics (TDD)

- [x] 2.1 Write unit tests in `TabapayGatewayClientTest` covering upstream error responses with non-1 `responseCode` (e.g. `-29: درگاه پرداخت غیر فعال شده است` and `-27: دامنه فعلی با دامنه تایید شده تطابق ندارد`).
- [x] 2.2 Refactor `TabapayGatewayClient.java` to parse upstream response JSON for `responseCode` and `message`, emit structured diagnostic logs, and enrich `ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR)` with clear localized details.
- [x] 2.3 Run backend tests with `./mvnw test -Dtest=TabapayGatewayClientTest,TabapayCheckoutIntegrationTest` and verify all tests pass.

## 3. Storefront Error Handling & Payment UI Copy

- [x] 3.1 Update `shop/src/app/checkout/page.tsx` error catch handler to extract bilingual message objects (`err?.data?.message?.fa`) from RFC 7807 problem details instead of defaulting to raw `err.message`.
- [x] 3.2 Update payment CTA button and security guarantee copy in `shop/src/app/checkout/page.tsx` from "پرداخت آنلاین با زرین‌پال" to "پرداخت آنلاین شاپرک".
- [x] 3.3 Verify storefront checkout unit tests pass with `cd shop && npx vitest run src/app/checkout/CheckoutPage.test.tsx`.

## 4. End-to-End Verification

- [x] 4.1 Run backend integration test suite (`./mvnw -q test -Dtest='*Checkout*'` or `./mvnw -q verify`) and confirm clean execution.
- [x] 4.2 Run storefront test and typecheck (`npm test` and `npm run build` in `shop/`) to verify zero regressions.
