# Swagger / OpenAPI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Swagger UI (OpenAPI 3) into the Spring Boot backend (`api/`), exposing interactive unified documentation for all endpoints, permitting documentation routes publicly, exempting Bearer token requests from CSRF, supporting dual header/cookie JWT authentication, and exposing tokens in login verification responses.

**Architecture:** Add `springdoc-openapi-starter-webmvc-ui` to `api/pom.xml`, configure a custom `OpenAPI` bean in `OpenApiConfig.java` with metadata and `BearerAuth` security scheme, permit Swagger routes in `SecurityConfig.java` while exempting Bearer requests from CSRF, enhance `StaffJwtCookieFilter` and `CustomerJwtCookieFilter` to parse `Authorization: Bearer <token>` before cookies, and include `token` in `StaffMe` and `CustomerDto` for verify/refresh endpoints.

**Tech Stack:** Spring Boot 3.5 (Java 17), `springdoc-openapi-starter-webmvc-ui` (v2.8.5), Spring Security, JJWT, MockMvc, Zonky Embedded PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-10-27-swagger-openapi-integration.md`

## Global Constraints

- Spring Boot parent: 3.5.16; Java 17.
- SpringDoc starter version: `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5`.
- OpenAPI specification version: 3.0; single unified view covering all controllers in `ir.pws.store.*`.
- Public documentation paths: `/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`.
- Dual Authentication: `Authorization: Bearer <token>` header checked first; cookie fallback (`pws_admin_at` / `pws_shop_at`).
- CSRF: Requests with `Authorization: Bearer ...` header exempted across all endpoints; cookie-only requests strictly enforce CSRF.
- Verification & Testing: All tests run with `./mvnw test`.

## Review Focus

1. **Public OpenAPI Spec Unauthenticated:** Calling `GET /v3/api-docs` returns 200 JSON without credentials or CSRF token.
2. **Public Swagger UI Unauthenticated:** Calling `GET /swagger-ui/index.html` returns 200 HTML without credentials or CSRF token.
3. **Bearer Token Mutating Requests Bypass CSRF:** Calling mutating admin endpoints (`POST`/`PUT`/`DELETE`) with `Authorization: Bearer <valid-staff-jwt>` succeeds without requiring `X-XSRF-TOKEN` or 403 CSRF error.
4. **Resilient Dual Auth Fallback:** Supplying an empty or invalid `Authorization` header falls back safely to reading the session cookie without unhandled exceptions.
5. **Token Returned in Verification Response:** Calling `POST /api/admin/auth/verify` and `POST /api/shop/auth/verify` returns the access token in the JSON body (`token`) in addition to setting `HttpOnly` cookies.

---

### Task 1: Add SpringDoc Dependency & OpenApiConfig

**Files:**
- Modify: `api/pom.xml`
- Create: `api/src/main/java/ir/pws/store/config/OpenApiConfig.java`
- Modify: `api/src/main/resources/application.properties` (or yaml, if configured)

**Interfaces:**
- Produces: `OpenApiConfig` declaring `@Bean public OpenAPI customOpenAPI()` with `Info` (Title: `Protein Web Store (PWS) API`, Version: `1.0.0`, Description) and `BearerAuth` `SecurityScheme`.

- [ ] **Step 1: Add SpringDoc OpenAPI starter dependency in `api/pom.xml`**

In `<dependencies>` of `api/pom.xml`, add:
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.5</version>
</dependency>
```

- [ ] **Step 2: Create `OpenApiConfig.java` in `ir.pws.store.config`**

Create `api/src/main/java/ir/pws/store/config/OpenApiConfig.java`:
```java
package ir.pws.store.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Protein Web Store (PWS) API")
                        .version("1.0.0")
                        .description("Unified REST API documentation for PWS: Storefront Public Catalog, Customer Auth, Orders, Checkout, and Staff Admin Backoffice."))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT access token (for staff /api/admin/** or customer /api/shop/**).")));
    }
}
```

- [ ] **Step 3: Verify build compilation**

Run: `./mvnw compile -pl api`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add api/pom.xml api/src/main/java/ir/pws/store/config/OpenApiConfig.java
git commit -m "feat(api): add springdoc-openapi dependency and OpenApiConfig"
```

---

### Task 2: Permit Swagger Paths & Exempt Bearer Requests from CSRF in `SecurityConfig`

**Files:**
- Modify: `api/src/main/java/ir/pws/store/common/security/SecurityConfig.java`

**Interfaces:**
- Consumes: `HttpSecurity` authorization and CSRF configuration DSL.
- Produces: Public access to `/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`; CSRF exemption for Swagger paths and any request with `Authorization: Bearer <token>`.

- [ ] **Step 1: Write test in `OpenApiIntegrationTest.java` verifying unauthenticated access to Swagger & OpenAPI**

Create `api/src/test/java/ir/pws/store/OpenApiIntegrationTest.java`:
```java
package ir.pws.store;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void openApiDocs_isAccessiblePublicly() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").value(org.hamcrest.Matchers.startsWith("3.")))
                .andExpect(jsonPath("$.info.title").value("Protein Web Store (PWS) API"))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth").exists());
    }

    @Test
    void swaggerUi_isAccessiblePublicly() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
