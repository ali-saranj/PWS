# Tasks

## 1. Production Configuration & Documentation

- [x] 1.1 Update `deploy/.env.prod` with `APP_SMS_PROVIDER=kavenegar`, the verified Kavenegar API key, and `APP_SMS_KAVENEGAR_TEMPLATE_OTP=SMS`, and verify file contents.
- [x] 1.2 Update `deploy/.env.prod.example` with updated template documentation reflecting the approved `SMS` OTP template.

## 2. Integration & Isolation Verification

- [x] 2.1 Run `KavenegarSmsSenderTest` to verify that template mapping, token formatting, and failure handling remain fully functional (`cd api && ./mvnw -q test -Dtest=KavenegarSmsSenderTest`).
- [x] 2.2 Run `OtpServiceTest` and `StaffAuthFlowTest` to verify that standard development and test suites remain strictly isolated with `LoggingSmsSender` (`cd api && ./mvnw -q test -Dtest='OtpServiceTest,StaffAuthFlowTest'`).

## Workflow follow-up

- Deploy to production host and verify live customer login via SMS.
- Archive the change after verification via `openspec archive configure-kavenegar-sms`.
