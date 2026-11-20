# Tasks

## 1. Root Layout & Homepage Canonicals

- [x] 1.1 Remove `alternates: { canonical: '/' }` from `shop/src/app/layout.tsx` while retaining `metadataBase` configuration
- [x] 1.2 Declare explicit self-referential canonical metadata on the storefront homepage in `shop/src/app/page.tsx`
- [x] 1.3 Update `shop/src/app/layout.test.tsx` to assert that `metadataBase` is set and root layout does not enforce a cascaded child canonical tag

## 2. Dynamic Catalog Metadata & Canonicals (`/products`)

- [x] 2.1 Implement `generateMetadata` in `shop/src/app/products/page.tsx` resolving category and brand parameters into Persian titles, meta descriptions, and clean canonical URLs (`/products`, `/products?categorySlug={slug}`, `/products?brandSlug={slug}`)
- [x] 2.2 Add unit tests in `shop/src/app/products/ProductsPage.test.tsx` validating `generateMetadata` outputs for unfiltered catalog, category-filtered catalog, and brand-filtered catalog

## 3. Static Directories & Auxiliary Pages Canonicals

- [x] 3.1 Add explicit self-referential canonical URLs to `shop/src/app/categories/page.tsx`, `shop/src/app/brands/page.tsx`, `shop/src/app/discounts/page.tsx`, `shop/src/app/about/page.tsx`, and `shop/src/app/contact/page.tsx`
- [x] 3.2 Update test suites in `shop/src/app/categories/CategoriesPage.test.tsx`, `shop/src/app/brands/BrandsDirectory.test.tsx`, and `shop/src/app/discounts/DiscountsPage.test.tsx` verifying explicit canonical tag presence

## 4. Sitemap 200 OK Destination Alignment

- [x] 4.1 Update `shop/src/app/sitemap.ts` to replace redirected `/category/[slug]` and `/brands/[slug]` routes with direct 200 OK catalog filter URLs (`/products?categorySlug={slug}` and `/products?brandSlug={slug}`)
- [x] 4.2 Update `shop/src/app/sitemap.test.ts` to verify all generated XML sitemap entries resolve to 200 OK destination URLs and match page-level canonical declarations

## 5. Verification & End-to-End Build

- [x] 5.1 Execute `npm test` across `shop/` verifying 100% test pass rate for all metadata, routing, and sitemap suites
- [x] 5.2 Execute `npm run build` in `shop/` confirming clean Next.js production build and route generation without type or metadata errors
