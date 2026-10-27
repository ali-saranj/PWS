# Product Filters End-to-End Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix product filtering across backend and storefront: add missing `inStock` filter, fix `NaN` category serialization, support public brands endpoint and real brand ID filtering, and fix Persian digits parsing in price inputs.

**Architecture:**
- **Spring Boot API (`PublicCatalogController`, `PublicCatalogService`):** Add `inStock` boolean filter with subquery on variant stock, resolve `categorySlug`/`brandSlug`, support `brandIds`, and expose public `GET /api/shop/catalog/brands`.
- **Server Catalog Client (`shop/src/lib/serverCatalog.ts`):** Defensively guard against `NaN` parameters, support `inStock`, add `fetchBrands()`.
- **Filter UI Components (`FilterSidebar.tsx`, `CatalogFilters.tsx`):** Normalize Persian digits in price inputs, bind category IDs cleanly, support brand selection by ID.
- **Storefront Catalog Route (`shop/src/app/products/page.tsx`):** Synchronize `inStock`, `brandId`, `categoryId`, and price range from `searchParams` and pass them to `fetchCatalogProducts`.

**Tech Stack:** Spring Boot 3.5 (Java 17, JPA Criteria API, MockMvc), Next.js 15, TypeScript, Tailwind CSS, Vitest / React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-27-product-filters-fix.md`

## Global Constraints

- Monetary units: DB and API in whole **Rials** (`long`); all UI displays and customer inputs in **Toman** (`rials = toman × 10`) with Persian numerals (`۰-۹`).
- Server-side API base URL: `process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'`.
- Catalog page size: 24 products per page on `/products` (`size=24`).
- Next.js 15 requirement: Route `searchParams` in Page components are asynchronous Promises.
- Safe number handling: Never pass `NaN` or `undefined` as query param strings in `serverCatalog.ts`.
- Testing: All API tests must pass with `./mvnw test -Dtest=PublicCatalogIntegrationTest` and all shop tests with `cd shop && npm test -- --run`.

## Review Focus

1. **In-Stock Filtering Accuracy:** A product with active variants that all have `stockOnHand == 0` must NOT be returned when `inStock=true`.
2. **Category Selection Resilience:** Clicking any category in `FilterSidebar` must navigate with valid category identifier without ever producing `categoryId=NaN`.
3. **Persian Digits in Price Inputs:** Entering `۲۰۰۰۰` (Persian digits) in the price range input must correctly filter products with price `>= 20000 Toman`.
4. **Brand Filter Synchronization:** Selecting a brand must pass the valid `brandId` and return only products belonging to that brand.
5. **No Regression on Pagination & Sort:** Combining filters with sorting (`price_asc`, `newest`) and pagination must maintain state across page changes.

---

### Task 1: API `inStock` Filter & Public Brands Endpoint

**Files:**
- Modify: `api/src/main/java/ir/pws/store/catalog/PublicCatalogController.java`
- Modify: `api/src/main/java/ir/pws/store/catalog/PublicCatalogService.java`
- Test: `api/src/test/java/ir/pws/store/catalog/PublicCatalogIntegrationTest.java`

**Interfaces:**
- `PublicCatalogController`:
  - `GET /api/shop/catalog/products`: Add `@RequestParam(required = false) Boolean inStock`, `@RequestParam(required = false) String categorySlug`, `@RequestParam(required = false) String brandSlug`.
  - `GET /api/shop/catalog/brands`: Returns `List<BrandSummaryDto>` with `id`, `nameFa`, `nameEn`, `slug`.
- `PublicCatalogService`:
  - `listProducts`: Add `Boolean inStock`, `String categorySlug`, `String brandSlug` parameters. When `Boolean.TRUE.equals(inStock)`, add criteria subquery: variant active and `stockOnHand > 0`. When `categorySlug` is provided and `categoryId` is null, resolve from `categoryRepository`. When `brandSlug` is provided and `brandId` is null, resolve from `brandRepository`.
  - `listBrands()`: Returns all active brands (or brands associated with active products).

- [x] **Step 1: Write failing tests for inStock filter and brands endpoint**