```

- [ ] **Step 2: Run test to observe failure or security block**

Run: `./mvnw test -Dtest=OpenApiIntegrationTest`
Expected: FAIL (401 or 403 because `/v3/api-docs` and `/swagger-ui/index.html` are blocked by `.anyRequest().denyAll()`).

- [ ] **Step 3: Update `SecurityConfig.java` to permit paths and configure CSRF exemption**

In `api/src/main/java/ir/pws/store/common/security/SecurityConfig.java`:
1. In `csrf(...)`:
   ```java
   .csrf(c -> c.csrfTokenRepository(csrfRepository)
           .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
           .ignoringRequestMatchers("/api/shop/**", "/swagger-ui/**", "/v3/api-docs/**")
           .ignoringRequestMatchers(request -> {
               String auth = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
               return auth != null && auth.startsWith("Bearer ");
           }))
   ```
2. In `authorizeHttpRequests(a -> ...)`:
   Add before `requestMatchers(HttpMethod.GET, "/media/**")`:
   ```java
   .requestMatchers(
           "/swagger-ui.html",
           "/swagger-ui/**",
           "/v3/api-docs",
           "/v3/api-docs/**")
   .permitAll()
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `./mvnw test -Dtest=OpenApiIntegrationTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/main/java/ir/pws/store/common/security/SecurityConfig.java api/src/test/java/ir/pws/store/OpenApiIntegrationTest.java
git commit -m "feat(api): permit OpenAPI/Swagger paths and exempt Bearer requests from CSRF"
```

---

### Task 3: Dual Authentication in `StaffJwtCookieFilter` and `CustomerJwtCookieFilter`

**Files:**
- Modify: `api/src/main/java/ir/pws/store/common/security/StaffJwtCookieFilter.java`
- Modify: `api/src/main/java/ir/pws/store/common/security/CustomerJwtCookieFilter.java`
- Test: `api/src/test/java/ir/pws/store/OpenApiIntegrationTest.java`

**Interfaces:**
- Consumes: `request.getHeader(HttpHeaders.AUTHORIZATION)` and existing `JwtService`.
- Produces: `SecurityContextHolder` authentication populated when either valid `Authorization: Bearer <token>` or valid cookie is present.

- [ ] **Step 1: Add Bearer authentication tests in `OpenApiIntegrationTest.java`**

Add tests to `OpenApiIntegrationTest`:
1. `adminEndpoint_withBearerToken_authenticatesSuccessfully()`: calling `GET /api/admin/auth/me` with `Authorization: Bearer <validStaffToken>` returns 200.
2. `adminEndpoint_withBearerToken_bypassesCsrf()`: calling mutating `POST /api/admin/catalog/categories` with `Authorization: Bearer <validStaffToken>` does not fail with 403 CSRF.
3. `shopEndpoint_withBearerToken_authenticatesSuccessfully()`: calling `GET /api/shop/auth/me` with `Authorization: Bearer <validCustomerToken>` returns 200.

- [ ] **Step 2: Run test to verify failure**

Run: `./mvnw test -Dtest=OpenApiIntegrationTest`
Expected: FAIL (Bearer auth returns 401 because filters only inspect cookies).

- [ ] **Step 3: Update `StaffJwtCookieFilter.java` to support Bearer header with cookie fallback**

In `api/src/main/java/ir/pws/store/common/security/StaffJwtCookieFilter.java`:
```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
    String token = resolveToken(request, AuthCookies.STAFF_ACCESS);
    if (token != null && !token.isBlank()) {
        jwt.parseStaffAccess(token).ifPresent(p -> {
            var auth = UsernamePasswordAuthenticationToken.authenticated(
                    p, null, List.of(new SimpleGrantedAuthority("ROLE_" + p.role().name())));
            SecurityContextHolder.getContext().setAuthentication(auth);
        });
    }
    chain.doFilter(request, response);
}

private String resolveToken(HttpServletRequest request, String cookieName) {
    String auth = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
    if (auth != null && auth.startsWith("Bearer ")) {
        String bearer = auth.substring(7).trim();
        if (!bearer.isEmpty()) {
            return bearer;
        }
    }
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
    }
    return null;
}
```

- [ ] **Step 4: Update `CustomerJwtCookieFilter.java` to support Bearer header with cookie fallback**

In `api/src/main/java/ir/pws/store/common/security/CustomerJwtCookieFilter.java`:
Apply the same `resolveToken(request, AuthCookies.CUSTOMER_ACCESS)` logic.

- [ ] **Step 5: Run tests to verify they pass**

