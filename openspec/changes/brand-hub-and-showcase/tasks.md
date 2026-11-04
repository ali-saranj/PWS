# Tasks

## 1. Backend Public Catalog Brand API

- [x] 1.1 Update `PublicBrandDto` to record `(long id, String nameFa, String nameEn, String slug, String logoUrl)`, inject `AppProperties` into `PublicCatalogService` to resolve `mediaBaseUrl`, and add `getBrandBySlug(String slug)` returning `PublicBrandDto` or throwing `NOT_FOUND`.
- [x] 1.2 Expose `GET /api/shop/catalog/brands/{slug}` on `PublicCatalogController`.
- [x] 1.3 Write integration tests in `PublicCatalogIntegrationTest` covering brand logo inclusion, successful brand retrieval by slug, and 404 for unknown/inactive brand slug. Verify with `./mvnw -q test -Dtest=PublicCatalogIntegrationTest`.

## 2. Storefront Catalog Client & Types

- [x] 2.1 Update `BrandItem` in `shop/src/lib/serverCatalog.ts` with `logoUrl?: string | null` and implement `fetchBrandBySlug(slug: string): Promise<BrandItem | null>`.
- [x] 2.2 Add unit tests in `shop/src/lib/serverCatalog.test.ts` for `fetchBrandBySlug` (success and 404 handling) and updated `fetchBrands`. Verify with `cd shop && npx vitest run src/lib/serverCatalog.test.ts`.

## 3. Storefront Dynamic Brand Directory (/brands)

- [x] 3.1 Transform `shop/src/app/brands/page.tsx` into a dynamic directory fetching active brands, displaying logos with initials fallback, and providing interactive search filtering.
- [x] 3.2 Add test in `shop/src/app/brands/BrandsDirectory.test.tsx` verifying brand rendering and search filtering. Verify with `cd shop && npx vitest run src/app/brands/BrandsDirectory.test.tsx`.

## 4. Storefront Brand Showcase Page (/brands/[slug])

- [x] 4.1 Implement `shop/src/app/brands/[slug]/page.tsx` featuring breadcrumb navigation, brand identity header (logo, Persian name, English badge), category filters, price filter, in-stock toggle, sort options, and responsive product cards with pagination.
- [x] 4.2 Add test in `shop/src/app/brands/[slug]/BrandShowcase.test.tsx` verifying brand showcase rendering, product filtering, and empty state. Verify with `cd shop && npx vitest run src/app/brands/[slug]/BrandShowcase.test.tsx`.

## 5. Verification & Build Integrity

- [ ] 5.1 Run API test suite: `cd api && ./mvnw -q test -Dtest=PublicCatalogIntegrationTest,ProductApiTest`.
- [ ] 5.2 Run Shop test suite and typecheck: `cd shop && npm test && npm run build`.

## Workflow follow-up

- Archive the change after implementation and review requirements are satisfied (`openspec archive brand-hub-and-showcase`).
- Verify the archived spec at `openspec/specs/catalog/brands/spec.md`.
