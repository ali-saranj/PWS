# Tasks: Storefront Category Pages & Catalog Hierarchy

## 1. Backend Public Category API

- [x] 1.1 Add DTOs for public categories (`PublicCategoryDto`, `PublicCategoryDetailDto`, `PublicCategorySummaryDto`) in `api/src/main/java/ir/pws/store/catalog/PublicCatalogService.java`.
  - **Files to Touch**: `api/src/main/java/ir/pws/store/catalog/PublicCatalogService.java`
  - **Instructions**: Define `PublicCategoryDto(long id, String nameFa, String nameEn, String slug, Long parentId, int sortOrder)` and `PublicCategoryDetailDto(long id, String nameFa, String nameEn, String slug, Long parentId, int sortOrder, List<CategoryBreadcrumb> breadcrumbs, List<PublicCategoryDto> subcategories)`.
  - **Verification Command**: `(cd api && ./mvnw -q test-compile)`

- [x] 1.2 Implement `listCategories()` and `getCategoryBySlug(String slug)` in `PublicCatalogService.java`.
  - **Files to Touch**: `api/src/main/java/ir/pws/store/catalog/PublicCatalogService.java`
  - **Instructions**: Implement `listCategories()` querying active categories sorted by `sortOrder ASC, id ASC`. Implement `getCategoryBySlug(slug)` finding active category by slug, building ordered breadcrumbs to root, and listing direct active subcategories. Throw `ApiException(ErrorCode.NOT_FOUND)` if not found or inactive.
  - **Verification Command**: `(cd api && ./mvnw -q test-compile)`

- [x] 1.3 Expose public category endpoints in `PublicCatalogController.java`.
  - **Files to Touch**: `api/src/main/java/ir/pws/store/catalog/PublicCatalogController.java`
  - **Instructions**: Add `@GetMapping("/categories")` returning `List<PublicCategoryDto>` and `@GetMapping("/categories/{slug}")` returning `PublicCategoryDetailDto`.
  - **Verification Command**: `(cd api && ./mvnw -q test-compile)`

- [x] 1.4 Add integration tests for public category endpoints in `PublicCatalogIntegrationTest.java`.
  - **Files to Touch**: `api/src/test/java/ir/pws/store/catalog/PublicCatalogIntegrationTest.java`
  - **Instructions**: Test `GET /api/shop/catalog/categories` lists active categories in order. Test `GET /api/shop/catalog/categories/{slug}` returns category details with breadcrumbs and subcategories. Test `GET /api/shop/catalog/categories/non-existent` returns 404 NOT_FOUND.
  - **Verification Command**: `(cd api && ./mvnw -q test -Dtest=PublicCatalogIntegrationTest)`

## 2. Storefront All Categories Directory (`/categories`)

- [x] 2.1 Update `shop/src/app/categories/page.tsx` to fetch dynamic categories.
  - **Files to Touch**: `shop/src/app/categories/page.tsx`
  - **Instructions**: Convert page into an async Server Component fetching `/api/shop/catalog/categories`. Group into root categories and their immediate children. Render category cards with Persian typography, Lucide icon lookup, and subcategory links.
  - **Verification Command**: `(cd shop && npm run build)`

- [x] 2.2 Add unit test for Categories page in `shop/src/app/categories/CategoriesPage.test.tsx`.
  - **Files to Touch**: `shop/src/app/categories/CategoriesPage.test.tsx`
  - **Instructions**: Verify that `CategoriesPage` renders root categories and links to subcategories with mocked fetch response.
  - **Verification Command**: `(cd shop && npx vitest run src/app/categories/CategoriesPage.test.tsx)`

## 3. Storefront Category Showcase Page (`/category/[slug]`)

- [x] 3.1 Migrate `shop/src/app/category/[slug]/page.tsx` to an async Server Component.
  - **Files to Touch**: `shop/src/app/category/[slug]/page.tsx`
  - **Instructions**: Receive `{ params, searchParams }`. Fetch category details from `/api/shop/catalog/categories/{slug}` and products from `/api/shop/catalog/products?categorySlug={slug}&...` concurrently. If category is not found, call `notFound()`.
  - **Verification Command**: `(cd shop && npm run build)`

- [x] 3.2 Wire interactive category filters and subcategory navigation pills.
  - **Files to Touch**: `shop/src/app/category/[slug]/page.tsx`, `shop/src/app/category/[slug]/CategoryFilterClient.tsx`
  - **Instructions**: Extract interactive filter sidebar, subcategory chips, and sort dropdown into client controls that push query parameter changes to URL search params.
  - **Verification Command**: `(cd shop && npm run build)`

- [x] 3.3 Update test suite `shop/src/app/category/[slug]/CategoryPage.test.tsx`.
  - **Files to Touch**: `shop/src/app/category/[slug]/CategoryPage.test.tsx`
  - **Instructions**: Assert that category header, breadcrumbs, subcategory pills, and products render correctly, and invalid category calls `notFound()`.
  - **Verification Command**: `(cd shop && npx vitest run src/app/category/[slug]/CategoryPage.test.tsx)`

## 4. Full Monorepo Verification

- [x] 4.1 Run full API test suite for public catalog.
  - **Verification Command**: `(cd api && ./mvnw -q test -Dtest=PublicCatalogIntegrationTest)`

- [x] 4.2 Run full Shop Vitest suite.
  - **Verification Command**: `(cd shop && npm test)`

- [x] 4.3 Verify full Shop production build and type checking.
  - **Verification Command**: `(cd shop && npm run build)`