Run: `./mvnw test -Dtest=OpenApiIntegrationTest,StaffSecurityTest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/main/java/ir/pws/store/common/security/StaffJwtCookieFilter.java \
        api/src/main/java/ir/pws/store/common/security/CustomerJwtCookieFilter.java \
        api/src/test/java/ir/pws/store/OpenApiIntegrationTest.java
git commit -m "feat(security): support Authorization Bearer token header in staff and customer filters"
```

---

### Task 4: Expose Token in Auth Verification & Refresh Responses

**Files:**
- Modify: `api/src/main/java/ir/pws/store/staff/dto/StaffMe.java`
- Modify: `api/src/main/java/ir/pws/store/customer/dto/CustomerDto.java`
- Modify: `api/src/main/java/ir/pws/store/staff/StaffAuthController.java`
- Modify: `api/src/main/java/ir/pws/store/customer/ShopAuthController.java`
- Test: `api/src/test/java/ir/pws/store/staff/StaffAuthControllerTest.java` (or equivalent auth tests)

**Interfaces:**
- Produces: `StaffMe` with `token` field; `CustomerDto` with `token` field.

- [ ] **Step 1: Write test asserting token presence in verification responses**

Add test cases in `OpenApiIntegrationTest.java`:
1. Verify staff verify/refresh returns `token` matching the session access token.
2. Verify customer verify/refresh returns `token` matching the session access token.

- [ ] **Step 2: Update `StaffMe.java`**

In `api/src/main/java/ir/pws/store/staff/dto/StaffMe.java`:
```java
public record StaffMe(long id, String username, String fullName, StaffRole role, String token) {

    public StaffMe(long id, String username, String fullName, StaffRole role) {
        this(id, username, fullName, role, null);
    }

    public static StaffMe from(StaffUser user) {
        return new StaffMe(user.getId(), user.getUsername(), user.getFullName(), user.getRole(), null);
    }

    public static StaffMe from(StaffUser user, String token) {
        return new StaffMe(user.getId(), user.getUsername(), user.getFullName(), user.getRole(), token);
    }
}
```

- [ ] **Step 3: Update `CustomerDto.java`**

In `api/src/main/java/ir/pws/store/customer/dto/CustomerDto.java`:
```java
public record CustomerDto(Long id, String mobile, String firstName, String lastName, String email, String token) {

    public CustomerDto(Long id, String mobile, String firstName, String lastName) {
        this(id, mobile, firstName, lastName, null, null);
    }

    public CustomerDto(Long id, String mobile, String firstName, String lastName, String email) {
        this(id, mobile, firstName, lastName, email, null);
    }

    public static CustomerDto from(Customer c) {
        return new CustomerDto(c.getId(), c.getMobile(), c.getFirstName(), c.getLastName(), c.getEmail(), null);
    }

    public static CustomerDto from(Customer c, String token) {
        return new CustomerDto(c.getId(), c.getMobile(), c.getFirstName(), c.getLastName(), c.getEmail(), token);
    }
}
```

- [ ] **Step 4: Update `StaffAuthController.java` and `ShopAuthController.java`**

In `StaffAuthController.java`:
```java
private ResponseEntity<StaffMe> withSession(StaffAuthService.Session session) {
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookies.staffAccess(session.accessToken()).toString())
            .header(HttpHeaders.SET_COOKIE, cookies.staffRefresh(session.refreshToken()).toString())
            .body(StaffMe.from(session.user(), session.accessToken()));
}
```

In `ShopAuthController.java`:
```java
private ResponseEntity<CustomerDto> withSession(CustomerAuthService.Session session) {
    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookies.customerAccess(session.accessToken()).toString())
            .header(HttpHeaders.SET_COOKIE, cookies.customerRefresh(session.refreshToken()).toString())
            .body(CustomerDto.from(session.customer(), session.accessToken()));
}
```

- [ ] **Step 5: Run all backend tests to verify 100% pass rate**

Run: `./mvnw test`
Expected: PASS (All test suites green)

- [ ] **Step 6: Commit**

```bash
git add api/src/main/java/ir/pws/store/staff/dto/StaffMe.java \
        api/src/main/java/ir/pws/store/customer/dto/CustomerDto.java \
        api/src/main/java/ir/pws/store/staff/StaffAuthController.java \
        api/src/main/java/ir/pws/store/customer/ShopAuthController.java \
        api/src/test/java/ir/pws/store/OpenApiIntegrationTest.java
git commit -m "feat(auth): return access token in JSON body on staff and customer verify/refresh"
```

---

### Task 5: Full Suite Verification & Build Verification

**Files:**
- Test verification across whole workspace (`api` and `shop`).

- [ ] **Step 1: Run complete API test suite**

Run: `./mvnw test`
Expected: BUILD SUCCESS (All tests pass)

- [ ] **Step 2: Run complete storefront test suite**

Run: `cd shop && npm test -- --run`
Expected: PASS (All tests pass)

- [ ] **Step 3: Commit any final test adjustments**

```bash
git commit --allow-empty -m "chore: verify full test suites after Swagger and dual auth integration"
```
