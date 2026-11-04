# Proposal: Storefront Category Pages & Catalog Hierarchy

## Why

The storefront currently lacks real, dynamic category pages: [`/categories`](file:///Users/ali/Documents/PWS/shop/src/app/categories/page.tsx) renders a static hardcoded list of categories with mock product counts, and [`/category/[slug]`](file:///Users/ali/Documents/PWS/shop/src/app/category/[slug]/page.tsx) relies on client-side state, hardcoded fixtures, and invalid query parameters (`slug=${slug}`). Meanwhile, the backend API only exposes categories as a sub-field of `GET /api/shop/catalog/home` or via staff-only admin endpoints.

Implementing public category endpoints and server-rendered category pages allows customers to explore the full product taxonomy, navigate subcategories, and filter/sort products with URL-synchronized state and proper SEO metadata.

## What Changes

- **Backend Public Category API**:
  - Add `GET /api/shop/catalog/categories` returning all active categories with their IDs, names (`fa`/`en`), slugs, parent IDs, and sort order.
  - Add `GET /api/shop/catalog/categories/{slug}` returning category details, breadcrumb path (ancestors ordered from root to current), and immediate active subcategories.
- **Storefront Categories Directory (`/categories`)**:
  - Replace static mock data with a Next.js Server Component fetching all active categories from `/api/shop/catalog/categories`.
  - Display category cards grouped by hierarchy (root categories with direct subcategories).
- **Storefront Category Products Showcase (`/category/[slug]`)**:
  - Replace client-side mock fixtures with a Next.js Server Component that reads `params` (`slug`) and URL `searchParams` (`brand`, `inStock`, `onSale`, `minPrice`, `maxPrice`, `sort`, `page`).
  - Fetch category metadata and product page in parallel via `PublicCatalogService` / `/api/shop/catalog`.
  - Return HTTP 404 via Next.js `notFound()` when the category slug is invalid or inactive.
  - Support subcategory filter tabs/chips, active filter tags, sort dropdown, and pagination.

## Capabilities

### New Capabilities
- `catalog/categories`: Public category retrieval by list and slug, breadcrumb hierarchy resolution, storefront categories directory browsing, and server-rendered category product showcase with faceted filtering.

### Modified Capabilities
<!-- None: existing catalog/brands and catalog/initial-data specs remain intact without requirement alterations -->

## Impact

- **Backend (`api/`)**:
  - `ir.pws.store.catalog.PublicCatalogService`: add `listCategories()` and `getCategoryBySlug(String slug)`.
  - `ir.pws.store.catalog.PublicCatalogController`: expose `GET /api/shop/catalog/categories` and `GET /api/shop/catalog/categories/{slug}`.
  - Integration tests in `PublicCatalogIntegrationTest.java`.
- **Storefront (`shop/`)**:
  - `src/app/categories/page.tsx`: migrate to Server Component fetching dynamic categories.
  - `src/app/category/[slug]/page.tsx`: migrate to Server Component reading URL search parameters and fetching live products and category info.
  - `src/app/category/[slug]/CategoryPage.test.tsx`: update Vitest suite to verify SSR and filtering behavior.
