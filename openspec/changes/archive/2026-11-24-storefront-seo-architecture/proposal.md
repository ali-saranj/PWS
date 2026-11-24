# Proposal

## Why

A comprehensive technical SEO audit of the `shop/` storefront revealed critical crawlability, trust, and indexation flaws:
1. Every product card on the homepage, catalog, and carousels links to `/product/[slug]`, which causes an HTTP 308 redirect hop to `/products/[slug]`, wasting search engine crawl budget and adding mobile navigation latency.
2. The sitewide footer links to 8 non-existent routes (`/terms`, `/privacy`, `/returns`, `/faq`, `/how-to-order`, `/payment-methods`, `/shipping`, `/wholesale`), emitting 404 errors across all pages and degrading search engine trust signals (E-E-A-T).
3. The catalog page (`/products`) lacks a semantic `<h1>` tag and incorrectly sets self-referential canonical tags on paginated pages (`page > 0`) back to the root page, signaling to Google that paginated product pages should not be indexed.
4. The robots exclusion protocol (`robots.ts`) allows crawling of internal search result URLs (`/search`), risking crawl traps and indexation of thin search query pages.

Addressing these issues directly improves search discovery, eliminates redirect latency, establishes foundational trust/compliance pages, and consolidates internal link equity.

## What Changes

- **Direct Product Links in ProductCard**: Update all card links from `/product/[slug]` to direct canonical `/products/[slug]`, eliminating HTTP 308 redirect hops.
- **Search Query Crawler Exclusion**: Update `robots.ts` to disallow crawling of `/search`.
- **Paginated Catalog Canonical & Dynamic H1**: Update `/products` metadata generation to preserve self-referencing canonicals for paginated views (`page > 0`) and render a dynamic, semantic `<h1>` heading reflecting the active category, brand, or catalog title.
- **Unified Category Slug Links**: Align internal category links in `CategoryCircles` and `CategoriesPage` to consistently target `categorySlug` rather than numeric IDs, matching the sitemap and canonical definitions.
- **Storefront Trust & Legal Pages**: Implement static server-rendered pages for all 8 footer routes (`/terms`, `/privacy`, `/returns`, `/faq`, `/how-to-order`, `/payment-methods`, `/shipping`, `/wholesale`) with localized Persian typography and metadata.
- **XML Sitemap Inclusion**: Include the new trust pages in `sitemap.ts` to ensure prompt search engine discovery and indexation.

## Capabilities

### New Capabilities
- `storefront/trust-pages`: Covers static customer service, legal, regulatory compliance, and operational store information pages (`/terms`, `/privacy`, `/returns`, `/faq`, `/how-to-order`, `/payment-methods`, `/shipping`, `/wholesale`).

### Modified Capabilities
- `storefront/seo`: Update requirements for robots exclusion directives (`/search`), canonical pagination rules on the catalog, direct product card linking, dynamic `<h1>` heading generation, and inclusion of trust pages in the XML sitemap.

## Impact

- **Affected Code**:
  - `shop/src/components/ProductCard.tsx` (product links)
  - `shop/src/app/robots.ts` (search disallow)
  - `shop/src/app/sitemap.ts` (trust page routes)
  - `shop/src/app/products/page.tsx` (heading & canonical pagination)
  - `shop/src/components/home/CategoryCircles.tsx` & `shop/src/app/categories/page.tsx` (category slug link uniformity)
  - `shop/src/app/(trust)/` or `shop/src/app/{terms,privacy,returns,faq,how-to-order,payment-methods,shipping,wholesale}/page.tsx`
- **APIs**: No backend API schema changes required; all changes are frontend Next.js App Router metadata, routing, and UI.
- **Tests**: Update and expand Vitest test suites (`robots.test.ts`, `sitemap.test.ts`, `ProductsPage.test.tsx`, `ProductCard.test.tsx`, and new trust page tests).
