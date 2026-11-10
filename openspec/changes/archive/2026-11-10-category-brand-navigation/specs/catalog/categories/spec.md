# Spec Delta: catalog/categories

## MODIFIED Requirements

### Requirement: Dynamic Categories Directory Page
The storefront MUST render a responsive catalog directory page at `/categories` displaying all active categories grouped by parent-child hierarchy, linking directly to the filtered products screen.

#### Scenario: Directory displays active categories and subcategories
- **WHEN** a user navigates to `/categories`
- **THEN** all root categories and their immediate subcategories are rendered in responsive cards with navigation links targeting the dedicated Products screen at `/products?categoryId={id}`.

### Requirement: Category Products Showcase Page with Filtering
The storefront MUST direct category navigation directly to the dedicated Products catalog screen at `/products` with the clicked category filter pre-applied, and MUST redirect legacy category routes.

#### Scenario: Category header and products rendered
- **WHEN** a user navigates to `/products?categoryId={id}` (or `categorySlug={slug}`)
- **THEN** the Products screen opens directly with the specified category pre-selected in the filter sidebar and displays only products belonging to that category or its descendants.

#### Scenario: URL search parameter filtering and sorting
- **WHEN** a user navigates to `/category/{slug}` for an existing category
- **THEN** the storefront issues an HTTP 308 redirect to `/products?categorySlug={slug}` (or `/products?categoryId={id}`).

#### Scenario: Invalid category slug renders 404
- **WHEN** a user navigates to `/category/{slug}` with an unknown or inactive category slug
- **THEN** the storefront triggers Next.js `notFound()` to display the Persian 404 error page.
