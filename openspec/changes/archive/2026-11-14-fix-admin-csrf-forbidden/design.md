# Design

## Context

The backend uses Spring Boot 3.5 / Spring Security 6 with `CookieCsrfTokenRepository.withHttpOnlyFalse()` and stateless JWT authentication for staff. In Spring Security 6, CSRF tokens are wrapped in `DeferredCsrfToken` and loaded lazily. If a request does not explicitly call `token.getToken()`, the token is never rendered into the `Set-Cookie` header.

The staff back-office (`admin/`) is a React SPA running behind a reverse proxy. Its HTTP client `apiFetch` in `client.ts` automatically refreshes expired JWT tokens on 401, but assumes `XSRF-TOKEN` is always present in `document.cookie`. When `XSRF-TOKEN` is missing, the mutating request fails with 403, and only then does Spring Security generate the cookie in the 403 response.

## Goals / Non-Goals

**Goals:**
- Eliminate 403 Forbidden errors on first mutating operations in the admin panel.
- Ensure the `XSRF-TOKEN` cookie is proactively populated on all API responses without breaking statelessness.
- Equip the frontend `apiFetch` with pre-flight check and seamless single-attempt retry on CSRF denial.

**Non-Goals:**
- Disabling CSRF on `/api/admin/**`: Cookie-authenticated staff sessions must continue to enforce double-submit CSRF.
- Changing customer storefront (`/api/shop/**`) CSRF behavior: Storefront already uses isolated same-origin proxying and is CSRF-exempt.
- Changing JWT cookie expiration policies or authentication contracts.

## Decisions

### Decision 1: Register a `CsrfCookieFilter` in Spring Security
Spring Security's official recommendation for SPAs using `CookieCsrfTokenRepository` is a `OncePerRequestFilter` registered after authentication that resolves the deferred token:
```java
final class CsrfCookieFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            csrfToken.getToken(); // Forces deferred token generation and writes Set-Cookie
        }
        filterChain.doFilter(request, response);
    }
}
```
*Rationale*: Ensures every response (GET, POST, error, auth) sends the cookie so the frontend always has a fresh, valid token without requiring manual `/csrf` calls.
*Alternative considered*: Calling `.setCsrfRequestAttributeName(null)` alone. While it opts out of deferred resolution on form posts, `CsrfCookieFilter` guarantees the response cookie is physically dispatched on initial GET requests.

### Decision 2: Explicit Cookie Path in `CookieCsrfTokenRepository`
Configure `csrfRepository.setCookiePath("/")` and customize with `secure(secureCookies)` and `sameSite("Lax")`.
*Rationale*: Guarantees the cookie is accessible to the entire domain, avoiding path mismatch when proxying between `/admin` and `/api`.

### Decision 3: Client Pre-Flight Check & 1-Time 403 CSRF Retry
In `admin/src/api/client.ts`:
1. **Pre-flight**: Before a mutating request (`POST`/`PUT`/`DELETE`/`PATCH`), if `readCookie('XSRF-TOKEN')` is null, await `csrf()` before sending.
2. **Transparent Retry**: If a mutating request returns 403 and `readCookie('XSRF-TOKEN')` is now available (having just been set by the 403 response), retry once with the new token.
*Rationale*: Protects against race conditions, cleared browser sessions, or expired CSRF tokens completely transparently to the user.
*Alternative considered*: Doing only backend changes. If a user clears cookies or opens multiple tabs, client-side resilience prevents any disruption.

## Risks / Trade-offs

- **[Risk] Infinite retry loop on legitimate 403 (authorization denial)** → **Mitigation**: Track a `csrfRetried` boolean on the request options; allow at most one retry.
- **[Risk] Extra overhead from `csrfToken.getToken()` on every request** → **Mitigation**: For `CookieCsrfTokenRepository`, token generation is an in-memory UUID or string check with no database queries.

## Migration Plan

Deployable with zero database migration. Backend and frontend changes are completely backward and forward compatible.
