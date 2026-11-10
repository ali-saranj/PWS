# Design

## Context

See `proposal.md` for motivation.
The customer storefront (`shop/`) currently provides a centralized catalog page at `/products` (`shop/src/app/products/page.tsx`), which already accepts `categoryId`, `categorySlug`, `brandId`, and `brandSlug` as URL search parameters, queries the backend `/api/shop/catalog/products` endpoint, and initializes `CatalogFilters` and `FilterSidebar`. However, entry points throughout the storefront currently link to separate showcase routes (`/category/[slug]` and `/brands/[slug]`).

## Goals / Non-Goals

**Goals:**
- Consolidate all category and brand customer navigation to the unified Products screen (`/products`) with query parameters.
- Ensure that clicking on a category pre-selects the category in `FilterSidebar` and filters the product listing accordingly.
- Ensure that clicking on a brand pre-selects the brand in `FilterSidebar` and filters the product listing accordingly.
- Redirect legacy `/category/[slug]` and `/brands/[slug]` routes to `/products` with the corresponding query parameter so customers never see a separate detail page.

**Non-Goals:**
- Changes to the staff back-office (`admin/`) navigation or routes.
- Backend API schema changes (the existing `PublicCatalogController` endpoints already support filtering by `categoryId`, `categorySlug`, `brandId`, `brandSlug`, and `brandIds`).
- Removing the public category/brand metadata endpoints (`/api/shop/catalog/categories` and `/api/shop/catalog/brands`).

## Decisions

### 1. Unified Navigation via Query Parameters on `/products`
- **Choice**: Direct navigation targeting `/products?categoryId={id}` (or `?categorySlug={slug}`) and `/products?brandId={id}` (or `?brandSlug={slug}`).
- **Rationale**: The `/products` screen is already designed for full faceted search, pagination, price range filters, and stock toggles. Using query parameters allows customers to fluidly add further filters without losing context.
- **Alternatives Considered**:
  - *Dedicated sub-routes (`/products/category/[slug]` and `/products/brand/[slug]`)*: Adds unnecessary route nesting and route duplication in Next.js App Router for views that share the exact same UI and filter controls.

### 2. Dual Support for Numeric ID and Slug
- **Choice**: Links throughout the app will pass the category or brand ID or slug (e.g., `categoryId={cat.id}` and `brandId={brand.id}`), while the `/products` page continues to support both numeric and slug-based filters.
- **Rationale**: `FilterSidebar` uses numeric IDs internally for tree and checkbox matching. Supporting both ensures that manual URLs or redirects using slugs still resolve correctly.

### 3. Server-Side Redirection for Legacy Showcase Pages
- **Choice**: Replace the showcase UI in `shop/src/app/category/[slug]/page.tsx` and `shop/src/app/brands/[slug]/page.tsx` with Next.js `redirect()` to `/products?categorySlug={slug}` and `/products?brandSlug={slug}` respectively.
- **Rationale**: Satisfies the explicit requirement: *"Important: Do not open a separate category or brand detail screen."* This cleanly handles bookmarks, direct URL access, and crawler indexing.

## Risks / Trade-offs

- **[Risk] Existing Tests Expect Showcase Components** → **Mitigation**: Update unit tests for `CategoriesPage`, `BrandsDirectory`, and `CategoryPage` to verify the new link destinations and redirection behavior.
- **[Risk] Category Hierarchy Filtering** → **Mitigation**: Backend `/api/shop/catalog/products` already handles subcategory inclusion when parent `categoryId` or `categorySlug` is provided.
