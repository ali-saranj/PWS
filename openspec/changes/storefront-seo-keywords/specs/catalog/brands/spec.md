# Spec Delta

## MODIFIED Requirements

### Requirement: Public Brand Listing with Logos
The public catalog API MUST return all active brands with their ID, Persian name, English name, URL slug, fully qualified or media-relative logo URL, and optional SEO metadata fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`).

#### Scenario: Listing active brands includes logo URLs
- **WHEN** a client issues `GET /api/shop/catalog/brands`
- **THEN** the response is an array of active brands where each brand contains `id`, `nameFa`, `nameEn`, `slug`, `logoUrl` (null if no logo was uploaded), and optional `seoTitle`, `seoDescription`, `seoH1`, and `seoContentFa`.

#### Scenario: Inactive brands excluded
- **WHEN** a brand has `active = false`
- **THEN** it does not appear in the public brands list.

### Requirement: Public Brand Retrieval by Slug
The public catalog API MUST provide an endpoint to retrieve a single active brand by its URL slug, including optional SEO metadata fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`).

#### Scenario: Successful brand lookup by slug
- **WHEN** a client issues `GET /api/shop/catalog/brands/{slug}` with an existing, active brand slug
- **THEN** the system returns HTTP 200 with the brand's `PublicBrandDto` containing `id`, `nameFa`, `nameEn`, `slug`, `logoUrl`, and optional `seoTitle`, `seoDescription`, `seoH1`, and `seoContentFa`.

#### Scenario: Non-existent or inactive brand lookup
- **WHEN** a client issues `GET /api/shop/catalog/brands/{slug}` with a non-existent or inactive brand slug
- **THEN** the system returns HTTP 404 with RFC 7807 problem details and error code `BRAND_NOT_FOUND`.

## ADDED Requirements

### Requirement: Admin Brand SEO Management
The staff admin API and back-office brand dialog MUST allow authorized catalog staff to view and edit optional SEO fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`) when creating or updating a brand, and MUST record audit logs on mutation.

#### Scenario: Creating or updating brand with SEO fields
- **WHEN** an authorized catalog user submits a brand create or update request with `seoTitle`, `seoDescription`, `seoH1`, or `seoContentFa`
- **THEN** the system persists the trimmed values (storing blank strings as `null`), returns them in the admin brand response, and records an audit log entry.
