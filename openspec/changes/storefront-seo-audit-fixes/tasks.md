# Tasks

## 1. Storefront Canonical & Internal Link Hygiene (`shop/`)

- [x] 1.1 Update `HomePageClient.tsx` SEO intro category links to use valid `V11` category slugs (`sausages-deli-meats`, `cheese`, `pickles`, `pickled-vegetables`, `sauces-condiments`) and update `HomePage.test.tsx` to assert valid `categorySlug` links (verified with `npx vitest run src/app/HomePage.test.tsx`).
- [x] 1.2 Update `ProductDetailView.tsx` category breadcrumb and `products/[slug]/page.tsx` `BreadcrumbList` JSON-LD to resolve `categorySlug` (from `product.categorySlug` or `product.breadcrumb[0].slug`) with `categoryId` fallback, and add assertions in `ProductDetailPage.test.tsx` (verified with `npx vitest run src/app/products/ProductDetailPage.test.tsx`).
- [x] 1.3 Update `products/page.tsx` `pageUrlPattern` to preserve `categorySlug` instead of rewriting it to `categoryId`, and add a pagination link test in `ProductsPage.test.tsx` (verified with `npx vitest run src/app/products/ProductsPage.test.tsx`).

## 2. Catalog SEO & Product Copy Cleanup (`api/`)

- [x] 2.1 Create `api/src/main/resources/db/migration/V14__seo_audit_and_copy_cleanup.sql` updating `product.description_fa` for all 74 `V11` products to remove internal QA notes (`فاقد تصویر`, `نیاز به بررسی...`, `تصویر قبلی...`, `بررسی تطابق...`) and provide unique, intent-aligned Persian descriptions differentiating near-duplicate SKUs.
- [x] 2.2 In `V14__seo_audit_and_copy_cleanup.sql`, populate complete `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa` for all 9 categories (filling `olives`, `tomato-paste`, `corn`, missing `seo_content_fa`, fixing `sausages-deli-meats` brand reference, and deconflicting retail categories from `/wholesale`) and all 13 remaining partner brands.
- [x] 2.3 Run `cd api && ./mvnw -q verify` to verify Flyway applies `V14` cleanly against embedded Postgres and all backend tests pass.

## 3. End-to-End Verification

- [x] 3.1 Run `cd shop && npm test && npm run lint && npm run build` and confirm all storefront tests, linter checks, and production build succeed cleanly.
