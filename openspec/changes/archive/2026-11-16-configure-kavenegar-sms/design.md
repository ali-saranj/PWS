# Design

## Context

The backend service already implements `KavenegarSmsSender` using Spring's `RestClient` targeting `https://api.kavenegar.com/v1/{apiKey}/verify/lookup.json`. 
In development and local test suites, `LoggingSmsSender` is active by default.
In production, services run via Docker Compose (`deploy/docker-compose.prod.yml`), which loads environment variables from `deploy/.env.prod`.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Configure live production SMS dispatch via Kavenegar gateway using the verified Master API key.
- Bind `APP_SMS_KAVENEGAR_TEMPLATE_OTP=SMS` to use the pre-approved Kavenegar verification template.
- Maintain strict secret hygiene: credentials reside exclusively in `deploy/.env.prod` (git-ignored), while `deploy/.env.prod.example` provides complete template references.
- Verify that development and test profiles remain fully isolated on `LoggingSmsSender`.

**Non-Goals:**
- Altering core HTTP client architecture or retry policies in `KavenegarSmsSender`.
- Hardcoding API keys or secrets in version-controlled files.
- Enforcing order status templates before the user approves them in Kavenegar.

## Decisions

### 1. Store Credentials Exclusively in `deploy/.env.prod`
- **Choice:** Place `APP_SMS_PROVIDER=kavenegar` and the active API key in `deploy/.env.prod`.
- **Rationale:** Aligns with Twelve-Factor App principles and repository rules (Chesterton's Fence & Git security). `deploy/.env.prod` is ignored by Git, preventing credential leaks.
- **Alternatives Considered:** Embedding defaults in `application-prod.yml` (Rejected: violates security policy).

### 2. Configure OTP Template Name to `SMS`
- **Choice:** Set `APP_SMS_KAVENEGAR_TEMPLATE_OTP=SMS` in production environment configuration.
- **Rationale:** Kavenegar approved the template under the identifier `SMS`, and live end-to-end delivery was confirmed to `09136978682`.
- **Alternatives Considered:** Requesting a new template named `pws-otp` in Kavenegar (Rejected: adds unnecessary waiting time for operator review when an identical, verified template is already approved).

### 3. Maintain Graceful Fallbacks for Secondary Templates
- **Choice:** Retain existing template fallbacks (`pws-order-paid`, `pws-order-approved`, `pws-order-shipped`) in `application-prod.yml`.
- **Rationale:** Ensures that order lifecycle events can be wired seamlessly once the user creates those corresponding templates in Kavenegar without modifying code.

## Risks / Trade-offs

- **[Risk] Account Credit Depletion:** With ~50,000 Rials (~13 SMS messages) initial credit, high traffic could exhaust balance.
  - **Mitigation:** The user should top up Kavenegar credit before public launch; `SmsException` gracefully handles 418/424 errors by returning `SMS_UNAVAILABLE` (HTTP 503) without crashing the application.
- **[Risk] Unregistered Order Templates:** If order lifecycle SMS is triggered before corresponding templates are approved in Kavenegar.
  - **Mitigation:** Document required order templates clearly in `deploy/.env.prod.example`.
