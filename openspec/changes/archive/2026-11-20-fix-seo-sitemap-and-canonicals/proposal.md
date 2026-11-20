# Proposal

## Why

Google Search Console reports indexing and discovery anomalies on the storefront: pages like `/products?brandSlug=...`, `/brands/...`, and `/products?page=1` report "User-declared canonical: https://proteinirany.ir/" and "No referring sitemaps detected". This is caused by two critical SEO defects: (1) root `layout.tsx` exports `alternates: { canonical: '/' }`, which Next.js cascades to any page lacking an explicit canonical tag, collapsing category, brand, and catalog indexation into the homepage; (2) `sitemap.ts` generates `/category/[slug]` and `/brands/[slug]` URLs that issue HTTP 308 redirects, violating search engine guidelines prohibiting redirected URLs in XML sitemaps.

## What Changes

- **Root Layout Canonical Decoupling**:
  - Remove global `alternates: { canonical: '/' }` from `shop/src/app/layout.tsx` so child routes do not mistakenly inherit the root path.
  - Set explicit self-referential canonical tag on the homepage (`shop/src/app/page.tsx`).
- **Dynamic Catalog Metadata & Canonicals (`/products`)**:
  - Implement `generateMetadata` in `shop/src/app/products/page.tsx` resolving category and brand query parameters to accurate Persian titles, descriptions, and self-referential canonical URLs (`/products`, `/products?categorySlug={slug}`, `/products?brandSlug={slug}`).
- **Static Page Metadata & Self-Referential Canonicals**:
  - Add explicit canonical tags and metadata to `/categories`, `/brands`, `/discounts`, `/about`, and `/contact`.
- **Sitemap 200 OK Destination URL Alignment**:
  - Update `shop/src/app/sitemap.ts` to replace redirected `/category/[slug]` and `/brands/[slug]` URLs with active 200 OK catalog filter URLs (`/products?categorySlug={slug}` and `/products?brandSlug={slug}`).
  - Ensure all XML sitemap entries return HTTP 200 OK and match the self-referential canonical tags declared on their respective pages.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `storefront/seo`: Update sitemap generation requirements so that only direct 200 OK canonical URLs are included in `sitemap.xml`, and expand canonical routing requirements so that all storefront routes (homepage, catalog with category/brand filters, directories, auxiliary pages) render explicit, non-inherited self-referential canonical URLs.

## Impact

- **Storefront (`shop/`)**:
  - `shop/src/app/layout.tsx`: Remove `alternates.canonical`.
  - `shop/src/app/page.tsx`: Declare explicit self-referential canonical for root `/`.
  - `shop/src/app/products/page.tsx`: Add dynamic `generateMetadata` for titles and canonicals.
  - `shop/src/app/categories/page.tsx`, `shop/src/app/brands/page.tsx`, `shop/src/app/discounts/page.tsx`, `shop/src/app/about/page.tsx`, `shop/src/app/contact/page.tsx`: Add explicit self-referential canonicals.
  - `shop/src/app/sitemap.ts`: Align category and brand entries to `/products?categorySlug=...` and `/products?brandSlug=...`.
  - Update unit and metadata tests in `shop/src/app/sitemap.test.ts`, `shop/src/app/layout.test.tsx`, and relevant page tests.
