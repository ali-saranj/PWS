# Design

## Context

The storefront is a Next.js 15 App Router application with React 19. `ProductDetailPage` (`shop/src/app/products/[slug]/page.tsx`) runs as a Server Component, delegating presentation to `ProductDetailView` (`shop/src/components/product/ProductDetailView.tsx`).

Currently, `ProductDetailView` hardcodes a fallback state `defaultRelated` containing synthetic items (`related-1`, `related-2`) and fires an asynchronous client-side `api.get` request after mount. This creates layout shifts and displays broken links if the client request fails or runs offline.

## Goals / Non-Goals

**Goals:**
- Resolve related products on the server during SSR using `fetchCatalogProducts`.
- Establish affinity ranking: same `categoryId` + same `brandId` ranked above same `categoryId` with different brand, excluding the active product, capped at 4 items.
- Provide a robust fallback using `MOCK_CATALOG_PRODUCTS` when the API response has insufficient items or encounters network errors.
- Remove hardcoded dummy objects (`related-1`, `related-2`) entirely.
- Pass `initialRelated` into `ProductDetailView` to render instantly without client hydration jumps.

**Non-Goals:**
- Machine learning, collaborative filtering, or user-history-based recommendation algorithms.
- Modifying backend database schema or introducing new Spring Boot controllers.
- Multi-category bundling or carousel pagination beyond the 4-item grid.

## Decisions

### Decision 1: Server-Side Resolution in `page.tsx`
- **Choice**: Execute `resolveRelatedProducts(product)` inside `ProductDetailPage` Server Component and pass the result as `initialRelatedProducts` to `ProductDetailView`.
- **Rationale**: Guarantees zero Cumulative Layout Shift (CLS), ensures fast first-contentful paint, and allows search engine crawlers to discover related product links.
- **Alternatives Considered**: Fetching solely inside a client `useEffect` (the existing implementation) which suffers from hydration mismatch and flash of placeholder content.

### Decision 2: Affinity Ranking in Frontend Service Layer
- **Choice**: Request candidate items from the same category (`fetchCatalogProducts({ categoryId, size: 8 })`) and sort candidates in TypeScript:
  1. Primary: Same category AND same brand (`brandId` or `brandNameFa`).
  2. Secondary: Same category, other brands.
  3. Exclude: Product currently being viewed (`slug` or `id` matching).
  4. Slice: Top 4 products.
- **Rationale**: Maximizes code reuse with the existing catalog API without requiring new Spring Boot endpoints or database migrations.
- **Alternatives Considered**: New backend endpoint `/api/shop/catalog/products/{slug}/related`. Deferring this keeps changes focused and leverages existing cached endpoints (`revalidate: 60`).

### Decision 3: Realistic Mock Fallback Strategy
- **Choice**: When `fetchCatalogProducts` returns empty or fails, filter `MOCK_CATALOG_PRODUCTS` using the same category/brand affinity rules.
- **Rationale**: Guarantees that in development, testing, or temporary network interruptions, all rendered cards link to valid product slugs with genuine images, titles, and prices.
- **Alternatives Considered**: Leaving the section empty if API fails. However, in offline demo and local mock modes, customers/reviewers expect to see the full UI layout.

## Risks / Trade-offs

- **[Risk] Categories with fewer than 4 total products** → *Mitigation*: The grid dynamically renders whatever valid products are available (1 to 4 items) or gracefully supplements with general high-rated deli products from `MOCK_CATALOG_PRODUCTS`.
- **[Risk] Slower SSR response if catalog API is slow** → *Mitigation*: `fetchCatalogProducts` employs Next.js ISR/cache headers (`next: { revalidate: 60 }`), ensuring near-instantaneous responses after initial caching.
