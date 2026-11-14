# Tasks

## 1. Backend CSRF Filter & Security Configuration

- [x] 1.1 Add failing integration tests in `StaffSecurityTest` verifying GET requests and auth responses write the `XSRF-TOKEN` cookie and that subsequent POST requests succeed without 403
- [x] 1.2 Implement `CsrfCookieFilter` in `ir.pws.store.common.security` and register it in `SecurityConfig.java` alongside explicit `path("/")` on `CookieCsrfTokenRepository`
- [x] 1.3 Verify all backend security tests pass with `cd api && ./mvnw test -Dtest=StaffSecurityTest`

## 2. Frontend Client Resilience & Token Synchronization

- [x] 2.1 Add failing unit tests in `admin/src/api/client.test.ts` for pre-flight CSRF retrieval when `XSRF-TOKEN` is missing and single transparent retry on 403
- [x] 2.2 Update `admin/src/api/client.ts` to perform pre-flight CSRF check before mutating requests and auto-retry once on 403 when a renewed token is present
- [x] 2.3 Update `admin/src/auth/LoginPage.tsx` to ensure `csrf()` runs upon successful OTP verification
- [x] 2.4 Verify all admin tests pass with `cd admin && npm test`

## 3. Verification & Validation

- [x] 3.1 Run full admin build and test check (`npm run build`, `npm test` in `admin/`, `./mvnw test` in `api/`) to verify complete system integration
