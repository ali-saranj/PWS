# Proposal

## Why

The storefront (`shop/`) currently lacks essential search engine optimization (SEO) primitives: it does not serve `robots.txt` or a dynamic `sitemap.xml`, product detail pages are entirely client-rendered without server `generateMetadata`, JSON-LD structured data (Product, Offer, Breadcrumbs) is absent, and the primary branding domain is configured as insecure `http://` instead of `https://`. Implementing a full-stack SEO suite is critical to ensure proper crawling and indexing by Googlebot, rich search snippets (pricing, stock status, breadcrumbs) in Google SERP, and optimized link previews across messaging platforms.

## What Changes

- Update primary storefront domain configuration from `http://` to `https://proteinirany.ir`.
- Implement dynamic `app/robots.ts` defining crawl policies (allowing public catalog and content, disallowing private endpoints `/profile`, `/checkout`, `/auth`, `/track`, `/api/`) and referencing the sitemap URL.
- Implement dynamic `app/sitemap.ts` generating real-time XML sitemaps containing static routes, active catalog categories, brands, and products.
- Refactor `products/[slug]/page.tsx` from a client-only component into a Server Component with `generateMetadata`, keeping interactive UI (image gallery, variant selector, quantity/cart buy box) in a child client component.
- Emit rich JSON-LD structured data:
  - `Organization` and `WebSite` with `SearchAction` in root layout.
  - `Product` and `Offer` schema on product detail pages (including Rial price, SKU, brand, and stock availability).
  - `BreadcrumbList` schema showing the category and product hierarchy.
- Ensure canonical URL enforcement and 301 redirects for alternate routing patterns (`/product/[slug]` -> `/products/[slug]`).

## Capabilities

### New Capabilities
- `storefront/seo`: Comprehensive search engine discovery, crawling directives, dynamic sitemaps, server-rendered product metadata, OpenGraph/Twitter card tags, and Schema.org JSON-LD structured data for the customer storefront.

### Modified Capabilities
- `store/branding`: Update the primary production domain requirement to enforce `https://proteinirany.ir` across metadataBase, OpenGraph, and canonical URLs.

## Impact

- `shop/src/config/branding.ts`: Domain protocol updated to HTTPS.
- `shop/src/app/robots.ts`: New Next.js MetadataRoute for crawling rules.
- `shop/src/app/sitemap.ts`: New dynamic Next.js MetadataRoute fetching live catalog paths.
- `shop/src/app/products/[slug]/`: Server Component separation and `generateMetadata` implementation.
- `shop/src/app/layout.tsx`: Root-level organization and website JSON-LD structured data injection.
- Tests in `shop/src/app/`: Automated unit and metadata tests covering robots, sitemap, metadata generation, and JSON-LD output.
