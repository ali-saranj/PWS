# Proposal

## Why

In the staff back-office admin panel, any first mutating action (e.g. creating/editing products, updating categories/brands, adjusting inventory, or changing order statuses) fails with an HTTP 403 Forbidden error, but immediately succeeds when the user retries. This degrades staff productivity and causes confusion because Spring Security 6 defers CSRF token generation, resulting in missing or uninitialized `XSRF-TOKEN` cookies during initial or post-authentication requests, while the frontend API client lacks a pre-flight CSRF check and transparent retry on CSRF denial.

## What Changes

- **Backend Eager CSRF Cookie Dispatch**: Introduce a `CsrfCookieFilter` (`OncePerRequestFilter`) into the security chain that forces evaluation of the deferred `CsrfToken` (`csrfToken.getToken()`) on all requests, ensuring that every response (including safe GET requests and authentication endpoints `/login`, `/verify`, `/refresh`) guarantees a valid `XSRF-TOKEN` cookie is present on the client.
- **Backend Cookie Path Consistency**: Explicitly configure `CookieCsrfTokenRepository` with `path("/")` so the readable CSRF cookie is consistently scoped across all admin routes.
- **Frontend Pre-flight Token Check**: In `admin/src/api/client.ts`, check for `XSRF-TOKEN` in `document.cookie` before executing mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`). If the cookie is not present, fetch `/api/admin/auth/csrf` first before dispatching the request.
- **Frontend Transparent 403 CSRF Retry**: In `admin/src/api/client.ts`, if a mutating request returns 403 with a newly received `XSRF-TOKEN` cookie, transparently retry the request once before throwing an error, matching the resilience pattern already used for 401 token refresh.
- **Frontend Post-Login Token Sync**: In `admin/src/auth/LoginPage.tsx` and `AuthContext.tsx`, ensure `csrf()` is called upon successful OTP verification to synchronize tokens for the newly authenticated session.

## Capabilities

### New Capabilities
- `admin/csrf-protection`: CSRF protection, token lifecycle management, and transparent client synchronization for staff back-office API operations.

### Modified Capabilities
<!-- None -->

## Impact

- **Backend**: `ir.pws.store.common.security.SecurityConfig` and new `CsrfCookieFilter`. Security tests in `StaffSecurityTest` will verify that GET requests and auth responses write the `XSRF-TOKEN` cookie and that subsequent mutating requests succeed without 403.
- **Frontend**: `admin/src/api/client.ts`, `admin/src/auth/LoginPage.tsx`, `admin/src/auth/AuthContext.tsx`. Unit tests in `admin/src/api/client.test.ts` will verify pre-flight CSRF retrieval and seamless retry on 403.
