# Design

## Context

The storefront is a Next.js 15 App Router application with React 19. In previous iterations, catalog navigation was consolidated onto `/products` with server-side filters. However, several technical SEO regressions were identified:
1. Product cards emit links targeting the singular route `/product/[slug]`, which forces an HTTP 308 redirect to `/products/[slug]`.
2. The footer renders links to 8 customer service and legal pages that do not exist, causing 404 errors across all pages.
3. The catalog page lacks a semantic `<h1>` element, and paginated URLs collapse canonical tags back to page 0.
4. Internal search queries at `/search` are crawlable by default in `robots.ts`.

## Goals / Non-Goals

**Goals:**
- Eliminate internal redirect hops: All `ProductCard` instances link directly to `/products/[slug]`.
- Eliminate sitewide 404s: Provide fully rendered, localized Persian trust pages for all 8 footer routes (`/terms`, `/privacy`, `/returns`, `/faq`, `/how-to-order`, `/payment-methods`, `/shipping`, `/wholesale`).
- Improve search discovery: Exclude `/search` in `robots.ts`, add trust pages to `sitemap.ts`, and fix pagination canonical tags on `/products`.
- Establish clear topical hierarchy: Add dynamic `<h1>` headings to the catalog page reflecting active category or brand filters.

**Non-Goals:**
- Building a dynamic headless CMS for trust pages (static React Server Components in Next.js App Router are fast, version-controlled, and require no backend changes).
- Changing backend database schemas or API contracts.
- Altering the visual design or branding of the header or footer.

## Decisions

### 1. Direct ProductCard Linking
- **Decision**: Update `ProductCard.tsx` to construct links directly to `/products/${slug || id}`.
- **Rationale**: Bypasses the `permanentRedirect` at `/product/[slug]`, saving mobile round-trip latency and search engine crawl budget.
- **Alternatives Considered**: Keeping `/product/[slug]` and redirecting on the edge. Discarded because internal links should always target canonical destinations directly.

### 2. Static Trust Pages Architecture
- **Decision**: Create individual route folders under `shop/src/app/` for each footer route:
  - `shop/src/app/terms/page.tsx`
  - `shop/src/app/privacy/page.tsx`
  - `shop/src/app/returns/page.tsx`
  - `shop/src/app/faq/page.tsx`
  - `shop/src/app/how-to-order/page.tsx`
  - `shop/src/app/payment-methods/page.tsx`
  - `shop/src/app/shipping/page.tsx`
  - `shop/src/app/wholesale/page.tsx`
- **Component Pattern**: Provide a shared layout wrapper (`TrustPageLayout` or container) that provides consistent breadcrumbs, RTL typography, card styling, and store contact callouts.
- **Rationale**: Individual route directories leverage Next.js App Router static optimization (`export const dynamic = 'force-static'`), allow distinct server-rendered `metadata` (Title, Description, Canonical), and directly satisfy the links rendered in `Footer.tsx`.

### 3. Catalog Semantic Heading & Pagination Canonicalization
- **Decision**:
  - In `shop/src/app/products/page.tsx`, generate an `<h1>` element inside `CatalogFilters`:
    - When `categorySlug` or `categoryId` is active: `<h1>خرید آنلاین انواع {categoryName}</h1>`
    - When `brandSlug` or `brandId` is active: `<h1>محصولات برند {brandName}</h1>`
    - When no facet is active: `<h1>همه محصولات و فرآورده‌های پروتئینی</h1>`
  - In `generateMetadata`: When `page > 0`, append `page=${page}` to the canonical URL so paginated pages do not declare themselves identical duplicates of the first page.

### 4. Search Exclusion in Robots.txt
- **Decision**: Add `/search` to the `disallow` array in `shop/src/app/robots.ts`.
- **Rationale**: Follows Google Search Essentials to prevent internal search query parameters from creating infinite crawl spaces or indexing thin results.

### 5. Category Links Alignment
- **Decision**: In `shop/src/components/home/CategoryCircles.tsx` and `shop/src/app/categories/page.tsx`, prioritize `cat.slug` over `cat.id` when building target URLs: `/products?categorySlug=${cat.slug}`.
- **Rationale**: Aligns with sitemap entries and avoids split link equity between ID-based and slug-based query parameters.

## Risks / Trade-offs

- **Risk: Breaking legacy bookmarks targeting `/product/[slug]`**
  - *Mitigation*: The route handler `shop/src/app/product/[slug]/page.tsx` remains in place to handle external inbound links and redirects with HTTP 308. Only internal references are updated to direct paths.
- **Risk: Test regressions in existing component test suites**
  - *Mitigation*: Existing tests in `ProductDetailPage.test.tsx` check that links include `/product/` (which matches `/products/`). All test suites will be run and verified with Vitest.
