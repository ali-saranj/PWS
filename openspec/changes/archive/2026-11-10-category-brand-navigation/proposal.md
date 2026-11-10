# Proposal

## Why

Currently, clicking on a category or brand navigates the customer to separate showcase pages (`/category/[slug]` and `/brands/[slug]`). This fragments the browsing experience and duplicates filtering functionality across multiple showcase views instead of concentrating it into the storefront's unified catalog screen (`/products`). By consolidating navigation into the dedicated `/products` catalog screen with pre-applied category and brand filters, customers can explore products directly with full filtering, sorting, and pagination capabilities.

## What Changes

- **Direct Products Navigation for Categories**:
  - Clicking on any category in the Categories Directory (`/categories`), Home Category Circles, or Promo Tiles navigates directly to `/products?categoryId={id}` (or `categorySlug`).
  - Pre-applies and highlights the selected category in the `FilterSidebar` on `/products`.
  - Displays only products matching the selected category.
- **Direct Products Navigation for Brands**:
  - Clicking on any brand in the Brands Directory (`/brands`) or on product brand badges navigates directly to `/products?brandId={id}` (or `brandSlug`).
  - Pre-applies and selects the corresponding brand filter in the `FilterSidebar` on `/products`.
  - Displays only products matching the selected brand.
- **Legacy Showcase Route Redirection**:
  - Direct navigation to `/category/[slug]` redirects (HTTP 308) to `/products?categoryId={id}` (or `categorySlug={slug}`).
  - Direct navigation to `/brands/[slug]` redirects (HTTP 308) to `/products?brandId={id}` (or `brandSlug={slug}`).
  - Prevents opening separate category or brand detail screens.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `catalog/categories`: Update category navigation requirements so category selection navigates directly to `/products` with pre-applied category filter rather than rendering a separate category showcase page.
- `catalog/brands`: Update brand navigation requirements so brand selection navigates directly to `/products` with pre-applied brand filter rather than rendering a separate brand showcase page.

## Impact

- **Storefront (`shop/`)**:
  - `shop/src/app/categories/page.tsx`: Update category cards and subcategory links to point to `/products?categoryId={id}`.
  - `shop/src/app/brands/BrandsDirectory.tsx`: Update brand cards to point to `/products?brandId={id}`.
  - `shop/src/components/home/CategoryCircles.tsx`: Update category circle links to `/products?categoryId={id}` and "All" to `/products`.
  - `shop/src/components/home/PromoTiles.tsx`: Update category banner hrefs to `/products?categoryId=...`.
  - `shop/src/app/category/[slug]/page.tsx`: Replace showcase view with redirect to `/products?categorySlug={slug}`.
  - `shop/src/app/brands/[slug]/page.tsx`: Replace showcase view with redirect to `/products?brandSlug={slug}`.
  - Relevant tests in `shop/src/app/categories/`, `shop/src/app/brands/`, and `shop/src/components/`.
