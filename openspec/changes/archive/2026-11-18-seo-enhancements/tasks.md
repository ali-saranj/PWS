# Tasks

## 1. Branding & Crawler Directives

- [x] 1.1 Update `shop/src/config/branding.ts` domain to `https://proteinirany.ir` and verify root layout `metadataBase` in `shop/src/app/layout.tsx`.
- [x] 1.2 Create `shop/src/app/robots.ts` exporting Next.js `MetadataRoute.Robots` and add `shop/src/app/robots.test.ts` verifying crawl rules and sitemap reference.

## 2. Dynamic XML Sitemap

- [x] 2.1 Add sitemap catalog helper in `shop/src/lib/serverCatalog.ts` to fetch all active product, category, and brand slugs with fallback error handling.
- [x] 2.2 Create `shop/src/app/sitemap.ts` exporting Next.js `MetadataRoute.Sitemap` and add `shop/src/app/sitemap.test.ts` verifying generated URLs, priorities, and change frequencies.

## 3. Structured Data (JSON-LD)

- [x] 3.1 Implement JSON-LD schema builder in `shop/src/lib/jsonLd.ts` covering Organization, WebSite with SearchAction, Product with Offer (IRR currency and in-stock status), and BreadcrumbList.
- [x] 3.2 Add unit tests in `shop/src/lib/jsonLd.test.ts` verifying valid Schema.org structure and fields.
- [x] 3.3 Inject root Organization and WebSite SearchAction JSON-LD script into `shop/src/app/layout.tsx` and verify rendered HTML output in layout tests.

## 4. Product Detail Server Component & Dynamic Metadata

- [x] 4.1 Extract interactive gallery, variant selection, and buy box controls from `shop/src/app/products/[slug]/page.tsx` into `shop/src/components/product/ProductDetailView.tsx`.
- [x] 4.2 Convert `shop/src/app/products/[slug]/page.tsx` to an async Server Component exporting `generateMetadata` and rendering product JSON-LD structured data.
- [x] 4.3 Update and expand `shop/src/app/products/ProductDetailPage.test.tsx` to verify metadata generation, OpenGraph tags, canonical link, and JSON-LD script injection.

## 5. Canonical Routing & Verification

- [x] 5.1 Update singular `shop/src/app/product/[slug]/page.tsx` to permanently redirect to `/products/[slug]` and add verification test.
- [x] 5.2 Execute test suite (`npm test`), lint (`npm run lint`), and build verification (`npm run build`) in `shop/` to ensure end-to-end correctness.