In `PublicCatalogIntegrationTest.java`:
1. Add test `productsFilterByInStockOnly()`: Create product A with stock 5 and product B with stock 0 (active variant). Query `inStock=true`. Expect only product A.
2. Add test `publicBrandsEndpointReturnsActiveBrands()`: Query `GET /api/shop/catalog/brands`. Expect 200 OK with array of brands.
3. Add test `productsFilterByCategorySlug()`: Query `categorySlug=protein`. Expect products in that category.

- [x] **Step 2: Run test to verify it fails**

Run: `cd api && ./mvnw test -Dtest=PublicCatalogIntegrationTest#productsFilterByInStockOnly`
Expected: FAIL (compilation error or assertion error)

- [x] **Step 3: Implement `inStock` filter and brands endpoint in `PublicCatalogController` and `PublicCatalogService`**

1. In `PublicCatalogService.java`:
   - Implement `listBrands()`:
     ```java
     public record PublicBrandDto(long id, String nameFa, String nameEn, String slug) {}
     public List<PublicBrandDto> listBrands() { ... }
     ```
   - In `buildFilterSpec`:
     - If `Boolean.TRUE.equals(inStock)`, add subquery on Variant where `active = true` and `stockOnHand > 0`.
     - Resolve `categorySlug` if `categoryId == null`.
     - Resolve `brandSlug` if `brandId == null`.
2. In `PublicCatalogController.java`:
   - Expose `GET /brands` calling `service.listBrands()`.
   - Update `GET /products` to accept `inStock`, `categorySlug`, `brandSlug`.

- [x] **Step 4: Run tests to verify they pass**

Run: `cd api && ./mvnw test -Dtest=PublicCatalogIntegrationTest`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add api/src/main/java/ir/pws/store/catalog/PublicCatalogController.java api/src/main/java/ir/pws/store/catalog/PublicCatalogService.java api/src/test/java/ir/pws/store/catalog/PublicCatalogIntegrationTest.java
git commit -m "feat(api): add inStock filter and public brands endpoint to public catalog"
```

---

### Task 2: Server Catalog Client `NaN` Defense, `inStock` & `fetchBrands`

**Files:**
- Modify: `shop/src/lib/serverCatalog.ts`
- Modify: `shop/src/lib/serverCatalog.test.ts`

**Interfaces:**
- `serverCatalog.ts`:
  - `export interface BrandItem { id: number; nameFa: string; nameEn?: string; slug: string; }`
  - `fetchCatalogProducts(params: { ... inStock?: boolean; categorySlug?: string; })`: Guard against `Number.isNaN()` for all numeric query params.
  - `fetchBrands(): Promise<BrandItem[]>`: Calls `/api/shop/catalog/brands` with revalidate fallback.

- [x] **Step 1: Write failing tests for `serverCatalog.ts`**

In `shop/src/lib/serverCatalog.test.ts`:
1. Test that `fetchCatalogProducts` ignores `categoryId` if it is `NaN`, never placing `categoryId=NaN` in the query string.
2. Test that `fetchCatalogProducts` passes `inStock=true` when specified.
3. Test that `fetchBrands` fetches brands from `/api/shop/catalog/brands`.

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/lib/serverCatalog.test.ts`
Expected: FAIL

- [x] **Step 3: Implement changes in `shop/src/lib/serverCatalog.ts`**

1. Define `BrandItem`.
2. In `fetchCatalogProducts`:
   - Check `!Number.isNaN(params.categoryId)` before setting `categoryId`.
   - Check `!Number.isNaN(params.brandId)` before setting `brandId`.
   - If `params.inStock` is true, `query.set('inStock', 'true')`.
   - If `params.categorySlug`, `query.set('categorySlug', params.categorySlug)`.
3. Implement `fetchBrands()`.

- [x] **Step 4: Run test to verify it passes**

Run: `cd shop && npx vitest run src/lib/serverCatalog.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/lib/serverCatalog.ts shop/src/lib/serverCatalog.test.ts
git commit -m "feat(shop): serverCatalog inStock support, fetchBrands, and NaN sanitization"
```

---

### Task 3: Filter UI Components (Persian Price Digits & Real Brand Binding)

**Files:**
- Modify: `shop/src/components/FilterSidebar.tsx`
- Modify: `shop/src/components/catalog/CatalogFilters.tsx`
- Test: `shop/src/components/FilterSidebar.test.tsx` (create or update)

