# admin/csrf-protection Specification

## Purpose

Ensures robust Cross-Site Request Forgery (CSRF) protection and seamless token synchronization for the staff back-office application across all session states.

## Requirements

### Requirement: Eager CSRF Cookie Dispatch
The system SHALL ensure every response from staff API endpoints sets or refreshes a readable `XSRF-TOKEN` cookie so that the Single-Page Application client always has access to a valid token.

#### Scenario: Safe GET requests populate CSRF cookie
- **WHEN** an unauthenticated or authenticated client issues a safe GET request to staff endpoints (including `/api/admin/auth/csrf` and catalog listings)
- **THEN** the response includes a `Set-Cookie` header for `XSRF-TOKEN` with `HttpOnly` set to false, `Path` set to `/`, and `SameSite` set to `Lax`

#### Scenario: Authentication responses maintain valid CSRF cookie
- **WHEN** a client completes login, OTP verification, or session refresh at `/api/admin/auth/*`
- **THEN** the response contains a valid readable `XSRF-TOKEN` cookie matching the current session state

### Requirement: Double-Submit Validation for Mutating Operations
The system SHALL require and validate matching CSRF tokens via the double-submit cookie pattern on all state-changing HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`) under `/api/admin/**`, unless authenticated via an explicit Bearer token.

#### Scenario: Matching header and cookie succeeds
- **WHEN** a mutating request to `/api/admin/**` includes both an `XSRF-TOKEN` cookie and a matching `X-XSRF-TOKEN` request header
- **THEN** the request passes CSRF validation and proceeds to authorization and controller handling

#### Scenario: Missing or mismatched token is rejected with 403 and issues a new token
- **WHEN** a mutating request to `/api/admin/**` with cookie authentication omits or provides an invalid `X-XSRF-TOKEN` header
- **THEN** the system rejects the request with HTTP 403 Forbidden problem JSON and returns a new `XSRF-TOKEN` cookie in the response

### Requirement: Client Pre-Flight CSRF Assurance
The staff back-office client SHALL verify the presence of a readable `XSRF-TOKEN` cookie prior to executing any mutating HTTP request.

#### Scenario: Missing token triggers pre-flight fetch
- **WHEN** the client is about to send a mutating request (`POST`, `PUT`, `DELETE`, `PATCH`) and `document.cookie` does not contain `XSRF-TOKEN`
- **THEN** the client automatically issues a pre-flight request to `/api/admin/auth/csrf` to acquire the token before dispatching the mutating request

### Requirement: Client Transparent 403 Recovery
The staff back-office client SHALL automatically recover from CSRF rejection on mutating requests by re-reading the refreshed cookie and retrying once before failing.

#### Scenario: Initial 403 with renewed token is retried seamlessly
- **WHEN** a mutating request receives an HTTP 403 Forbidden response and a new `XSRF-TOKEN` cookie is present
- **THEN** the client immediately retries the request once using the renewed token without surfacing an error alert to the staff user
