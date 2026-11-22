# Proposal

## Why

The product detail page currently displays hardcoded mock items (`related-1`, `related-2`) for the "محصولات مشابه" (Similar Products) section during initial server rendering. These hardcoded placeholder items contain non-existent slugs (which return 404 when clicked), dummy prices, and lack real images. Furthermore, related products are currently fetched purely on the client side via `useEffect`, resulting in cumulative layout shifts (CLS), potential hydration discrepancies, and sub-optimal SEO indexing.

Implementing a robust server-side rendered (SSR) related products capability with category and brand matching and graceful mock fallback ensures customers see relevant, real deli products immediately upon loading the page, improving conversion and cross-selling.

## What Changes

- Add server-side fetching of related products in `ProductDetailPage` (`shop/src/app/products/[slug]/page.tsx`) using `fetchCatalogProducts`.
- Establish a similarity ranking algorithm:
  1. Products in the same category (`categoryId`) that share the same brand (`brandId`).
  2. Other products in the same category (`categoryId`).
  3. Exclude the currently viewed product by ID or slug.
  4. Limit to 4 relevant items.
- Remove all hardcoded dummy items (`related-1`, `related-2`) from `ProductDetailView.tsx`.
- Pass server-resolved related products as `initialRelated` prop into `ProductDetailView` to eliminate layout shift and client fetch delays.
- Implement a graceful fallback in `resolveRelatedProducts` using `MOCK_CATALOG_PRODUCTS` filtered by category and brand when the backend API is unreachable or returns fewer products than needed.
- Update tests in `ProductDetailPage.test.tsx` to assert that real related products (with matching category/brand) are rendered without fake slugs.

## Capabilities

### New Capabilities
- `storefront/related-products`: Governs the recommendation, server-side resolution, and display of similar/related products on the customer storefront product detail page based on category and brand affinities.

### Modified Capabilities

None.

## Impact

- **Affected Code**:
  - `shop/src/app/products/[slug]/page.tsx` (SSR resolver for related products)
  - `shop/src/components/product/ProductDetailView.tsx` (clean up hardcoded state, accept `initialRelatedProducts`)
  - `shop/src/app/products/ProductDetailPage.test.tsx` (unit and integration tests for PDP related products)
- **API Dependencies**: Uses existing `/api/shop/catalog/products` via `fetchCatalogProducts`.
- **Breaking Changes**: None. Backwards-compatible prop extension.
