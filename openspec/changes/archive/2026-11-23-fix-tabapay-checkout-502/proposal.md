# Proposal: Fix TabaPay Checkout 502 Error & Enhance Gateway Diagnostics

## Why

During customer checkout, clicking "Go to Pay" (پرداخت / انتقال به درگاه) fails with `API Error: 502` (Bad Gateway). Live testing against TabaPay API identified that upstream requests to the production endpoint (`https://api.tabapay.ir/v1/create`) return code `-29` (`درگاه پرداخت غیر فعال شده است` / Gateway deactivated), while local development configurations default to `sandbox: false` and a `localhost` callback URL that TabaPay rejects with code `-27` (`دامنه فعلی با دامنه تایید شده تطابق ندارد` / Domain mismatch). The backend discards upstream error details, throwing an opaque 502, while the storefront error handler fails to unpack RFC 7807 bilingual message objects, showing a raw `"API Error: 502"` string.

Fixing this now ensures developers and testers can execute end-to-end checkout using sandbox mode, payment initiation failures are cleanly diagnosed in logs and bilingual problem details, and customers receive clear, localized explanations rather than cryptic HTTP status codes.

## What Changes

- **Sandbox Default for Dev/Test**: Configure `app.tabapay.sandbox` to default to `true` in `application.yml` so local development and test-runs route to TabaPay's working sandbox environment (`https://api.tabapay.ir/v1/sandbox/create`) with sandbox payment URL generation.
- **Enhanced Gateway Error Diagnostics & Logging**: Enhance `TabapayGatewayClient` to parse TabaPay error response payloads (extracting `responseCode` and `message`), log structured diagnostics at WARN/ERROR with the upstream error code, and provide detailed context in `ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR)`.
- **Frontend Problem Details Parsing**: Fix `shop/src/app/checkout/page.tsx` error extraction to handle bilingual RFC 7807 problem details (`err?.data?.message?.fa || err?.data?.message || err?.message`) so localized messages (e.g., "درگاه پرداخت در حال حاضر غیرفعال است") are rendered rather than the generic `"API Error: 502"`.
- **Checkout Payment CTA UI Copy**: Update payment button and security badge copy in `shop/src/app/checkout/page.tsx` from hardcoded "زرین‌پال" to neutral "پرداخت آنلاین شاپرک" aligned with the active gateway (`TABAPAY`).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `payment/gateway`: Clarify payment initiation error diagnostics and bilingual failure responses when upstream gateways return inactive or error status codes during checkout.

## Impact

- **Backend**: `api/src/main/resources/application.yml`, `ir.pws.store.order.TabapayGatewayClient`, and corresponding integration/unit tests.
- **Frontend**: `shop/src/app/checkout/page.tsx`.
- **APIs**: Unchanged public contract (`POST /api/shop/checkout`), but error payload details are enriched with upstream diagnostic messages.
