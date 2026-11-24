# Tasks

## 1. Direct Linking & Robots Crawl Exclusion

- [x] 1.1 Add `/search` to the disallow rules in `shop/src/app/robots.ts` and verify with updated unit test in `shop/src/app/robots.test.ts`
- [x] 1.2 Update product card links in `shop/src/components/ProductCard.tsx` from `/product/${slug || id}` to `/products/${slug || id}` and verify with `shop/src/components/ProductCard.test.tsx`

## 2. Catalog Semantic Heading, Canonical Pagination & Link Consistency

- [x] 2.1 Add semantic `<h1>` element in `shop/src/app/products/page.tsx` reflecting active category, brand, or general catalog title and verify with tests in `shop/src/app/products/ProductsPage.test.tsx`
- [x] 2.2 Update canonical metadata in `shop/src/app/products/page.tsx` to preserve `page` query parameter when `page > 0` and verify with test in `shop/src/app/products/ProductsPage.test.tsx`
- [x] 2.3 Update `shop/src/components/home/CategoryCircles.tsx` and `shop/src/app/categories/page.tsx` to link via `categorySlug` rather than numeric IDs and verify tests pass

## 3. Customer Trust, Policy & Information Pages

- [x] 3.1 Create shared `TrustPageContainer` layout/wrapper component in `shop/src/components/TrustPageContainer.tsx` with breadcrumbs, RTL styling, and store contact info
- [x] 3.2 Implement static pages for `/terms`, `/privacy`, `/returns`, `/faq`, `/how-to-order`, `/payment-methods`, `/shipping`, and `/wholesale` under `shop/src/app/` with localized content and metadata
- [x] 3.3 Create test suite `shop/src/app/TrustPages.test.tsx` verifying all 8 routes render expected titles, contact information, and valid metadata
- [x] 3.4 Update `shop/src/app/sitemap.ts` to include the 8 trust routes and verify with `shop/src/app/sitemap.test.ts`

## 4. End-to-End Verification

- [x] 4.1 Run full storefront Vitest test suite (`cd shop && npm test`) and verify all tests pass with zero failures
- [x] 4.2 Run production build check (`cd shop && npm run build`) and verify successful static generation and type safety
