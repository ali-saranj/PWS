# Proposal

## Why

A pre-GSC on-page and cannibalization audit of the storefront (`shop/`) and catalog data (`api/`) surfaced several indexing, relevance, and internal-linking gaps that remain after `storefront-seo-keywords`. Specifically, the homepage SEO intro links to non-existent category slugs (`sausage-hotdog`, `ham-coldcuts`, `dairy-cheese`), product breadcrumbs and pagination links emit `categoryId` instead of canonical `categorySlug` URLs, initial product descriptions (`V11`) contain internal QA notes (`فاقد تصویر`, etc.) that leak into `<meta name="description">` and JSON-LD, and `V13` leaves 3 categories, 3 category body-copy blocks, and 13 brands without SEO metadata while citing brands absent from the deli catalog.

## What Changes

- **Storefront Canonical & Internal Link Hygiene (`shop/`)**:
  - Fix broken category links in `HomePageClient.tsx` to target valid `V11` category slugs (`sausages-deli-meats`, `cheese`, `pickles`, `pickled-vegetables`, `sauces-condiments`).
  - Align product detail breadcrumbs (`ProductDetailView.tsx`), `BreadcrumbList` JSON-LD (`products/[slug]/page.tsx`), and catalog pagination (`products/page.tsx`) to use `categorySlug` instead of numeric `categoryId`, matching `sitemap.xml` and canonical tags.
  - Ensure `ProductDetailView` and `ProductDetailPage` preserve existing `pws-*` product URLs without introducing slug redirects.
- **Catalog SEO & Product Copy Cleanup (`api/`)**:
  - Add Flyway migration `V14__seo_audit_and_copy_cleanup.sql` to:
    - Strip internal QA notes (`فاقد تصویر`, `نیاز به بررسی...`, `تصویر قبلی...`, `بررسی تطابق...`) from `product.description_fa` and replace 1-line boilerplate with unique, intent-aligned Persian product descriptions (differentiating near-duplicate SKUs by weight, grade, and culinary use).
    - Complete `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa` for all 9 categories (filling `olives`, `tomato-paste`, `corn`, and missing `seo_content_fa` for `pickled-vegetables`, `sauces-condiments`, `semi-prepared-potatoes`).
    - Complete `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa` for all 13 remaining brands (`rahnamoud`, `basani`, `traditional-craft`, `dadfar`, `aryamanesh`, `ragheb`, `mazraeh-sabz`, `peseh`, `hadaf`, `barley`, `elka`, `ashineh`, `tabak`).
    - Fix the factual brand mismatch in `sausages-deli-meats` `seo_description` and enforce intent boundaries between retail category pages and `/wholesale`.

## Capabilities

### New Capabilities
- None (extends existing storefront SEO and catalog initial-data capabilities).

### Modified Capabilities
- `storefront/seo`: Require product breadcrumbs, `BreadcrumbList` JSON-LD, catalog pagination links, and homepage category links to use canonical `categorySlug` URLs rather than numeric `categoryId` or non-existent slugs, while retaining existing product `pws-*` URLs.
- `catalog/initial-data`: Require seeded `product.description_fa` values to be clean, customer-facing Persian copy free of internal QA annotations, and require seeded categories and brands to have complete, non-cannibalizing SEO metadata.

## Impact

- **Backend (`api/`)**: New Flyway migration `V14__seo_audit_and_copy_cleanup.sql` (plus verification via `./mvnw -q verify` against embedded Postgres).
- **Storefront (`shop/`)**: `HomePageClient.tsx`, `ProductDetailView.tsx`, `products/[slug]/page.tsx`, `products/page.tsx`, and Vitest unit/page tests (`HomePage.test.tsx`, `ProductDetailPage.test.tsx`, `ProductsPage.test.tsx`).
