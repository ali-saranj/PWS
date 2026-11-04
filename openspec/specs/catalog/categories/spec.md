# catalog/categories Specification

## Purpose
Enables public category discovery, hierarchical category tree navigation, breadcrumb resolution by slug, and dynamic storefront category pages with faceted filtering and sorting.

## Requirements

### Requirement: Public Category Listing
The public catalog API MUST return all active categories with their ID, Persian name, English name, URL slug, parent ID, and sort order.

#### Scenario: Listing active categories
- **WHEN** a client issues `GET /api/shop/catalog/categories`
- **THEN** the response is an array of active categories where each item contains `id`, `nameFa`, `nameEn`, `slug`, `parentId`, and `sortOrder`, ordered by `sortOrder` ASC and `id` ASC.

#### Scenario: Inactive categories excluded
- **WHEN** a category has `active = false`
- **THEN** it does not appear in the public categories list.

### Requirement: Public Category Details by Slug
The public catalog API MUST provide an endpoint to retrieve a single active category by its URL slug, including its ancestor breadcrumb path and direct active children.

#### Scenario: Successful category lookup by slug
- **WHEN** a client issues `GET /api/shop/catalog/categories/{slug}` with an existing, active category slug
- **THEN** the system returns HTTP 200 with the category's details, an ordered list of ancestor `breadcrumbs` (root to current), and an array of immediate active `subcategories`.

#### Scenario: Non-existent or inactive category lookup
- **WHEN** a client issues `GET /api/shop/catalog/categories/{slug}` with a non-existent or inactive category slug
- **THEN** the system returns HTTP 404 with RFC 7807 problem details and error code `NOT_FOUND`.

### Requirement: Dynamic Categories Directory Page
The storefront MUST render a responsive catalog directory page at `/categories` displaying all active categories grouped by parent-child hierarchy.

#### Scenario: Directory displays active categories and subcategories
- **WHEN** a user navigates to `/categories`
- **THEN** all root categories and their immediate subcategories are rendered in responsive cards with navigation links to `/category/{slug}`.

### Requirement: Category Products Showcase Page with Filtering
The storefront MUST render a dedicated category page at `/category/[slug]` with category breadcrumbs, subcategory pills, and a filtered product grid driven by URL search parameters.

#### Scenario: Category header and products rendered
- **WHEN** a user navigates to `/category/{slug}` for an existing category
- **THEN** the page displays the category Persian name, breadcrumbs, subcategory navigation chips, and a grid of products belonging to that category or its descendants.

#### Scenario: URL search parameter filtering and sorting
- **WHEN** a user selects a brand, price range, stock toggle, or sort option on `/category/{slug}`
- **THEN** the URL updates its query parameters and the product grid reflects the filtered results.

#### Scenario: Invalid category slug renders 404
- **WHEN** a user navigates to `/category/{slug}` with an unknown or inactive category slug
- **THEN** the storefront triggers Next.js `notFound()` to display the Persian 404 error page.
