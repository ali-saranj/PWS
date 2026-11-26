# Spec Delta

## MODIFIED Requirements

### Requirement: Public Category Listing
The public catalog API MUST return all active categories with their ID, Persian name, English name, URL slug, parent ID, sort order, and optional SEO metadata fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`).

#### Scenario: Listing active categories
- **WHEN** a client issues `GET /api/shop/catalog/categories`
- **THEN** the response is an array of active categories where each item contains `id`, `nameFa`, `nameEn`, `slug`, `parentId`, `sortOrder`, and optional `seoTitle`, `seoDescription`, `seoH1`, and `seoContentFa`, ordered by `sortOrder` ASC and `id` ASC.

#### Scenario: Inactive categories excluded
- **WHEN** a category has `active = false`
- **THEN** it does not appear in the public categories list.

### Requirement: Public Category Details by Slug
The public catalog API MUST provide an endpoint to retrieve a single active category by its URL slug, including its ancestor breadcrumb path, direct active children, and optional SEO metadata fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`).

#### Scenario: Successful category lookup by slug
- **WHEN** a client issues `GET /api/shop/catalog/categories/{slug}` with an existing, active category slug
- **THEN** the system returns HTTP 200 with the category's details (including optional `seoTitle`, `seoDescription`, `seoH1`, and `seoContentFa`), an ordered list of ancestor `breadcrumbs` (root to current), and an array of immediate active `subcategories`.

#### Scenario: Non-existent or inactive category lookup
- **WHEN** a client issues `GET /api/shop/catalog/categories/{slug}` with a non-existent or inactive category slug
- **THEN** the system returns HTTP 404 with RFC 7807 problem details and error code `NOT_FOUND`.

## ADDED Requirements

### Requirement: Admin Category SEO Management
The staff admin API and back-office category dialog MUST allow authorized catalog staff to view and edit optional SEO fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`) when creating or updating a category, and MUST record audit logs on mutation.

#### Scenario: Creating or updating category with SEO fields
- **WHEN** an authorized catalog user submits a category create or update request with `seoTitle`, `seoDescription`, `seoH1`, or `seoContentFa`
- **THEN** the system persists the trimmed values (storing blank strings as `null`), returns them in the admin category response, and records an audit log entry.
