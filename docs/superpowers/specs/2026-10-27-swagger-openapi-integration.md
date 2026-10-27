# Swagger / OpenAPI Integration Specification

## Overview

Integrate Swagger UI and OpenAPI 3 into the Spring Boot backend (`api/`). This provides an interactive documentation and testing portal for all clients—frontend developers, admin backoffice developers, third-party integrations, and QA—to explore schemas, execute requests, and test both public and protected endpoints.

## Goals

1. **Unified Interactive UI:** Expose Swagger UI at `/swagger-ui.html` (redirecting to `/swagger-ui/index.html`) displaying all endpoints across the system in a single merged view.
2. **OpenAPI 3.0 Contract:** Provide standard OpenAPI JSON documentation at `/v3/api-docs`.
3. **Public Access:** Ensure Swagger UI and OpenAPI JSON endpoints are accessible without authentication or CSRF restrictions.
4. **Interactive Authorization (Bearer Token):** Configure the OpenAPI security scheme (`bearerAuth` HTTP Bearer JWT) so testers can authenticate directly within Swagger UI using the "Authorize" button.
5. **Dual Auth Support in Security Filters:** Update `StaffJwtCookieFilter` and `CustomerJwtCookieFilter` to accept `Authorization: Bearer <token>` headers in addition to their existing HTTP-only cookies (`pws_admin_at` and `pws_shop_at`), enabling seamless testing in Swagger UI, Postman, and automated API runners while preserving full cookie-based browser security.

## Non-Goals & Anti-Goals

- **Non-Goals:**
  - Generating client code from OpenAPI specs as part of the build (can be added later if needed).
  - Splitting the API into separate versioned OpenAPI groups (all endpoints remain merged in one documentation view).
- **Anti-Goals:**
  - Exposing internal actuator management endpoints inside the business API documentation unless explicitly desired.
  - Altering production cookie lifetimes or cookie security properties.

## Architecture & Technical Decisions

### 1. SpringDoc OpenAPI Starter

Add `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5` to `api/pom.xml`.
- Compatible with Spring Boot 3.5.x and Java 17.
- Automatically serves Swagger UI and scans Spring `@RestController` classes.

### 2. OpenAPI Configuration Bean (`ir.pws.store.config.OpenApiConfig`)

- Configure global `OpenAPI` metadata:
  - Title: `Protein Web Store (PWS) API`
  - Description: `Unified REST API documentation for PWS: Storefront Public Catalog, Customer Auth, Orders, Checkout, and Staff Admin Backoffice.`
  - Version: `1.0.0`
- Define Security Scheme:
  - Scheme Name: `BearerAuth`
  - Type: `SecurityScheme.Type.HTTP`
  - Scheme: `bearer`
  - BearerFormat: `JWT`
  - Description: `Enter JWT access token. Applies to staff (/api/admin/**) and customer (/api/shop/**) protected endpoints.`
- Global Security Requirement: Add `BearerAuth` to OpenAPI specification so secured endpoints display the lock icon.

### 3. Spring Security & CSRF Updates (`SecurityConfig.java`)

- Permit unauthenticated access to Swagger UI and OpenAPI paths:
  - `/swagger-ui.html`
  - `/swagger-ui/**`
  - `/v3/api-docs/**`
- Exempt `/swagger-ui/**` and `/v3/api-docs/**` from CSRF protection in `CookieCsrfTokenRepository` configuration.
- **CSRF Exemption for Bearer Requests (Builder Call):** Requests carrying a valid `Authorization: Bearer <token>` header are exempted from CSRF validation across all endpoints (including `/api/admin/**`). CSRF protection exists solely to prevent ambient credential (cookie) exploitation; custom headers like `Authorization` cannot be injected in cross-origin simple requests. Cookie-based browser sessions without a Bearer header continue to strictly enforce CSRF token checks.

### 4. Token Exposure in Verification Responses

- In both `StaffAuthController` (`/api/admin/auth/verify`, `/refresh`) and `ShopAuthController` (`/api/shop/auth/verify`, `/refresh`):
  - In addition to setting the `HttpOnly` cookie, include the JWT `token` in the returned JSON body (`StaffMe` and `CustomerDto`).
  - Maintain backward compatibility by keeping existing constructors and defaulting `token` to `null` on `/me` endpoints.
  - This allows developers and testers using Swagger UI to immediately copy the token from the response payload and paste it into the "Authorize" modal.

### 5. Dual Authentication in Filters

- **`StaffJwtCookieFilter` (`/api/admin/**`):**
  - First check the `Authorization` header for `Bearer <token>`.
  - If present and valid according to `jwt.parseStaffAccess(token)`, authenticate the request with `ROLE_<role>`.
  - Otherwise fallback to checking the `pws_admin_at` cookie as before.
- **`CustomerJwtCookieFilter` (`/api/shop/**`):**
  - First check the `Authorization` header for `Bearer <token>`.
  - If present and valid according to `jwt.parseCustomerAccess(token)`, authenticate the request with `ROLE_CUSTOMER`.
  - Otherwise fallback to checking the `pws_shop_at` cookie as before.

## Test & Verification Criteria

1. **OpenAPI Spec Test:** `GET /v3/api-docs` returns HTTP 200 with `application/json` containing OpenAPI 3.0 schema definitions, endpoints (`/api/shop/catalog/products`, `/api/admin/products`, etc.), and `BearerAuth` security scheme.
2. **Swagger UI Test:** `GET /swagger-ui/index.html` returns HTTP 200 with HTML content.
3. **Bearer Token Authentication Tests:**
   - Calling `/api/admin/catalog/products` with `Authorization: Bearer <valid-staff-jwt>` succeeds (HTTP 200).
   - Calling `/api/shop/auth/me` with `Authorization: Bearer <valid-customer-jwt>` succeeds (HTTP 200).
   - Existing cookie authentication continues to work unchanged.
