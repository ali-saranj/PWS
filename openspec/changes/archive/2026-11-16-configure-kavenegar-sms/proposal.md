# Proposal

## Why

Persian Web Store requires an operational SMS gateway in production for passwordless customer login, staff two-factor authentication, and order status notifications. Previously, the system defaulted to `logging` mode; this change operationalizes live SMS delivery via Kavenegar's REST API using the verified Master API key and the newly approved `SMS` OTP template.

## What Changes

- Configure production environment variables in `deploy/.env.prod` to set `APP_SMS_PROVIDER=kavenegar`, the verified API key, and `APP_SMS_KAVENEGAR_TEMPLATE_OTP=SMS`.
- Update `deploy/.env.prod.example` to document the verified OTP template name and guidance for order lifecycle templates.
- Ensure Spring Boot configuration and `KavenegarSmsSender` reliably resolve the `SMS` template for OTP requests.
- Ensure dev/test environments retain the safe `logging` fallback.

## Capabilities

### New Capabilities
- `notification/sms`: Defines requirements for SMS notification dispatch via Kavenegar REST API using lookup pattern templates, token formatting, credential management, and failure resilience.

### Modified Capabilities
<!-- None -->

## Impact

- `deploy/.env.prod`: Populated with active Kavenegar credentials and template configuration.
- Storefront customer login and admin 2FA in production will send real SMS messages via telecom gateway.
- Dev and automated tests remain isolated with `logging` provider.