**Interfaces:**
- `FilterSidebar.tsx`:
  - Update `FilterState`:
    ```typescript
    export interface FilterState {
      categoryId?: number | string | null;
      brandId?: number | null;
      brands?: string[];
      inStockOnly: boolean;
      onSaleOnly: boolean;
      minPrice?: number | null;
      maxPrice?: number | null;
    }
    ```
  - Parse Persian/Arabic digits in `handleApplyPrice` using `toLatinDigits`:
    Convert Persian digits (`۰-۹`) to Latin (`0-9`) before stripping non-digits.
  - Category selection: use `cat.id` directly (or clean string).
- `CatalogFilters.tsx`:
  - Synchronize `inStock` to URL: `params.set('inStock', 'true')`.
  - Synchronize `brandId` to URL: `params.set('brandId', String(newFilters.brandId))`.
  - Pass `availableBrands` or `brands` objects.

- [x] **Step 1: Write failing tests for Persian price digits and inStock in FilterSidebar**

In `shop/src/components/FilterSidebar.test.tsx`:
1. Test that entering Persian digits `۲۰۰۰۰` and `۳۰۰۰۰` in price inputs and clicking submit calls `onChange` with `{ minPrice: 20000, maxPrice: 30000 }`.
2. Test that toggling "فقط کالاهای موجود" calls `onChange` with `{ inStockOnly: true }`.

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/components/FilterSidebar.test.tsx`
Expected: FAIL

- [x] **Step 3: Implement fixes in `FilterSidebar.tsx` and `CatalogFilters.tsx`**

1. In `FilterSidebar.tsx`:
   - Import `toLatinDigits` (or inline regex conversion: `str.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))`).
   - Use `toLatinDigits` in `handleApplyPrice`.
   - Update category click handler to use `cat.id` when available.
2. In `CatalogFilters.tsx`:
   - Handle `inStock` query parameter synchronization in `updateUrlParams`.
   - Handle `brandId` query parameter synchronization.

- [x] **Step 4: Run test to verify it passes**

Run: `cd shop && npx vitest run src/components/FilterSidebar.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/components/FilterSidebar.tsx shop/src/components/catalog/CatalogFilters.tsx shop/src/components/FilterSidebar.test.tsx
git commit -m "fix(shop): support Persian digits in price filter and synchronize inStock/brandId"
```

---

### Task 4: Storefront Catalog Route (`/products`) Integration & Verification

**Files:**
- Modify: `shop/src/app/products/page.tsx`
- Modify: `shop/src/app/products/ProductsPage.test.tsx`

**Interfaces:**
- `ProductsPage`:
  - Read `params.inStock === 'true'`.
  - Read `params.brandId ? Number(params.brandId) : undefined`.
  - Safe category parsing: `const catIdNum = Number(params.categoryId); const categoryId = !Number.isNaN(catIdNum) ? catIdNum : undefined;`.
  - Fetch `fetchBrands()` alongside `fetchCatalogProducts` and `fetchCategories`.
  - Pass `inStock`, `brandId`, `categoryId` to `fetchCatalogProducts` and `initialFilters`.
  - Include `inStock` and `brandId` in `pageUrlPattern` for pagination.

- [x] **Step 1: Write failing test in `ProductsPage.test.tsx`**

Add tests:
1. `ProductsPage` reads `inStock=true` and passes `inStock: true` to `fetchCatalogProducts`.
2. `ProductsPage` safely handles `categoryId="protein"` without passing `NaN` (passes `categorySlug: "protein"` or undefined).

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/app/products/ProductsPage.test.tsx`
Expected: FAIL

- [x] **Step 3: Implement updates in `shop/src/app/products/page.tsx`**

1. Parse `inStock`, `brandId`, `categoryId`, `minPrice`, `maxPrice` safely.
2. Update `pageUrlPattern` to include `inStock` and `brandId`.
3. Pass `brands` from `fetchBrands()` to `CatalogFilters`.

- [x] **Step 4: Run all shop tests to verify 100% pass rate**

Run: `cd shop && npm test -- --run`
Expected: PASS (All test files green)

- [x] **Step 5: Verify Next.js build**

Run: `cd shop && npm run build`
Expected: PASS (Exit code 0)

- [x] **Step 6: Commit**

```bash
git add shop/src/app/products/page.tsx shop/src/app/products/ProductsPage.test.tsx
git commit -m "feat(shop): full filter synchronization with inStock, brandId, and defensive category on /products"
```
