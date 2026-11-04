# Spec Delta

## Purpose
Enables public brand discovery, brand metadata resolution by slug with logo URLs, interactive brand directory browsing, and dedicated brand showcase catalog pages with faceted filtering and sorting.

## ADDED Requirements

### Requirement: Public Brand Listing with Logos
The public catalog API MUST return all active brands with their ID, Persian name, English name, URL slug, and fully qualified or media-relative logo URL.

#### Scenario: Listing active brands includes logo URLs
- **WHEN** a client issues `GET /api/shop/catalog/brands`
- **THEN** the response is an array of active brands where each brand contains `id`, `nameFa`, `nameEn`, `slug`, and `logoUrl` (null if no logo was uploaded).

#### Scenario: Inactive brands excluded
- **WHEN** a brand has `active = false`
- **THEN** it does not appear in the public brands list.

### Requirement: Public Brand Retrieval by Slug
The public catalog API MUST provide an endpoint to retrieve a single active brand by its URL slug.

#### Scenario: Successful brand lookup by slug
- **WHEN** a client issues `GET /api/shop/catalog/brands/{slug}` with an existing, active brand slug
- **THEN** the system returns HTTP 200 with the brand's `PublicBrandDto` containing `id`, `nameFa`, `nameEn`, `slug`, and `logoUrl`.

#### Scenario: Non-existent or inactive brand lookup
- **WHEN** a client issues `GET /api/shop/catalog/brands/{slug}` with a non-existent or inactive brand slug
- **THEN** the system returns HTTP 404 with RFC 7807 problem details and error code `BRAND_NOT_FOUND`.

### Requirement: Dynamic Brand Directory Page
The storefront MUST render a responsive brand directory page at `/brands` displaying all active brands with logos, names, and search filtering.

#### Scenario: Directory displays active brands
- **WHEN** a user navigates to `/brands`
- **THEN** all active partner brands are displayed in a responsive grid featuring brand logo images (with monogram fallback), Persian names, English names, and links to each brand's showcase page (`/brands/{slug}`).

#### Scenario: Real-time search filtering in directory
- **WHEN** a user enters text in the brand directory search input
- **THEN** the brand grid instantly filters to only show brands whose Persian or English name matches the search term.

### Requirement: Dedicated Brand Showcase Page
The storefront MUST render a dedicated brand page at `/brands/[slug]` featuring brand branding and a brand-filtered product catalog.

#### Scenario: Brand showcase header and products rendered
- **WHEN** a user navigates to `/brands/{slug}` for an existing brand
- **THEN** the page displays breadcrumbs (`صفحه اصلی / برندها / [نام برند]`), brand header (logo, Persian name, English badge), and a grid of products belonging to that brand.

#### Scenario: Interactive filtering and sorting on brand page
- **WHEN** a user selects category filters, toggles in-stock products, or changes sort order on `/brands/{slug}`
- **THEN** the product listing updates to reflect only products from that brand matching the active filter criteria.

#### Scenario: Non-existent brand navigation
- **WHEN** a user navigates to `/brands/{slug}` for an invalid or non-existent brand slug
- **THEN** the page renders a 404 not found page.
