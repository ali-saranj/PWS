# Phase 1 — Foundation & Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Spring Boot API and React admin panel where staff sign in with password + SMS code and fully manage the catalog: categories, brands, products, images, variants, volume tiers, inventory, plus staff accounts and the audit log.

**Architecture:** One Spring Boot app (`api/`) organised as modules under `ir.pws.store` (`common`, `notification`, `otp`, `staff`, `audit`, `catalog`), PostgreSQL via Flyway, cookie-based JWT auth for staff. A Vite + React + MUI SPA (`admin/`) talks to `/api/admin/**` through a Vite dev proxy (nginx in production). The storefront is Phase 2 and is not touched here.

**Tech Stack:** Java 17, Spring Boot 3.5.x (latest 3.5 patch offered by start.spring.io), Spring Security, Spring Data JPA, Flyway, PostgreSQL 16, jjwt 0.12.x, jsoup, `com.github.usefulness:webp-imageio`, JUnit 5, AssertJ, MockMvc, Zonky embedded Postgres, WireMock 3. Admin: Node 24, Vite, React 19, TypeScript, MUI (with `@mui/stylis-plugin-rtl`), React Router 7, TanStack Query 5, React Hook Form + Zod, i18next/react-i18next, TipTap, `@fontsource/vazirmatn`, `@fontsource/inter`, Vitest, React Testing Library, MSW 2.

**Spec:** `docs/superpowers/specs/2026-10-25-protein-store-design.md` (sections 2, 3.1, 3.4 staff/audit, 4.2, 5, 6.2, 7, 9 phase 1).

## Global Constraints

