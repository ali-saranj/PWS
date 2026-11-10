# Spec Delta: catalog/brands

## MODIFIED Requirements

### Requirement: Dynamic Brand Directory Page
The storefront MUST render a responsive brand directory page at `/brands` displaying all active brands with logos, names, and search filtering, linking directly to the filtered products screen.

#### Scenario: Directory displays active brands
- **WHEN** a user navigates to `/brands`
- **THEN** all active partner brands are displayed in a responsive grid featuring brand logo images (with monogram fallback), Persian names, English names, and links directly targeting the dedicated Products screen at `/products?brandId={id}`.

#### Scenario: Real-time search filtering in directory
- **WHEN** a user enters text in the brand directory search input
- **THEN** the brand grid instantly filters to only show brands whose Persian or English name matches the search term.

### Requirement: Dedicated Brand Showcase Page
The storefront MUST direct brand navigation directly to the dedicated Products catalog screen at `/products` with the clicked brand filter pre-applied, and MUST redirect legacy brand routes.

#### Scenario: Brand showcase header and products rendered
- **WHEN** a user navigates to `/products?brandId={id}` (or `brandSlug={slug}`)
- **THEN** the Products screen opens directly with the specified brand pre-selected in the filter sidebar and displays only products belonging to that brand.

#### Scenario: Interactive filtering and sorting on brand page
- **WHEN** a user navigates to `/brands/{slug}` for an existing brand
- **THEN** the storefront issues an HTTP 308 redirect to `/products?brandSlug={slug}` (or `/products?brandId={id}`).

#### Scenario: Non-existent brand navigation
- **WHEN** a user navigates to `/brands/{slug}` for an invalid or non-existent brand slug
- **THEN** the page renders a 404 not found page.