- Base package `ir.pws.store`; Maven `groupId` `ir.pws`, `artifactId` `store-api`. API on port 8080; admin dev server on 5173.
- Money is `long`/`BIGINT` **Rials** in the API and DB. The admin UI shows and accepts **Toman** (`rials = toman × 10`).
- Every table: `id BIGSERIAL PRIMARY KEY`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`. `product`, `variant`, `staff_user` carry `version BIGINT NOT NULL DEFAULT 0` (JPA `@Version`). Update requests for these entities include `version`; a stale version → `409 CONFLICT`.
- Errors are RFC 7807 `application/problem+json` with properties `code`, `messages: {fa, en}`, `requestId`, and for validation `errors: [{field, code, message}]` (spec §5). Never return a raw 500 for a foreseeable input.
- Error codes used in Phase 1: `VALIDATION_FAILED` 400, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `RESOURCE_IN_USE` 409, `RATE_LIMITED` 429, `OTP_INVALID` 400, `OTP_EXPIRED` 400, `OTP_TOO_MANY_ATTEMPTS` 429, `SMS_UNAVAILABLE` 503, `PRODUCT_NOT_PUBLISHABLE` 400, `INTERNAL_ERROR` 500. (`RESOURCE_IN_USE`, `PRODUCT_NOT_PUBLISHABLE` and `INTERNAL_ERROR` extend the spec's list.)
- Field-level error codes: `REQUIRED`, `INVALID`, `DUPLICATE`, `SLUG_INVALID`, `MOBILE_INVALID`, `CATEGORY_CYCLE`, `TIER_INVALID`, `STOCK_NEGATIVE`, `IMAGE_INVALID`, `FILE_TOO_LARGE`, `PASSWORD_TOO_SHORT`, `LAST_OWNER`, plus Bean Validation constraint names for annotation failures.
- Slugs match `^[a-z0-9]+(-[a-z0-9]+)*$`, max 120 characters. SKUs are trimmed and upper-cased before saving and uniqueness checks.
- Mobile numbers are stored normalised as `09xxxxxxxxx`.
- Staff auth cookies: `pws_admin_at` (access JWT, 15 min, `Path=/api/admin`) and `pws_admin_rt` (refresh, 12 h, `Path=/api/admin/auth`). Both `HttpOnly`, `SameSite=Lax`, `Secure` when `app.cookies.secure=true` (false only in dev/test). Host-only cookies (no `Domain`).
- CSRF uses the double-submit cookie pattern: cookie `XSRF-TOKEN` (readable by JS), header `X-XSRF-TOKEN`, required on every non-GET `/api/admin/**` request including login.
- Roles: `OWNER`, `PRODUCT_MANAGER`, `ORDER_OPERATOR`. Catalog and inventory endpoints → `OWNER`, `PRODUCT_MANAGER`. Staff and audit endpoints → `OWNER` only.
- Paged endpoints accept `page` (0-based, default 0) and `size` (default 20, max 100) and return `{items, page, size, total}`.
- Every staff mutation writes an `audit_log` row.
- Product descriptions are sanitised with jsoup `Safelist.basic()` plus `h2`, `h3`.
- Images: JPEG/PNG/WebP up to 5 MB in; stored as WebP at 1600 px and 400 px width (never upscaled).
- No Docker on the dev machine: tests and local runs use Zonky embedded PostgreSQL 16. The Compose file is written but checked only where Docker exists.
- Admin UI: Persian is the default (`dir="rtl"`, Vazirmatn), English uses `dir="ltr"` (Inter). Fonts are self-hosted via `@fontsource`, with no Google Fonts or CDN (hosting is in Iran). Locale persisted in `localStorage` key `pws.admin.locale`.
- Commit after each task with a conventional-commit message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Persian or Arabic-Indic digits typed into numeric fields** (price, stock, tier quantity, mobile): these must be accepted and converted, not rejected or saved as `NaN`. Tested in Task 3 (`Digits`, `MobileNumbers`) and Task 15 (`parseLocalizedInt`, `LocalizedNumberField`).
2. **Two admins editing the same product or variant:** the second save must get `409 CONFLICT`, not silently overwrite the first. Tested in Tasks 11 and 12.
3. **Concurrent stock adjustments on the same variant:** no lost update, and stock never goes negative. Tested in Task 14.
4. **Deleting a category or brand that is still referenced:** must return `409 RESOURCE_IN_USE` with a readable message, not a 500 foreign-key error. Tested in Tasks 10 and 11.
5. **Access token expiring while an admin edits a form:** the next save must refresh silently and retry once. If the refresh fails, the admin is sent to the login page. Tested in Task 15 (`client.test.ts`).

---

## File Structure

```
api/
  pom.xml, mvnw, .mvn/
  src/main/java/ir/pws/store/
    StoreApplication.java
    config/AppProperties.java, ClockConfig.java, MediaWebConfig.java
    common/web/RequestIdFilter.java, PageResponse.java
    common/error/ErrorCode.java, ApiException.java, FieldError.java, ApiExceptionHandler.java, ProblemFactory.java
    common/text/Digits.java, MobileNumbers.java, Slugs.java, HtmlSanitizer.java
    common/security/SecurityConfig.java, StaffJwtCookieFilter.java, StaffPrincipal.java, JwtService.java,
                    ProblemAuthHandlers.java, Roles.java, AuthCookies.java
    notification/SmsSender.java, SmsTemplate.java, SmsException.java, LoggingSmsSender.java, KavenegarSmsSender.java
    otp/OtpPurpose.java, OtpCode.java, OtpCodeRepository.java, OtpService.java
    staff/StaffRole.java, StaffUser.java, StaffUserRepository.java, RefreshToken.java, RefreshTokenRepository.java,
          OwnerBootstrap.java, StaffAuthService.java, StaffAuthController.java, StaffAdminService.java, StaffAdminController.java,
          dto/*.java
    audit/AuditEntry.java, AuditEntryRepository.java, AuditService.java, AuditController.java
    catalog/category/*, catalog/brand/*, catalog/product/*, catalog/variant/*, catalog/image/*, catalog/inventory/*
  src/main/resources/application.yml, application-prod.yml, messages_fa.properties, messages_en.properties,
                     db/migration/V1__otp.sql … V8__product_images.sql, db/dev/V1000__dev_seed.sql
  src/test/java/ir/pws/store/
    DevStoreApplication.java, support/{IntegrationTest, DbCleaner, MutableClock, TestConfig, AdminAuth}.java, + per-module tests
admin/
  package.json, vite.config.ts, tsconfig*.json, index.html
  src/main.tsx, App.tsx, routes.tsx
  src/api/client.ts, types.ts, auth.ts, categories.ts, brands.ts, products.ts, variants.ts, images.ts, inventory.ts, staff.ts, audit.ts
  src/i18n/index.ts, fa.json, en.json
  src/theme/ThemeRoot.tsx
  src/lib/format.ts
  src/components/LocalizedNumberField.tsx, ErrorAlert.tsx, ConfirmDialog.tsx, RichTextEditor.tsx
  src/auth/AuthContext.tsx, LoginPage.tsx, RequireRole.tsx
  src/layout/AppLayout.tsx, nav.ts
  src/features/{categories,brands,products,inventory,staff,audit,dashboard}/…
  src/test/setup.ts, server.ts (MSW)
deploy/docker-compose.dev.yml
README.md
```

---

## Part A — API foundation

### Task 1: API project scaffold, config, request IDs, test harness

**Files:**
- Create: `api/` from start.spring.io, `StoreApplication.java`, `config/AppProperties.java`, `config/ClockConfig.java`, `common/web/RequestIdFilter.java`, `common/security/SecurityConfig.java` (temporary: permit `/actuator/health`, deny all else), `application.yml`, `application-prod.yml`
- Test: `support/IntegrationTest.java`, `support/DbCleaner.java`, `support/MutableClock.java`, `support/TestConfig.java`, `DevStoreApplication.java`, `common/web/RequestIdFilterTest.java`

**Interfaces:**
- Produces: `AppProperties` (`@ConfigurationProperties("app")` record) with nested `cookies.secure`, `jwt.staffSecret`, `jwt.customerSecret`, `otp.secret`, `media.dir`, `media.baseUrl` (default `/media`), `media.serve` (bool), `sms.provider` (`logging`|`kavenegar`), `sms.kavenegar.{apiKey, baseUrl, templates.{otp, orderPaid, orderShipped}}`, `bootstrap.owner.{username,password,mobile}`. A `Clock` bean (`Clock.systemUTC()`). `IntegrationTest`: abstract base, `@SpringBootTest @AutoConfigureMockMvc @AutoConfigureEmbeddedDatabase(provider = ZONKY) @ActiveProfiles("test")`, exposes `protected MockMvc mvc`, `protected MutableClock clock`, and truncates all tables except `flyway_schema_history` in `@BeforeEach` via `DbCleaner`. `MutableClock extends Clock` with `setInstant(Instant)` and `advance(Duration)`, registered `@Primary` in `TestConfig`. Response header `X-Request-Id` on every response, and the same ID in log MDC key `requestId`.

- [x] **Step 1: Generate project**

```bash
cd /Users/ali/Documents/PWS && curl -s "https://start.spring.io/starter.zip?type=maven-project&language=java&javaVersion=17&groupId=ir.pws&artifactId=store-api&name=store-api&packageName=ir.pws.store&dependencies=web,data-jpa,validation,security,actuator,flyway,postgresql" -o /tmp/api.zip && mkdir api && unzip -q /tmp/api.zip -d api && cd api && ./mvnw -q -v
```
Rename the generated main class to `StoreApplication`. Add to `pom.xml`: `io.jsonwebtoken:jjwt-api/impl/jackson` 0.12.x, `org.jsoup:jsoup`, `com.github.usefulness:webp-imageio` (latest), and test-scoped `io.zonky.test:embedded-database-spring-test` 2.x, `org.springframework.security:spring-security-test`, `org.wiremock:wiremock-standalone` 3.x. Add the Zonky Postgres 16 binaries BOM (`io.zonky.test.postgres:embedded-postgres-binaries-bom`, 16.x) in `dependencyManagement`. Make sure `flyway-database-postgresql` is present.

- [x] **Step 2: Write `application.yml`**: `spring.jpa.open-in-view=false`, `spring.jpa.hibernate.ddl-auto=validate`, `spring.servlet.multipart.max-file-size=5MB`, `max-request-size=6MB`, `spring.messages.basename=messages`, `management.endpoints.web.exposure.include=health`. Test and dev defaults: `app.cookies.secure=false`, 32+-byte dev secrets, `app.sms.provider=logging`, `app.media.dir=${user.dir}/.media`, `app.media.serve=true`. `application-prod.yml`: `app.cookies.secure=true`, `app.media.serve=false`, `logging.structured.format.console=ecs`, `server.forward-headers-strategy=native`; every secret is read from an env var with no default.

- [x] **Step 3: Write the failing tests** in `RequestIdFilterTest extends IntegrationTest`

```java
@Test void health_isUp() throws Exception {
  mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
}
@Test void requestId_isEchoedWhenProvided() throws Exception {
  mvc.perform(get("/actuator/health").header("X-Request-Id", "abc-123"))
     .andExpect(header().string("X-Request-Id", "abc-123"));
}
@Test void requestId_isGeneratedWhenMissing() throws Exception {
  mvc.perform(get("/actuator/health"))
     .andExpect(header().string("X-Request-Id", matchesPattern("[0-9a-f\\-]{36}")));
}
```

- [x] **Step 4: Run** `cd api && ./mvnw -q test -Dtest=RequestIdFilterTest`. Expected: FAIL (no filter).

- [x] **Step 5: Implement `RequestIdFilter extends OncePerRequestFilter`** (highest precedence). It accepts an incoming `X-Request-Id` only if it matches `[A-Za-z0-9\-]{1,64}`; otherwise it generates a random UUID. It sets the MDC key and the response header, and clears the MDC in `finally`. Also implement the support classes listed above and `DevStoreApplication`: `SpringApplication.from(StoreApplication::main).with(DevDatabaseConfig.class).withAdditionalProfiles("dev").run(args)`, where `DevDatabaseConfig` (test sources) starts `EmbeddedPostgres.builder().setPort(5433).setDataDirectory(Path.of(".devdb")).setCleanDataDirectory(false).start()` and exposes its `DataSource` as `@Primary`. Add `.devdb/` and `.media/` to `.gitignore`.

- [x] **Step 6: Run** `./mvnw -q test`. Expected: PASS (all 3, plus the generated context test).

- [x] **Step 7: Verify the dev run.** Run `./mvnw -q spring-boot:test-run` in the background, then `curl -s localhost:8080/actuator/health`. Expected: `{"status":"UP"}`. Stop the process.

- [x] **Step 8: Commit** `feat(api): scaffold Spring Boot API with request IDs and embedded Postgres test harness`

### Task 2: Problem+JSON error handling

**Files:**
- Create: `common/error/ErrorCode.java`, `ApiException.java`, `FieldError.java`, `ProblemFactory.java`, `ApiExceptionHandler.java`, `common/web/PageResponse.java`, `messages_fa.properties`, `messages_en.properties`
- Test: `common/error/ApiExceptionHandlerTest.java` (standalone MockMvc with a test-only `ThrowingController`)

**Interfaces:**
- Produces:
  - `enum ErrorCode { …all Phase-1 codes…; HttpStatus status(); }`.
  - `class ApiException extends RuntimeException` with `ApiException(ErrorCode code)`, `ApiException(ErrorCode code, List<FieldError> errors)`, and `static ApiException field(String field, String fieldCode)`, which is shorthand for `VALIDATION_FAILED` with one field error.
  - `record FieldError(String field, String code)`.
  - `ProblemFactory.build(ErrorCode code, List<FieldError> errors, Locale locale)`, which returns a `ProblemDetail` with `code`, `messages.fa`, `messages.en`, `requestId` (from MDC) and `errors[{field, code, message}]` (message taken from the request's `Accept-Language`, default `fa`). Message keys are `error.<CODE>` and `field.<code>`. Security handlers (Task 6) reuse it.
  - `record PageResponse<T>(List<T> items, int page, int size, long total)` with `static <T> PageResponse<T> of(Page<T>)`.

- [x] **Step 1: Write failing tests**

```java
@Test void apiException_rendersProblemWithBothLanguages() — GET /throw/not-found →
  status 404, content type application/problem+json, $.code "NOT_FOUND", $.messages.fa not empty, $.messages.en not empty, $.requestId exists
@Test void beanValidation_listsFieldErrors() — POST /throw/validate with {"name":""} →
  400, $.code "VALIDATION_FAILED", $.errors[0].field "name", $.errors[0].code "NotBlank"
@Test void malformedJson_isValidationFailed() — POST /throw/validate body "{" → 400, $.code "VALIDATION_FAILED"
@Test void optimisticLock_isConflict() — controller throws ObjectOptimisticLockingFailureException → 409, $.code "CONFLICT"
@Test void dataIntegrityViolation_isConflict() — 409, $.code "CONFLICT"
@Test void maxUpload_isFileTooLarge() — throws MaxUploadSizeExceededException → 400, $.errors[0].field "file", $.errors[0].code "FILE_TOO_LARGE"
@Test void unexpected_isInternalErrorWithoutDetails() — throws IllegalStateException("secret") → 500, $.code "INTERNAL_ERROR", response body does not contain "secret"
@Test void fieldMessage_followsAcceptLanguage() — Accept-Language: en on a field error → $.errors[0].message is the English text
```

- [x] **Step 2: Run** `./mvnw -q test -Dtest=ApiExceptionHandlerTest`. Expected: FAIL.
- [x] **Step 3: Implement** the handler (`@RestControllerAdvice`) for `ApiException`, `MethodArgumentNotValidException`, `HandlerMethodValidationException`, `HttpMessageNotReadableException`, `ObjectOptimisticLockingFailureException`, `DataIntegrityViolationException`, `MaxUploadSizeExceededException`, `NoResourceFoundException` (→ `NOT_FOUND`) and `Exception` (log with stack trace → `INTERNAL_ERROR`). Write Persian and English messages for every error code and field code.
- [x] **Step 4: Run** the tests. Expected: PASS.
- [x] **Step 5: Commit** `feat(api): problem+json error handling with fa/en messages`

### Task 3: Text utilities (digits, mobile, slug, HTML)

**Files:**
- Create: `common/text/Digits.java`, `MobileNumbers.java`, `Slugs.java`, `HtmlSanitizer.java`
- Test: `common/text/TextUtilsTest.java` (plain JUnit)

**Interfaces:**
- Produces:
  - `Digits.toLatin(String)`: converts Persian `۰-۹` and Arabic-Indic `٠-٩` digits to ASCII.
  - `MobileNumbers.normalize(String) → String`: returns `09xxxxxxxxx` or throws `ApiException.field("mobile","MOBILE_INVALID")`.
  - `MobileNumbers.mask(String) → "0912***4567"`.
  - `Slugs.isValid(String) → boolean`.
  - `HtmlSanitizer.sanitize(String) → String`: `null` stays `null`.

- [x] **Step 1: Write failing tests**

```java
assertThat(Digits.toLatin("۰۹۱۲٣٤٥")).isEqualTo("0912345");
assertThat(MobileNumbers.normalize("۰۹۱۲ ۳۴۵ ۶۷۸۹")).isEqualTo("09123456789");
assertThat(MobileNumbers.normalize("+989123456789")).isEqualTo("09123456789");
assertThat(MobileNumbers.normalize("00989123456789")).isEqualTo("09123456789");
assertThat(MobileNumbers.normalize("9123456789")).isEqualTo("09123456789");
assertThatThrownBy(() -> MobileNumbers.normalize("0812345678")).isInstanceOf(ApiException.class);
assertThatThrownBy(() -> MobileNumbers.normalize("0912345678")).isInstanceOf(ApiException.class); // 10 digits
assertThat(MobileNumbers.mask("09123456789")).isEqualTo("0912***6789");
assertThat(Slugs.isValid("whey-isolate-2kg")).isTrue();
assertThat(Slugs.isValid("Whey")).isFalse(); assertThat(Slugs.isValid("a--b")).isFalse(); assertThat(Slugs.isValid("-a")).isFalse();
assertThat(Slugs.isValid("a".repeat(121))).isFalse();
assertThat(HtmlSanitizer.sanitize("<h2>T</h2><p onclick=x>a<script>b</script></p>")).isEqualTo("<h2>T</h2>\n<p>a</p>");
```

- [x] **Step 2: Run** them and confirm they FAIL. **Step 3: Implement.** Mobile: convert digits to Latin, strip spaces, dashes and parentheses, handle the prefixes `+98`, `0098`, `98` (when length is 12), and a bare `9`, then require `^09\d{9}$`. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): digit, mobile, slug and HTML utilities`

### Task 4: SMS sender (logging fake + Kavenegar)

**Files:**
- Create: `notification/SmsSender.java`, `SmsTemplate.java`, `SmsException.java`, `LoggingSmsSender.java`, `KavenegarSmsSender.java`
- Test: `notification/KavenegarSmsSenderTest.java` (WireMock, no Spring context)

**Interfaces:**
- Produces:
  - `interface SmsSender { void send(String mobile, SmsTemplate template, List<String> tokens); }`, which throws `SmsException` on any failure.
  - `enum SmsTemplate { OTP, ORDER_PAID, ORDER_SHIPPED }`.
  - `LoggingSmsSender` is the bean when `app.sms.provider=logging`; it also exposes `List<SentSms> sent()` and `void clear()` (`record SentSms(String mobile, SmsTemplate template, List<String> tokens)`).
  - `KavenegarSmsSender` is the bean when `app.sms.provider=kavenegar`.

- [x] **Step 1: Write failing tests**

```java
@Test void send_callsVerifyLookupWithTemplateAndTokens() — stub GET /v1/KEY/verify/lookup.json returning 200 {"return":{"status":200}};
  send("09123456789", OTP, List.of("12345")) → verify request has query receptor=09123456789, token=12345, template=<configured otp template>
@Test void send_mapsSecondAndThirdTokens() — tokens [a,b,c] → token=a, token2=b, token3=c
@Test void providerError_throwsSmsException() — stub 418 {"return":{"status":418,"message":"…"}} → SmsException
@Test void timeout_throwsSmsException() — stub with fixed delay 2s, sender built with 500 ms timeout → SmsException
```

- [x] **Step 2: Run** them and confirm FAIL. **Step 3: Implement** `KavenegarSmsSender(AppProperties props, Duration timeout)`. Production uses a 10 s timeout. Use Spring `RestClient` with `SimpleClientHttpRequestFactory` connect and read timeouts; URL-encode the tokens and don't retry. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): SMS sender abstraction with Kavenegar and logging implementations`

### Task 5: OTP service

**Files:**
- Create: `db/migration/V1__otp.sql`, `otp/OtpPurpose.java`, `OtpCode.java`, `OtpCodeRepository.java`, `OtpService.java`
- Test: `otp/OtpServiceTest.java extends IntegrationTest`

**Interfaces:**
- Consumes: `SmsSender`, `Clock`, `AppProperties.otp.secret`, `ApiException`.
- Produces:
  - `enum OtpPurpose { CUSTOMER_LOGIN, STAFF_LOGIN }`.
  - `OtpService.issue(String normalizedMobile, OtpPurpose purpose)`: sends `SmsTemplate.OTP` with the code as the single token.
  - `OtpService.verify(String normalizedMobile, OtpPurpose purpose, String code)`: returns normally on success, otherwise throws.

Table `otp_code(mobile VARCHAR(11), purpose VARCHAR(20), code_hash VARCHAR(64), expires_at, attempts INT DEFAULT 0, consumed_at NULL)`, with an index on `(mobile, purpose, created_at DESC)`.

- [x] **Step 1: Write failing tests** (each reads the code from `LoggingSmsSender.sent()`)

```java
@Test void issueThenVerify_succeedsOnce() — verify(code) ok; verify(code) again → OTP_INVALID
@Test void code_isFiveDigits() — sent token matches "\\d{5}"
@Test void wrongCode_isInvalid_andCountsAttempt()
@Test void fifthWrongAttempt_locksCode() — 4 wrong → OTP_INVALID each; 5th wrong → OTP_TOO_MANY_ATTEMPTS; then the correct code → OTP_TOO_MANY_ATTEMPTS
@Test void expiredAfterTwoMinutes() — clock.advance(121s) → OTP_EXPIRED
@Test void reissueWithinTwoMinutes_isRateLimited() — issue; issue again at +60s → RATE_LIMITED
@Test void sixthIssueWithinHour_isRateLimited() — 5 issues 2m01s apart OK; 6th → RATE_LIMITED
@Test void newIssue_invalidatesPreviousCode() — issue (A), +2m01s issue (B); verify(A) → OTP_INVALID; verify(B) ok
@Test void purposesAreIsolated() — a STAFF_LOGIN code does not verify CUSTOMER_LOGIN
@Test void smsFailure_isSmsUnavailable_andDoesNotConsumeRateLimit() — @MockitoSpyBean SmsSender throws SmsException → SMS_UNAVAILABLE; an immediate re-issue is allowed
@Test void codeIsNotStoredInPlaintext() — the stored code_hash is not equal to the code
```

- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** Generate the code with `SecureRandom`, zero-padded. The hash is hex HMAC-SHA256 of `mobile:purpose:code` keyed with `otp.secret`, and is compared in constant time. `issue` is `@Transactional`, so an `SmsException` → `ApiException(SMS_UNAVAILABLE)` rolls back the row. `verify` is `@Transactional(noRollbackFor = ApiException.class)` so attempt increments persist. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): OTP issue/verify with rate limits and attempt caps`

### Task 6: Staff model, JWT cookies, security config, owner bootstrap

**Files:**
- Create: `db/migration/V2__staff_auth.sql`, `staff/StaffRole.java`, `StaffUser.java`, `StaffUserRepository.java`, `RefreshToken.java`, `RefreshTokenRepository.java`, `OwnerBootstrap.java`, `common/security/JwtService.java`, `StaffPrincipal.java`, `StaffJwtCookieFilter.java`, `ProblemAuthHandlers.java`, `Roles.java`, `AuthCookies.java`. Rewrite `SecurityConfig.java`.
- Test: `common/security/StaffSecurityTest.java`, `staff/OwnerBootstrapTest.java`, `support/AdminAuth.java`

**Interfaces:**
- Consumes: `ProblemFactory`, `AppProperties`, `Clock`.
- Produces:
  - Tables:
    - `staff_user(username VARCHAR(50) UNIQUE, password_hash, mobile VARCHAR(11), full_name, role VARCHAR(20), active, failed_login_count INT DEFAULT 0, failed_login_window_start TIMESTAMPTZ NULL, locked_until TIMESTAMPTZ NULL, version)`.
    - `refresh_token(subject_type VARCHAR(10), subject_id BIGINT, token_hash VARCHAR(64) UNIQUE, expires_at, revoked_at NULL)`.
  - `enum StaffRole { OWNER, PRODUCT_MANAGER, ORDER_OPERATOR }`.
  - `record StaffPrincipal(long id, String username, StaffRole role)`: the authentication principal, with authority `ROLE_<role>`.
  - `JwtService`:
    - `String staffAccessToken(StaffUser)` (15 min, audience `pws-staff`, `sub`=id, claims `username`, `role`);
    - `Optional<StaffPrincipal> parseStaffAccess(String)`;
    - `String staffChallenge(long staffId)` (5 min, audience `pws-staff-challenge`);
    - `Optional<Long> parseStaffChallenge(String)`.

    All use HS256 with `jwt.staffSecret` and the `Clock`.
  - `AuthCookies`: `ResponseCookie staffAccess(String)`, `staffRefresh(String)`, `clearStaffAccess()`, `clearStaffRefresh()`.
  - `Roles`: constants `CATALOG = "hasAnyRole('OWNER','PRODUCT_MANAGER')"`, `OWNER = "hasRole('OWNER')"`.
  - Endpoints:
    - `GET /api/admin/auth/csrf` → 204 and sets the `XSRF-TOKEN` cookie;
    - `GET /api/admin/auth/me` → `{id, username, fullName, role}`.
  - Test helper `AdminAuth`: `static RequestPostProcessor staff(StaffUser)` adds a valid `pws_admin_at` cookie and `csrf()`; `StaffUser createStaff(StaffRole)` persists one with mobile `0912000000<n>` and password `Password123!`.

- [x] **Step 1: Write failing tests**

```java
@Test void me_withoutCookie_is401Problem() — $.code "UNAUTHENTICATED", content type problem+json
@Test void me_withValidCookie_returnsStaff() — $.username, $.role "OWNER"
@Test void tokenSignedWithOtherKey_isRejected() — 401
@Test void expiredAccessToken_isRejected() — issue, clock.advance(16m) → 401
@Test void challengeToken_isNotAcceptedAsAccessToken() — 401
@Test void postWithoutCsrf_is403Forbidden() — POST /api/admin/auth/logout with access cookie, no csrf → 403, $.code "FORBIDDEN"
@Test void csrfEndpoint_setsReadableXsrfCookie() — Set-Cookie XSRF-TOKEN without HttpOnly
@Test void unknownApiPath_isDenied() — GET /api/store/anything → 401 or 403 problem, never 200
// OwnerBootstrapTest
@Test void createsOwnerWhenNoStaff() — properties set → one OWNER with bcrypt hash, mobile normalised
@Test void doesNothingWhenStaffExists()
```

- [x] **Step 2: Run** and confirm FAIL.
- [x] **Step 3: Implement.** Use a stateless session. CSRF: `CookieCsrfTokenRepository.withHttpOnlyFalse()` with a plain `CsrfTokenRequestAttributeHandler`. `StaffJwtCookieFilter` runs only for `/api/admin/**`. `permitAll` covers `/actuator/health`, `/media/**`, `/api/admin/auth/{csrf,login,verify,refresh}`. `/api/admin/**` requires authentication and every other path is `denyAll`. `@EnableMethodSecurity`. The entry point and access-denied handler write problem JSON through `ProblemFactory`. Passwords use `BCryptPasswordEncoder(12)`.
- [x] **Step 4: Run** and confirm PASS.
- [x] **Step 5: Commit** `feat(api): staff model, JWT cookie auth, CSRF and owner bootstrap`

### Task 7: Staff login flow (password → SMS code), refresh, logout, lockout

**Files:**
- Create: `staff/StaffAuthService.java`, `StaffAuthController.java`, `staff/dto/LoginRequest.java`, `LoginChallenge.java`, `VerifyRequest.java`, `StaffMe.java`
- Test: `staff/StaffAuthFlowTest.java`

**Interfaces:**
- Consumes: `OtpService` (`STAFF_LOGIN`), `JwtService`, `AuthCookies`, `RefreshTokenRepository`, `AuditService.record` (comes in Task 8; inject it there and add the audit assertions then).
- Produces:
  - `POST /api/admin/auth/login {username, password}` → `200 {challenge, mobileMasked}`.
  - `POST /api/admin/auth/verify {challenge, code}` → `200 StaffMe` and sets both cookies.
  - `POST /api/admin/auth/refresh` → `200 StaffMe` and rotates both cookies.
  - `POST /api/admin/auth/logout` → `204` and clears the cookies.
  - `StaffAuthService.revokeAllFor(long staffId)` (used by Task 9).

- [x] **Step 1: Write failing tests**

```java
@Test void fullLogin_setsCookies_andMeWorks() — login → challenge; code from LoggingSmsSender; verify → Set-Cookie pws_admin_at (HttpOnly, Path=/api/admin) and pws_admin_rt (HttpOnly, Path=/api/admin/auth); GET /me with the access cookie → 200
@Test void wrongPassword_isGenericUnauthenticated() — and an unknown username gives the identical body except requestId
@Test void inactiveStaff_cannotLogin() — 401
@Test void fiveFailuresIn15Min_locksFor15Min() — 5 wrong → 6th with the correct password → 429 RATE_LIMITED; clock +15m01s → correct password works
@Test void failuresOutsideWindow_doNotAccumulate() — 4 wrong, +16m, 4 wrong → correct password still works
@Test void expiredChallenge_isRejected() — clock +6m → verify → 401
@Test void wrongCode_isOtpInvalid()
@Test void refresh_rotatesToken() — refresh → new rt differs; the old rt → 401
@Test void reusedRefreshToken_revokesAllSessions() — refresh with A → B; refresh with A again → 401; refresh with B → 401
@Test void refresh_failsForDeactivatedStaff()
@Test void logout_revokesRefreshToken_andClearsCookies() — Max-Age=0 on both; refresh with the old rt → 401
@Test void refreshTokenStoredHashed() — no refresh_token.token_hash equals the cookie value
```

- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** The refresh token is 32 random bytes, Base64URL-encoded; store its SHA-256 hex and expire it after 12 h. Lockout state lives on `staff_user`: if `failed_login_window_start` is older than 15 min, reset the count before incrementing; on the 5th failure set `locked_until = now + 15m`. A locked account answers `RATE_LIMITED` before the password is checked. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): two-step staff login with lockout, refresh rotation and logout`

### Task 8: Audit log

**Files:**
- Create: `db/migration/V3__audit_log.sql`, `audit/AuditEntry.java`, `AuditEntryRepository.java`, `AuditService.java`, `AuditController.java`
- Modify: `StaffAuthService` (record `STAFF_LOGIN` on a successful verify and `STAFF_LOGIN_FAILED` on a wrong password for a known user)
- Test: `audit/AuditTest.java`

**Interfaces:**
- Produces:
  - Table `audit_log(staff_user_id BIGINT NULL REFERENCES staff_user, action VARCHAR(60), entity_type VARCHAR(40), entity_id BIGINT NULL, before JSONB NULL, after JSONB NULL, ip VARCHAR(45))`.
  - `AuditService.record(String action, String entityType, Long entityId, Object before, Object after)`: serialises with the app `ObjectMapper` and takes the staff from the `SecurityContext` (or an explicit `recordFor(Long staffId, …)` overload for login events) and the IP from the current request.
  - `GET /api/admin/audit?entityType&staffUserId&page&size` (OWNER) → `PageResponse<AuditEntryDto{id, staffUsername, action, entityType, entityId, before, after, ip, createdAt}>`, newest first.

- [x] **Step 1: Write failing tests:** `loginSuccess_isAudited`, `failedPassword_isAudited`, `list_isOwnerOnly` (PRODUCT_MANAGER → 403), `list_filtersByEntityType_newestFirst`, `beforeAndAfter_areJsonObjects` (`$.items[0].after.name` readable).
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): audit log with owner-only listing`

### Task 9: Staff management API

**Files:**
- Create: `staff/StaffAdminService.java`, `StaffAdminController.java`, `staff/dto/StaffDto.java`, `CreateStaffRequest.java`, `UpdateStaffRequest.java`, `PasswordRequest.java`
- Test: `staff/StaffAdminTest.java`

**Interfaces:**
- Consumes: `MobileNumbers`, `StaffAuthService.revokeAllFor`, `AuditService`.
- Produces (all OWNER only):
  - `GET /api/admin/staff` → `StaffDto[] {id, username, fullName, mobile, role, active, version}`;
  - `POST /api/admin/staff {username, password, fullName, mobile, role}` → 201 `StaffDto`;
  - `PUT /api/admin/staff/{id} {fullName, mobile, role, active, version}` → `StaffDto`;
  - `POST /api/admin/staff/{id}/password {password}` → 204.

- [x] **Step 1: Write failing tests:**
  - `create_returnsStaff_andAudits`
  - `duplicateUsername_isFieldDuplicate` (`errors[0].field` `username`, code `DUPLICATE`, case-insensitive)
  - `shortPassword_isFieldPasswordTooShort` (fewer than 10 characters)
  - `persianDigitMobile_isNormalised`
  - `staleVersion_isConflict`
  - `cannotDemoteOrDeactivateLastActiveOwner` (field `role` or `active`, code `LAST_OWNER`)
  - `deactivating_revokesRefreshTokens`
  - `passwordReset_revokesRefreshTokens`
  - `productManager_isForbidden`
  - `responsesNeverContainPasswordHash`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): owner-managed staff accounts`

## Part B — Catalog API

### Task 10: Categories and brands

**Files:**
- Create: `db/migration/V4__categories_brands.sql`, `catalog/category/{Category, CategoryRepository, CategoryService, CategoryController, CategoryDto, CategoryRequest}.java`, `catalog/brand/{Brand, BrandRepository, BrandService, BrandController, BrandDto, BrandRequest}.java`
- Test: `catalog/category/CategoryApiTest.java`, `catalog/brand/BrandApiTest.java`

**Interfaces:**
- Consumes: `Slugs`, `AuditService`, `Roles.CATALOG`.
- Produces:
  - Tables `category(name_fa, name_en, slug UNIQUE, parent_id NULL REFERENCES category, sort_order INT, active)` and `brand(name_fa, name_en, slug UNIQUE, logo_path NULL, active)`.
  - `GET /api/admin/categories` → flat `CategoryDto[] {id, parentId, nameFa, nameEn, slug, sortOrder, active}`, ordered by `sortOrder, id`.
  - `POST /api/admin/categories CategoryRequest {parentId, nameFa, nameEn, slug, sortOrder, active}` → 201.
  - `PUT /api/admin/categories/{id}` (same body) and `DELETE /api/admin/categories/{id}` → 204.
  - Brands: `GET/POST/PUT/DELETE /api/admin/brands[/{id}]`, with `BrandDto {id, nameFa, nameEn, slug, logoUrl, active}` and `BrandRequest {nameFa, nameEn, slug, active}`.
  - `CategoryService.assertDeletable(long id)` and `BrandService.assertDeletable(long id)` are extension points that Task 11 extends with product checks.
- Validation: `nameFa` required, max 200; `nameEn` optional, max 200; slug required and valid.

- [x] **Step 1: Write failing tests:**
  - `createAndList`
  - `invalidSlug_isFieldSlugInvalid`
  - `duplicateSlug_isFieldDuplicate`
  - `parentMustExist` (404)
  - `cannotSetParentToSelfOrDescendant` (field `parentId`, code `CATEGORY_CYCLE`)
  - `deleteCategoryWithChildren_isResourceInUse` (409, `$.code` `RESOURCE_IN_USE`)
  - `deleteLeaf_works`
  - `mutations_areAudited`
  - `orderOperator_isForbidden`
  - `missingNameFa_isRequired`
  - For brands: `brandCrud`, `duplicateBrandSlug`.
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): category tree and brand management`

### Task 11: Products (basics, list, filters, optimistic locking)

**Files:**
- Create: `db/migration/V5__products.sql`, `catalog/product/{Product, ProductStatus, ProductRepository, ProductService, ProductController, ProductUpsertRequest, ProductDetailDto, ProductSummaryDto}.java`
- Modify: `CategoryService.assertDeletable`, `BrandService.assertDeletable` (reject when products reference them)
- Test: `catalog/product/ProductApiTest.java`

**Interfaces:**
- Consumes: `HtmlSanitizer`, `Slugs`, `AuditService`, `PageResponse`.
- Produces:
  - Table `product` as in spec §3.1, with `rating_avg NUMERIC(3,2) DEFAULT 0` and `rating_count INT DEFAULT 0`.
  - `enum ProductStatus { DRAFT, ACTIVE, ARCHIVED }`.
  - `GET /api/admin/products?q&status&categoryId&brandId&page&size` → `PageResponse<ProductSummaryDto {id, nameFa, nameEn, slug, status, brandId, categoryId, thumbnailUrl, variantCount, minPrice, totalStock, updatedAt}>`. `q` matches `nameFa`, `nameEn`, `slug` and variant SKU, case-insensitive. Sorted by `updatedAt` descending. Fields from variants and images are `0`/`null` until Tasks 12–13 fill them.
  - `GET /api/admin/products/{id}` → `ProductDetailDto {id, version, brandId, categoryId, slug, nameFa, nameEn, descriptionFa, descriptionEn, status, featured, seoTitleFa, seoTitleEn, seoDescriptionFa, seoDescriptionEn, images: [], variants: []}`.
  - `POST /api/admin/products ProductUpsertRequest` → 201, status `DRAFT`.
  - `PUT /api/admin/products/{id} ProductUpsertRequest + version` → `ProductDetailDto`.
  - `ProductService.getDetail(long id)` is reused by Tasks 12–13 to fill `images` and `variants`.
- `ProductUpsertRequest {brandId, categoryId, slug, nameFa, nameEn, descriptionFa, descriptionEn, featured, seoTitleFa, seoTitleEn, seoDescriptionFa, seoDescriptionEn, version?}`. Limits: SEO titles ≤ 70 characters, SEO descriptions ≤ 160.

- [x] **Step 1: Write failing tests:**
  - `create_isDraft_andSanitisesDescription`
  - `update_withStaleVersion_isConflict`: two `GET`s → `PUT` A succeeds → `PUT` B with the old version → 409 `CONFLICT` (Review Focus 2)
  - `unknownBrandOrCategory_is404`
  - `duplicateSlug_isFieldDuplicate`
  - `list_filtersByStatusCategoryBrand_andSearchesNames` (Persian `q` matches `nameFa`)
  - `list_paginates_andCapsSizeAt100`
  - `deleteCategoryUsedByProduct_isResourceInUse`, `deleteBrandUsedByProduct_isResourceInUse` (Review Focus 4)
  - `update_isAuditedWithBeforeAndAfter`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): product CRUD with filters and optimistic locking`

### Task 12: Variants, volume tiers, tier pricing, publish status

**Files:**
- Create: `db/migration/V6__variants_tiers_stock.sql`, `catalog/variant/{Variant, VariantRepository, VolumeTier, VariantService, VariantController, VariantDto, VariantUpsertRequest, TierDto, TierPricing}.java`, `catalog/inventory/{StockMovement, StockMovementReason, StockMovementRepository, StockLedger}.java`
- Modify: `ProductService` (`variants` in the detail and summary counts; status change), `ProductController` (`POST /{id}/status`)
- Test: `catalog/variant/TierPricingTest.java` (plain JUnit), `catalog/variant/VariantApiTest.java`

**Interfaces:**
- Produces:
  - Tables:
    - `variant` as in spec §3.1, with `sku UNIQUE`, `CHECK (stock_on_hand >= 0)`, `CHECK (base_price > 0)`;
    - `volume_tier(variant_id, min_qty, unit_price, UNIQUE(variant_id, min_qty))`;
    - `stock_movement(variant_id, delta INT, reason VARCHAR(30), ref_id BIGINT NULL, staff_user_id NULL, note VARCHAR(500) NULL)`.
  - `TierPricing.unitPrice(long basePrice, List<TierDto> tiers, int qty) → long` (spec §3.1 rule).
  - `TierPricing.validate(long basePrice, List<TierDto> tiers) → List<FieldError>`: each `minQty ≥ 2`; `minQty` strictly increasing once sorted; each `unitPrice < basePrice` and strictly below every tier with a smaller `minQty`. Fields are named `tiers[i].minQty` / `tiers[i].unitPrice` with code `TIER_INVALID`.
  - `StockLedger.apply(Variant v, int delta, StockMovementReason reason, Long refId, String note)`: changes `stockOnHand` and writes a movement; a result below 0 throws `ApiException.field("delta","STOCK_NEGATIVE")`. Reasons are `INITIAL, MANUAL_ADJUSTMENT, ORDER_PAID, ORDER_CANCELLED`.
  - `VariantDto {id, version, sku, flavourFa, flavourEn, sizeLabel, weightGrams, basePrice, compareAtPrice, stockOnHand, lowStockThreshold, active, sortOrder, tiers: TierDto[{minQty, unitPrice}]}`.
  - `POST /api/admin/products/{productId}/variants VariantUpsertRequest{…, initialStock}` → 201 `VariantDto`; `initialStock > 0` writes an `INITIAL` movement.
  - `PUT /api/admin/variants/{id} VariantUpsertRequest + version`; stock is not editable here, and `initialStock` is ignored.
  - `PUT /api/admin/variants/{id}/tiers {tiers: TierDto[]}`: replaces all tiers and returns `VariantDto`.
  - `POST /api/admin/products/{id}/status {status, version}` → `ProductDetailDto`. `ACTIVE` requires at least one active variant, otherwise `PRODUCT_NOT_PUBLISHABLE`.
  - Variants are never deleted, only deactivated (`active=false`).

- [x] **Step 1: Write failing tests**

```java
// TierPricingTest
long base = 2_000_000; var tiers = List.of(new TierDto(10, 1_850_000), new TierDto(50, 1_700_000));
assertThat(TierPricing.unitPrice(base, tiers, 1)).isEqualTo(2_000_000);
assertThat(TierPricing.unitPrice(base, tiers, 9)).isEqualTo(2_000_000);
assertThat(TierPricing.unitPrice(base, tiers, 10)).isEqualTo(1_850_000);
assertThat(TierPricing.unitPrice(base, tiers, 49)).isEqualTo(1_850_000);
assertThat(TierPricing.unitPrice(base, tiers, 500)).isEqualTo(1_700_000);
assertThat(TierPricing.unitPrice(base, List.of(new TierDto(50,1_700_000), new TierDto(10,1_850_000)), 20)).isEqualTo(1_850_000); // unsorted input
assertThat(TierPricing.validate(base, List.of(new TierDto(1, 1_900_000)))).extracting(FieldError::code).containsExactly("TIER_INVALID");
assertThat(TierPricing.validate(base, List.of(new TierDto(10, 2_000_000)))).isNotEmpty();             // not below base
assertThat(TierPricing.validate(base, List.of(new TierDto(10, 1_800_000), new TierDto(50, 1_850_000)))).isNotEmpty(); // larger qty, higher price
assertThat(TierPricing.validate(base, List.of(new TierDto(10, 1_800_000), new TierDto(10, 1_700_000)))).isNotEmpty(); // duplicate minQty
```

VariantApiTest:
- `create_withInitialStock_writesInitialMovement`
- `skuIsUppercasedAndUnique` (` whey-1 ` then `WHEY-1` → field `sku` `DUPLICATE`)
- `update_staleVersion_isConflict`
- `update_doesNotChangeStock`
- `replaceTiers_validatesAndPersists`
- `tiersInvalid_returnsIndexedFieldErrors`
- `publishWithoutActiveVariant_isNotPublishable`
- `publishWithActiveVariant_succeeds`
- `productDetail_includesVariantsAndTiers`
- `summary_showsVariantCountMinPriceTotalStock`

- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): variants, volume tiers and publish rules`

### Task 13: Product images and brand logos

**Files:**
- Create: `db/migration/V7__product_images.sql`, `catalog/image/{ImageProcessor, ProcessedImage, MediaStorage, LocalMediaStorage, ProductImage, ProductImageRepository, ProductImageService, ProductImageController, ImageDto}.java`, `config/MediaWebConfig.java`
- Modify: `BrandController` (`POST /{id}/logo`), `ProductService` (images in the detail, `thumbnailUrl` in the summary)
- Test: `catalog/image/ImageProcessorTest.java`, `catalog/image/ProductImageApiTest.java`. Test fixtures (`src/test/resources/images/`): `sample.jpg` (2400×1600), `small.png` (300×200), `not-image.txt`, `fake.jpg` (text with a `.jpg` name). Generate them with `ImageIO` in a test helper rather than committing binaries.

**Interfaces:**
- Produces:
  - Table `product_image(product_id, path VARCHAR(255), sort_order INT, alt_fa, alt_en)`. `path` is the stem, e.g. `products/12/3f2c…`; the files are `<stem>-1600.webp` and `<stem>-400.webp`.
  - `ImageProcessor.process(byte[] input) → ProcessedImage(byte[] large, byte[] thumb)`: throws `ApiException.field("file","IMAGE_INVALID")` unless the magic bytes say JPEG, PNG or WebP **and** `ImageIO` decodes it. It resizes to `min(width, 1600)` and `min(width, 400)` keeping the aspect ratio and encodes WebP at quality 0.82.
  - `MediaStorage.save(String relPath, byte[])` and `delete(String relPath)`; `LocalMediaStorage` stores under `app.media.dir`. Media URL = `app.media.baseUrl + "/" + relPath`.
  - `ImageDto {id, url, thumbUrl, sortOrder, altFa, altEn}`.
  - Endpoints:
    - `POST /api/admin/products/{id}/images` (multipart `file`) → 201 `ImageDto`, appended last;
    - `PUT /api/admin/products/{id}/images/order {imageIds}` → `ImageDto[]` (must be exactly the product's image IDs, otherwise `VALIDATION_FAILED`);
    - `PUT /api/admin/images/{imageId} {altFa, altEn}`;
    - `DELETE /api/admin/images/{imageId}` → 204 and removes the files;
    - `POST /api/admin/brands/{id}/logo` (multipart) → `BrandDto`, stored as `brands/<id>/<uuid>-400.webp` only.
  - `MediaWebConfig` serves `/media/**` from `app.media.dir` when `app.media.serve=true`.

- [x] **Step 1: Write failing tests:**
  - `jpeg_isResizedTo1600And400Webp` (output starts with `RIFF`, bytes 8–11 are `WEBP`; decoded widths 1600 and 400)
  - `smallImage_isNotUpscaled` (300 px stays 300 in both)
  - `textFile_isImageInvalid`
  - `fakeJpg_isImageInvalid`
  - `upload_thenDetailListsImage_andFileIsServed` (GET `/media/...-400.webp` → 200 `image/webp`)
  - `reorder_requiresExactIdSet`
  - `delete_removesFiles`
  - `over5MB_isFileTooLarge`
  - `brandLogo_upload`
  - `uploads_areAudited`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** If `webp-imageio` has no native binary for the platform, stop and report it instead of switching formats. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): product images and brand logos with WebP processing`

### Task 14: Inventory API

**Files:**
- Create: `catalog/inventory/{InventoryService, InventoryController, InventoryRowDto, AdjustmentRequest, StockMovementDto}.java`
- Test: `catalog/inventory/InventoryApiTest.java`

**Interfaces:**
- Consumes: `StockLedger.apply`, `VariantRepository`.
- Produces:
  - `GET /api/admin/inventory?q&lowStock&page&size` → `PageResponse<InventoryRowDto {variantId, productId, productNameFa, productNameEn, sku, flavourFa, flavourEn, sizeLabel, stockOnHand, lowStockThreshold, active}>`. `lowStock=true` means `stock_on_hand <= low_stock_threshold`. Sorted by `stockOnHand` ascending.
  - `POST /api/admin/inventory/adjustments {adjustments: [{variantId, delta, note}]}` → `InventoryRowDto[]`: all-or-nothing. Variant rows are locked with `SELECT … FOR UPDATE` in ascending ID order to avoid deadlocks. `delta ≠ 0`, `note` ≤ 500 characters. Errors are named `adjustments[i].delta` with code `STOCK_NEGATIVE`.
  - `GET /api/admin/variants/{id}/movements?page&size` → `PageResponse<StockMovementDto {id, delta, reason, note, staffUsername, createdAt}>`.

- [x] **Step 1: Write failing tests:**
  - `adjust_updatesStock_andRecordsMovementWithStaff`
  - `batchIsAllOrNothing` (first valid, second would go negative → 400; first unchanged)
  - `persianDigitsAreNotAccepted_asJsonNumbers`: the API takes JSON numbers only, and the UI converts digits (documents the contract)
  - `lowStockFilter`
  - `searchBySkuAndName`
  - `concurrentAdjustments_doNotLoseUpdates` (Review Focus 3): stock 10; 10 threads each `delta -1` in parallel through `MockMvc` on an executor → final 0, 10 movements. Then 2 threads `-1` on stock 1 → exactly one succeeds and one gets `STOCK_NEGATIVE`.
  - `orderOperator_isForbidden`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(api): inventory listing and batch stock adjustments`

## Part C — Admin app

### Task 15: Admin scaffold — theme/RTL, i18n, formatting, API client

**Files:**
- Create: `admin/` (`npm create vite@latest admin -- --template react-ts`), `vite.config.ts` (proxy `/api` and `/media` → `http://localhost:8080`; Vitest `environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`), `src/theme/ThemeRoot.tsx`, `src/i18n/{index.ts, fa.json, en.json}`, `src/lib/format.ts`, `src/api/{client.ts, types.ts}`, `src/components/{LocalizedNumberField.tsx, ErrorAlert.tsx, ConfirmDialog.tsx}`, `src/test/{setup.ts, server.ts}`
- Test: `src/lib/format.test.ts`, `src/api/client.test.ts`, `src/components/LocalizedNumberField.test.tsx`

**Interfaces:**
- Produces:
  - `format.ts`:
    - `toLatinDigits(s)`;
    - `parseLocalizedInt(s: string): number | null`: strips `,`, `٬` and spaces, converts digits, `null` if empty or not an integer;
    - `formatNumber(n, locale)`;
    - `formatToman(rials: number, locale: 'fa'|'en')`;
    - `rialsToToman(r)`, `tomanToRials(t)`;
    - `formatDate(iso, locale)` in time zone `Asia/Tehran`, Persian calendar for `fa`, with bidi marks stripped.
  - `client.ts`:
    - `apiFetch<T>(path: string, opts?: {method?: string; json?: unknown; formData?: FormData}): Promise<T>`: sends credentials, adds `X-XSRF-TOKEN` from `document.cookie` on non-GET, and returns `undefined` on 204;
    - `class ApiError extends Error { status: number; code: string; messages: {fa: string; en: string}; fieldErrors: {field: string; code: string; message: string}[]; requestId?: string }`;
    - `setSessionExpiredHandler(fn: () => void)`. On a 401 from any path except `/api/admin/auth/*`, the client calls `POST /api/admin/auth/refresh` once (shared by concurrent callers) and retries; if the refresh fails it calls the handler and throws the original `ApiError`.
  - `types.ts`: TypeScript mirrors of every DTO from Tasks 2–14 (same field names), plus `Page<T>`.
  - `ThemeRoot`: reads the i18n language, sets `document.dir`/`lang`, uses an emotion cache with `rtlPlugin` for `fa`, and sets the font family (Vazirmatn or Inter).
  - `i18n`: `setLocale('fa'|'en')` persists to `localStorage` (wrapped in try/catch).
  - `LocalizedNumberField` (MUI `TextField` + RHF `Controller`): shows digits in the current locale, accepts either digit set, and emits a `number | null`.
  - `ErrorAlert({error})`: shows `error.messages[locale]`.

- [x] **Step 1: Install** `@mui/material @emotion/react @emotion/styled @emotion/cache @mui/stylis-plugin-rtl stylis @mui/icons-material react-router @tanstack/react-query react-hook-form zod @hookform/resolvers i18next react-i18next @fontsource/vazirmatn @fontsource/inter` and dev `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw`.
- [x] **Step 2: Write failing tests**

```ts
expect(parseLocalizedInt('۱٬۲۰۰٬۰۰۰')).toBe(1200000);
expect(parseLocalizedInt('1,200,000')).toBe(1200000);
expect(parseLocalizedInt('٣٤')).toBe(34);
expect(parseLocalizedInt('')).toBeNull(); expect(parseLocalizedInt('12a')).toBeNull(); expect(parseLocalizedInt('1.5')).toBeNull();
expect(formatToman(12_000_000, 'fa')).toBe('۱٬۲۰۰٬۰۰۰ تومان');
expect(formatToman(12_000_000, 'en')).toBe('1,200,000 Toman');
expect(tomanToRials(1_200_000)).toBe(12_000_000); expect(rialsToToman(12_000_000)).toBe(1_200_000);
expect(formatDate('2026-10-25T10:00:00Z', 'fa')).toBe('۱۴۰۵/۰۸/۰۳');
expect(formatDate('2026-10-25T10:00:00Z', 'en')).toBe('Oct 25, 2026');
```

`client.test.ts` (MSW):
- `sends XSRF header on POST`
- `parses problem+json into ApiError`
- `on 401 refreshes once then retries` (Review Focus 5)
- `two concurrent 401s trigger a single refresh`
- `refresh failure calls session-expired handler and throws`
- `does not try to refresh for /api/admin/auth/* calls`

`LocalizedNumberField.test.tsx`: typing `۱۲۰۰` emits `1200`; typing `abc` shows a validation message and emits `null`.

- [x] **Step 3: Run** `cd admin && npx vitest run`. Expected: FAIL. **Step 4: Implement.** **Step 5: Run** and confirm PASS. Also `npx tsc -b && npx vite build` with no errors. **Step 6: Commit** `feat(admin): scaffold with RTL theme, i18n, formatting and API client`

### Task 16: Admin login and role-aware shell

**Files:**
- Create: `src/api/auth.ts`, `src/auth/{AuthContext.tsx, LoginPage.tsx, RequireRole.tsx}`, `src/layout/{AppLayout.tsx, nav.ts}`, `src/features/dashboard/DashboardPage.tsx` (placeholder welcome card), `src/routes.tsx`, `src/App.tsx`
- Test: `src/layout/nav.test.ts`, `src/auth/LoginPage.test.tsx`, `src/auth/RequireRole.test.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `ApiError`, `setSessionExpiredHandler`, `StaffMe`.
- Produces:
  - `auth.ts`: `csrf()`, `login(username, password) → {challenge, mobileMasked}`, `verify(challenge, code) → StaffMe`, `me()`, `logout()`.
  - `useAuth(): {staff: StaffMe | null; loading: boolean; signIn(me: StaffMe): void; signOut(): Promise<void>}`.
  - `nav.ts`: `type NavKey = 'dashboard'|'categories'|'brands'|'products'|'inventory'|'staff'|'audit'`, `navItems: {key: NavKey; path: string; roles: StaffRole[]; icon}[]`, `visibleNavItems(role: StaffRole): NavKey[]`.
  - `<RequireRole roles={…}>` redirects to `/login` when signed out and shows a "no access" page for the wrong role.
  - Routes: `/login`, `/`, `/categories`, `/brands`, `/products`, `/products/new`, `/products/:id`, `/inventory`, `/staff`, `/audit`.
  - `AppLayout`: an MUI `AppBar` with a language toggle (فا/EN), the staff name and a logout button, and a permanent `Drawer` on desktop (temporary below `md`). The drawer anchors to the right in RTL automatically through the theme direction.

- [x] **Step 1: Write failing tests**

```ts
expect(visibleNavItems('ORDER_OPERATOR')).toEqual(['dashboard']);
expect(visibleNavItems('PRODUCT_MANAGER')).toEqual(['dashboard','categories','brands','products','inventory']);
expect(visibleNavItems('OWNER')).toEqual(['dashboard','categories','brands','products','inventory','staff','audit']);
```

LoginPage tests:
- `step 1 shows masked mobile then step 2 verifies and navigates to /`
- `wrong password shows server message`
- `rate limited shows server message`
- `code field accepts Persian digits` (`۱۲۳۴۵` is sent as `12345`)

RequireRole tests: `redirects when signed out`, `shows no-access for wrong role`.

- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** On boot, `App` calls `csrf()` then `me()`; a 401 from `me()` means signed out. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(admin): two-step login and role-aware layout`

### Task 17: Categories and brands screens

**Files:**
- Create: `src/api/{categories.ts, brands.ts}`, `src/features/categories/{CategoriesPage.tsx, CategoryDialog.tsx, buildTree.ts}`, `src/features/brands/{BrandsPage.tsx, BrandDialog.tsx}`
- Test: `src/features/categories/buildTree.test.ts`, `src/features/categories/CategoriesPage.test.tsx`

**Interfaces:**
- Produces:
  - Query hooks `useCategories()`, `useSaveCategory()`, `useDeleteCategory()`, `useBrands()`, `useSaveBrand()`, `useDeleteBrand()`, `useUploadBrandLogo()` (TanStack Query keys `['categories']` and `['brands']`).
  - `buildTree(flat: CategoryDto[]): CategoryNode[]`, where `CategoryNode = CategoryDto & {children: CategoryNode[]}`, sorted by `sortOrder` then `id`.
  - Shared form rule: the slug auto-fills from `nameEn` (lower-case, non-alphanumerics → `-`, trimmed) until the user edits it. Server field errors map onto RHF fields through `setError(field, {message})`.

- [x] **Step 1: Write failing tests:**
  - `buildTree nests and sorts`
  - `buildTree tolerates orphan parentId (treated as root)`
  - `deleting a category in use shows RESOURCE_IN_USE message`
  - `duplicate slug error is shown under the slug field`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** Categories use an indented tree list with add-child, edit and delete actions. The parent select excludes the category itself and its descendants. Brands use a table with the logo thumbnail, an edit dialog and a logo upload. **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(admin): category tree and brand management screens`

### Task 18: Product list and editor (basics, SEO, status)

**Files:**
- Create: `src/api/products.ts`, `src/components/RichTextEditor.tsx` (TipTap StarterKit restricted to paragraph, `h2`/`h3`, bold, italic, lists and links), `src/features/products/{ProductListPage.tsx, ProductEditorPage.tsx, BasicsTab.tsx, SeoTab.tsx, StatusControl.tsx, productSchema.ts}`
- Test: `src/features/products/ProductEditorPage.test.tsx`, `src/features/products/ProductListPage.test.tsx`

**Interfaces:**
- Consumes: the `CategoryDto`/`BrandDto` hooks from Task 17 and `apiFetch`.
- Produces:
  - Hooks `useProducts(filters)`, `useProduct(id)`, `useCreateProduct()`, `useUpdateProduct()`, `useSetProductStatus()`; query keys `['products', filters]` and `['product', id]`.
  - `ProductEditorPage` has tabs **Basics | Variants | Images | SEO**. Variants and Images are mounted by Task 19 and disabled until the product exists. The status control shows the current status chip plus Publish/Unpublish/Archive actions.
  - List filters (search, status, category, brand) live in URL search params.

- [x] **Step 1: Write failing tests:**
  - `list reads filters from URL and shows status chips`
  - `create navigates to /products/:id`
  - `409 CONFLICT on save shows reload prompt; reload refetches and keeps the editor open`
  - `PRODUCT_NOT_PUBLISHABLE shows its message`
  - `SEO title counter warns above 70 chars`
  - `unsaved changes prompt on navigation` (React Router `useBlocker`)
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(admin): product list and editor with SEO and publish control`

### Task 19: Variants, tiers and images tabs

**Files:**
- Create: `src/api/{variants.ts, images.ts}`, `src/features/products/{VariantsTab.tsx, VariantDialog.tsx, TierEditor.tsx, tierRules.ts, ImagesTab.tsx}`
- Test: `src/features/products/tierRules.test.ts`, `src/features/products/TierEditor.test.tsx`, `src/features/products/ImagesTab.test.tsx`

**Interfaces:**
- Produces:
  - `tierRules.validateTiers(baseToman: number, tiers: {minQty: number; unitToman: number}[]): {index: number; field: 'minQty'|'unitPrice'; messageKey: string}[]`, mirroring `TierPricing.validate` in Toman.
  - Hooks `useCreateVariant`, `useUpdateVariant`, `useSaveTiers`, `useUploadImage`, `useReorderImages`, `useUpdateImageAlt`, `useDeleteImage`. All invalidate `['product', id]`.
  - The variants tab is a table (SKU, flavour, size, price in Toman, stock, active) with Add/Edit dialogs that use `LocalizedNumberField` and Toman ↔ Rial conversion, plus a "Tiers" button that opens `TierEditor`. `TierEditor` shows a live example ("10 units → X Toman each").
  - The images tab allows multiple uploads with per-file progress and errors, drag to reorder (native HTML5 drag events, saved on drop), edit alt text (fa/en) and delete with confirmation.

- [x] **Step 1: Write failing tests:**
  - `tierRules rejects minQty < 2, price >= base, non-decreasing price, duplicate minQty`
  - `TierEditor sends Rials (Toman × 10) to API`
  - `variant dialog accepts Persian digits for price and stock`
  - `server TIER_INVALID errors map to the right row`
  - `ImagesTab shows IMAGE_INVALID for a rejected file and keeps uploading the others`
  - `reorder sends the new id order`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(admin): variant, volume tier and image management`

### Task 20: Inventory screen

**Files:**
- Create: `src/api/inventory.ts`, `src/features/inventory/{InventoryPage.tsx, MovementsDrawer.tsx}`
- Test: `src/features/inventory/InventoryPage.test.tsx`

**Interfaces:**
- Produces: a table with search and a low-stock toggle. Each row has an editable "adjust by" cell (signed number, Persian digits accepted). A sticky "Apply N changes" bar submits one batch with an optional shared note. A row's history icon opens `MovementsDrawer`. Low-stock rows are highlighted.

- [x] **Step 1: Write failing tests:**
  - `batch submits only non-zero deltas`
  - `STOCK_NEGATIVE error highlights the offending row and keeps the entered values`
  - `low-stock toggle sets lowStock=true`
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(admin): inventory screen with batch adjustments`

### Task 21: Staff and audit screens

**Files:**
- Create: `src/api/{staff.ts, audit.ts}`, `src/features/staff/{StaffPage.tsx, StaffDialog.tsx, PasswordDialog.tsx}`, `src/features/audit/{AuditPage.tsx, JsonDiff.tsx}`
- Test: `src/features/staff/StaffPage.test.tsx`, `src/features/audit/JsonDiff.test.tsx`

**Interfaces:**
- Produces:
  - The staff table offers create and edit (role, active, mobile, name) and reset password. A `LAST_OWNER` error is shown on the role/active field.
  - The audit page is a paged table filtered by entity type and staff member. Expanding a row shows `JsonDiff`.
  - `JsonDiff({before, after})` lists the changed top-level keys with old and new values.

- [x] **Step 1: Write failing tests:** `LAST_OWNER error shown on role field`, `JsonDiff lists only changed keys`, `audit dates render in Jalali for fa`.
- [x] **Step 2: Run** and confirm FAIL. **Step 3: Implement.** **Step 4: Run** and confirm PASS. **Step 5: Commit** `feat(admin): staff management and audit log screens`

## Part D — Dev stack and verification

### Task 22: Dev seed, Compose file, README, end-to-end manual check

**Files:**
- Create: `api/src/main/resources/db/dev/V1000__dev_seed.sql`, enabled only under the `dev` profile through `spring.flyway.locations=classpath:db/migration,classpath:db/dev` in `application-dev.yml`. It seeds 4 categories (پروتئین وی › ایزوله، کنسانتره; گینر; آمینو), 3 brands and 3 products with variants and tiers, but no images and no staff (the owner comes from bootstrap properties in `application-dev.yml`: `owner` / `ChangeMe12345` / `09120000000`).
- Create: `deploy/docker-compose.dev.yml` (`postgres:16` on 5432 with the volume `pgdata`, for machines with Docker), `README.md` (prerequisites; run the API with `./mvnw spring-boot:test-run`; run the admin with `npm run dev`; where the dev SMS codes appear in the API log; how to run the tests).
- Test: `DevSeedTest extends IntegrationTest` with `@ActiveProfiles({"test","dev"})`, which asserts that the seeded counts load and every seeded tier passes `TierPricing.validate`.

- [x] **Step 1: Write the failing test.** **Step 2: Run** it and confirm FAIL. **Step 3: Write the seed.** **Step 4: Run** it and confirm PASS.
- [x] **Step 5: Run the full suites:** `cd api && ./mvnw -q verify` → BUILD SUCCESS; `cd admin && npx vitest run && npx tsc -b && npx vite build` → all pass.
- [x] **Step 6: Manual check in the browser** (both servers running). Go through these steps in Persian, then switch to English and spot-check that the layout flips to LTR:
  1. Log in as `owner`, taking the code from the API log.
  2. Create a category.
  3. Create a brand and upload its logo.
  4. Create a product, add a variant with price `۱٬۲۰۰٬۰۰۰` Toman and stock `۲۰`, and add a tier of 10 units at 1,100,000 Toman.
  5. Upload two images and reorder them.
  6. Publish the product.
  7. Adjust the stock by −5 and check the movement history.
  8. Create a PRODUCT_MANAGER, log in as them, and confirm that Staff and Audit are hidden and `/staff` shows "no access".
  9. Check that the audit log shows these actions.
- [x] **Step 7: Commit** `chore: dev seed data, compose file and README`
