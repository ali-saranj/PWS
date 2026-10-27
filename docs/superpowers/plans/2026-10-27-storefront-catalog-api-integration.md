# Storefront Real Catalog API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace hardcoded static mock products across the customer storefront with live Spring Boot catalog API integration rendered via Next.js 15 Server Components, server-side data fetching, and URL search parameter synchronization.

**Architecture:** 
- **Server Catalog Client (`shop/src/lib/serverCatalog.ts`):** Direct server-side data fetcher targeting `http://localhost:8080/api/shop/catalog/*` with typed responses (`ProductSummaryResponse`, `ProductDetailResponse`, `PageResponse<T>`).
- **Server Component Routes (`shop/src/app/{products, products/[slug], category/[slug], search, discounts}`):** Server-rendered routes accepting `searchParams: Promise<{ ... }>` for zero layout shift, shareable URLs, and full SEO indexation.
- **Client Interactive Controls:** `FilterSidebar` and `SortDropdown` sync filter state to the URL via Next.js `useRouter`/`useSearchParams`. Reusable `Pagination` component renders 24 items per page with Persian numerals. Interactive `ProductDetailClient` handles multi-image switching, weight/flavour variant selection, volume tier table calculation, and cart dispatch.

**Tech Stack:** Next.js 15 (App Router, Server Components), React 19, TypeScript, Tailwind CSS, Zustand (`cartStore`), Lucide Icons, Vitest / React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-27-storefront-catalog-api-integration.md`

## Global Constraints

- Monetary units: DB and API in whole **Rials** (`long`); all UI displays and customer inputs in **Toman** (`rials = toman × 10`) with Persian numerals (`۰-۹`).
- Server-side API base URL: `process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'`.
- Catalog page size: 24 products per page (`size=24`).
- Next.js 15 requirement: Route `params` and `searchParams` in Page components are asynchronous Promises (`Promise<{ [key: string]: string | string[] | undefined }>`).
- 404 behavior: Non-existent product slugs or invalid categories trigger Next.js `notFound()`, rendering `shop/src/app/not-found.tsx`.
- Mock cleanup: All imports of `MOCK_CATALOG_PRODUCTS` must be removed from `shop/src/app/**`.
- Testing: All shop tests must pass with `npm test` and build with `npm run build` in `shop/`.

## Review Focus

1. **Server vs Client Boundary:** Server components must remain pure async functions; client interactive hooks (`useRouter`, `useSearchParams`, `useState`) must only exist in dedicated `'use client'` files or leaf components wrapped in `<Suspense>`.
2. **Toman to Rials Conversion:** When filtering by `minPrice` or `maxPrice` in Toman from the UI, the query parameters sent to the backend API must be converted to Rials (`rials = toman * 10`).
3. **Persian Numbers & Empty States:** Pagination numbers, prices, and product counts must render in authentic Persian numerals with Persian fallback states when no products match.
4. **Variant Stock Accuracy:** Selecting a specific package size or cut on `/products/[slug]` must update the live stock on hand and disable "Add to Cart" if that specific variant is out of stock.
5. **No Broken Next.js Build:** Running `npm run build` in `shop/` must successfully compile all Server Components without dynamic server usage bailouts or missing Suspense boundaries.

---

## File Structure

```
shop/
  src/
    lib/
      serverCatalog.ts            # Server-side API fetch client & type definitions
      serverCatalog.test.ts       # Unit tests for serverCatalog
    components/
      Pagination.tsx              # Reusable Persian pagination component
      Pagination.test.tsx         # Unit tests for Pagination
      ProductCard.tsx             # Enhanced product card with ProductSummaryResponse
      ProductCard.test.tsx        # Unit tests for ProductCard
      FilterSidebar.tsx           # Client filter sidebar synchronizing to URL
      SortDropdown.tsx            # Client sort dropdown synchronizing to URL
      product/
        ProductDetailClient.tsx   # Interactive client component for product page
    app/
      products/
        page.tsx                  # Server Component for main catalog
        ProductsPage.test.tsx     # Integration test for main catalog
        [slug]/
          page.tsx                # Server Component for product detail
          ProductDetailPage.test.tsx # Integration test for product detail
      category/
        [slug]/
          page.tsx                # Server Component for category catalog
          CategoryPage.test.tsx   # Integration test for category catalog
      search/
        page.tsx                  # Server Component for search
        SearchPage.test.tsx       # Integration test for search
      discounts/
        page.tsx                  # Server Component for discounts
        DiscountsPage.test.tsx    # Integration test for discounts
```

---

### Task 1: Server-Side Catalog Client & Type Definitions

**Files:**
- Create: `shop/src/lib/serverCatalog.ts`
- Test: `shop/src/lib/serverCatalog.test.ts`

**Interfaces:**
- Consumes: Spring Boot `/api/shop/catalog/*` endpoints.
- Produces:
  ```typescript
  export interface ProductSummary {
    id: number;
    slug: string;
    nameFa: string;
    nameEn?: string;
    brandId: number;
    brandNameFa: string;
    brandNameEn?: string;
    categoryId: number;
    categoryNameFa: string;
    categoryNameEn?: string;
    thumbnailUrl?: string;
    basePriceRials: number;
    priceToman: number;
    compareAtPriceRials?: number;
    compareAtPriceToman?: number;
    discountPercent?: number;
    inStock: boolean;
    totalStock: number;
    featured?: boolean;
    badges: string[];
    defaultVariantId?: number;
  }

  export interface ProductDetail extends ProductSummary {
    descriptionFa?: string;
    descriptionEn?: string;
    breadcrumb: Array<{ id: number; nameFa: string; nameEn?: string; slug: string }>;
    images: Array<{ id: number; url: string; thumbUrl?: string; sortOrder: number; altFa?: string }>;
    variants: Array<{
      id: number;
      sku: string;
      flavourFa?: string;
      flavourEn?: string;
      sizeLabel?: string;
      weightGrams?: number;
      basePriceRials: number;
      priceToman: number;
      compareAtPriceToman?: number;
      discountPercent?: number;
      stockOnHand: number;
      inStock: boolean;
      tiers: Array<{ minQty: number; unitPriceToman: number; discountPercent: number }>;
    }>;
  }

  export interface PageResult<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
  }

  export async function fetchCatalogProducts(params: {
    categoryId?: number;
    brandId?: number;
    onSale?: boolean;
    minPriceRials?: number;
    maxPriceRials?: number;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<PageResult<ProductSummary>>;

  export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null>;
  export async function fetchCatalogSearch(q: string, page?: number, size?: number): Promise<PageResult<ProductSummary>>;
  ```

- [x] **Step 1: Write the failing tests for `serverCatalog`**

Create `shop/src/lib/serverCatalog.test.ts` testing `fetchCatalogProducts`, `fetchProductBySlug` (including 404 null handling), and `fetchCatalogSearch` with mocked `global.fetch`.

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/lib/serverCatalog.test.ts`  
Expected: FAIL ("Cannot find module '@/lib/serverCatalog'")

- [x] **Step 3: Implement `serverCatalog.ts`**

Write `shop/src/lib/serverCatalog.ts` with typed fetchers, URL parameter serialization, error catching, and fallback to `null` on 404 for product details.

- [x] **Step 4: Run test to verify it passes**

Run: `cd shop && npx vitest run src/lib/serverCatalog.test.ts`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/lib/serverCatalog.ts shop/src/lib/serverCatalog.test.ts
git commit -m "feat(shop): server-side catalog API client and types"
```

---

### Task 2: Reusable Pagination & Shared Catalog Components

**Files:**
- Create: `shop/src/components/Pagination.tsx`
- Test: `shop/src/components/Pagination.test.tsx`
- Modify: `shop/src/components/ProductCard.tsx`
- Test: `shop/src/components/ProductCard.test.tsx`
- Modify: `shop/src/components/FilterSidebar.tsx`
- Modify: `shop/src/components/SortDropdown.tsx`

**Interfaces:**
- `PaginationProps`: `{ currentPage: number; totalPages: number; totalElements: number; pageSize: number; onPageChange?: (page: number) => void; createPageUrl?: (page: number) => string; }`
- `ProductCard`: Accepts `product: ProductSummary`, renders thumbnail (with placeholder fallback), price in Toman with Persian numerals, discount badge, and calls `cartStore.addItem({ variantId: product.defaultVariantId, ... })`.
- `FilterSidebar`: Uses `useSearchParams`, `useRouter`, `usePathname` to update URL params (`categoryId`, `brandId`, `onSale`, `minPrice`, `maxPrice`) while preserving existing parameters.
- `SortDropdown`: Uses `useSearchParams`, `useRouter`, `usePathname` to update `sort` URL param (`newest`, `price_asc`, `price_desc`, `popular`).

- [x] **Step 1: Write failing tests for `Pagination` and `ProductCard`**

Create `shop/src/components/Pagination.test.tsx` testing Persian numerals, disabled previous on first page, disabled next on last page, and page link generation. Add unit test in `shop/src/components/ProductCard.test.tsx` verifying product card rendering from `ProductSummary` and add-to-cart dispatch.

- [x] **Step 2: Run tests to verify failure**

Run: `cd shop && npx vitest run src/components/Pagination.test.tsx src/components/ProductCard.test.tsx`  
Expected: FAIL

- [x] **Step 3: Implement `Pagination.tsx` and refactor `ProductCard.tsx`, `FilterSidebar.tsx`, `SortDropdown.tsx`**

Implement `Pagination.tsx` with Persian RTL navigation (`صفحه بعد`, `صفحه قبل`, page numbers). Update `ProductCard.tsx` to handle `ProductSummary`. Update `FilterSidebar.tsx` and `SortDropdown.tsx` to interact cleanly with URL query parameters.

- [x] **Step 4: Run tests to verify they pass**

Run: `cd shop && npx vitest run src/components/Pagination.test.tsx src/components/ProductCard.test.tsx`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/components/Pagination.tsx shop/src/components/Pagination.test.tsx shop/src/components/ProductCard.tsx shop/src/components/ProductCard.test.tsx shop/src/components/FilterSidebar.tsx shop/src/components/SortDropdown.tsx
git commit -m "feat(shop): reusable persian pagination and url-synced catalog controls"
```

---

### Task 3: Main Catalog Listing Route (`/products`)

**Files:**
- Modify: `shop/src/app/products/page.tsx`
- Modify: `shop/src/app/products/ProductsPage.test.tsx` (or create if absent)

**Interfaces:**
- Consumes: `fetchCatalogProducts` from `serverCatalog.ts`, `searchParams: Promise<{ [key: string]: string | undefined }>`.
- Produces: Server-rendered `/products` page with active filters, product grid, and pagination.

- [x] **Step 1: Write failing test for Server Component `ProductsPage`**

Write `shop/src/app/products/ProductsPage.test.tsx` testing that `ProductsPage` resolves search parameters (`categoryId`, `sort`, `page`), calls `fetchCatalogProducts` with converted Rials (`minPriceRials = minPrice * 10`), renders returned products, and renders empty state when `content` is empty.

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/app/products/ProductsPage.test.tsx`  
Expected: FAIL

- [x] **Step 3: Implement Server Component in `shop/src/app/products/page.tsx`**

Convert `ProductsPage` to an `async` Server Component. Await `searchParams`, parse query parameters, query `fetchCatalogProducts`, and render breadcrumbs, `FilterSidebar`, `SortDropdown`, product grid, and `Pagination`.

- [x] **Step 4: Run test to verify it passes**

Run: `cd shop && npx vitest run src/app/products/ProductsPage.test.tsx`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/app/products/page.tsx shop/src/app/products/ProductsPage.test.tsx
git commit -m "feat(shop): server-rendered catalog products route with url filters"
```

---

### Task 4: Product Detail Page & Interactive Variant Selector (`/products/[slug]`)

**Files:**
- Create: `shop/src/components/product/ProductDetailClient.tsx`
- Modify: `shop/src/app/products/[slug]/page.tsx`
- Modify: `shop/src/app/products/ProductDetailPage.test.tsx`

**Interfaces:**
- Consumes: `fetchProductBySlug` from `serverCatalog.ts`, Next.js `notFound()`.
- Produces:
  - `page.tsx`: Server Component fetching `ProductDetail` and invoking `notFound()` if not found.
  - `ProductDetailClient.tsx`: Interactive client component receiving `product: ProductDetail` prop, allowing users to:
    - Pick cut / flavour (e.g., دودی، ساده، تند).
    - Pick weight / package size (e.g., ۲۵۰ گرم، ۵۰۰ گرم، ۱ کیلوگرم).
    - View volume discount tiers table (`tiers` list with `minQty` and `unitPriceToman`).
    - Switch active image in gallery.
    - Add selected variant to cart with live quantity controls and stock cap.

- [x] **Step 1: Write failing tests for Product Detail Page and Variant Selection**

Update `shop/src/app/products/ProductDetailPage.test.tsx` to test:
1. Product page calls `notFound()` when product slug is unknown.
2. Renders authentic product details (`nameFa`, `brandNameFa`, `priceToman`).
3. Switching weight/flavour changes selected variant price and stock state.
4. Volume discount tier table renders with minQty and savings.
5. Clicking "افزودن به سبد خرید" dispatches the selected variant to `cartStore`.

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/app/products/ProductDetailPage.test.tsx`  
Expected: FAIL

- [x] **Step 3: Implement `ProductDetailClient.tsx` and Server Component `[slug]/page.tsx`**

Create `ProductDetailClient.tsx` with image gallery switching, variant selection buttons, tier pricing table, and add-to-cart. Update `[slug]/page.tsx` to fetch product data on server and delegate interactive presentation to `ProductDetailClient`.

- [x] **Step 4: Run test to verify it passes**

Run: `cd shop && npx vitest run src/app/products/ProductDetailPage.test.tsx`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/components/product/ProductDetailClient.tsx shop/src/app/products/\[slug\]/page.tsx shop/src/app/products/ProductDetailPage.test.tsx
git commit -m "feat(shop): server-rendered product detail route with interactive variants"
```

---

### Task 5: Search & Discounts Server-Rendered Routes

**Files:**
- Modify: `shop/src/app/search/page.tsx`
- Modify: `shop/src/app/search/SearchPage.test.tsx`
- Modify: `shop/src/app/discounts/page.tsx`
- Create: `shop/src/app/discounts/DiscountsPage.test.tsx`

**Interfaces:**
- `/search`: Server Component receiving `searchParams: Promise<{ q?: string; page?: string }>`. Calls `fetchCatalogSearch(q, page, 24)` when `q` is non-empty. Renders query summary and results.
- `/discounts`: Server Component receiving `searchParams: Promise<{ page?: string; sort?: string }>`. Calls `fetchCatalogProducts({ onSale: true, page, sort, size: 24 })`.

- [x] **Step 1: Write failing tests for Search and Discounts Server Components**

Update `shop/src/app/search/SearchPage.test.tsx` to test search with query parameter `q` calling `fetchCatalogSearch` and displaying Persian results count. Create `shop/src/app/discounts/DiscountsPage.test.tsx` testing that discounts route queries `onSale=true` with page size 24.

- [x] **Step 2: Run tests to verify they fail**

Run: `cd shop && npx vitest run src/app/search/SearchPage.test.tsx src/app/discounts/DiscountsPage.test.tsx`  
Expected: FAIL

- [x] **Step 3: Implement Server Components for Search and Discounts**

Update `shop/src/app/search/page.tsx` and `shop/src/app/discounts/page.tsx` as async Server Components with server-side API fetching and pagination.

- [x] **Step 4: Run tests to verify they pass**

Run: `cd shop && npx vitest run src/app/search/SearchPage.test.tsx src/app/discounts/DiscountsPage.test.tsx`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add shop/src/app/search/page.tsx shop/src/app/search/SearchPage.test.tsx shop/src/app/discounts/page.tsx shop/src/app/discounts/DiscountsPage.test.tsx
git commit -m "feat(shop): server-rendered search and discounts routes"
```

---

### Task 6: Category Route & Complete Mock Data Retirement

**Files:**
- Modify: `shop/src/app/category/[slug]/page.tsx`
- Modify: `shop/src/app/category/[slug]/CategoryPage.test.tsx`
- Remove mock references: Check `shop/src/app/**` for any remaining imports of `MOCK_CATALOG_PRODUCTS`.

**Interfaces:**
- `/category/[slug]`: Server Component resolving category slug, fetching category details and filtered products via `fetchCatalogProducts({ categoryId, ... })`. Calls `notFound()` if category slug is invalid.

- [x] **Step 1: Write failing tests for Category Server Component**

Update `shop/src/app/category/[slug]/CategoryPage.test.tsx` to test category products fetched via API and 404 behavior for unknown categories.

- [x] **Step 2: Run test to verify it fails**

Run: `cd shop && npx vitest run src/app/category/[slug]/CategoryPage.test.tsx`  
Expected: FAIL

- [x] **Step 3: Implement Category Server Component and eliminate mock imports**

Update `shop/src/app/category/[slug]/page.tsx`. Verify with `grep -rn "MOCK_CATALOG_PRODUCTS" shop/src/app/` that zero app routes import mock products.

- [x] **Step 4: Run all shop tests to verify 100% pass rate**

Run: `cd shop && npm test -- --run`  
Expected: PASS (All test files green)

- [x] **Step 5: Verify Next.js production build**

Run: `cd shop && npm run build`  
Expected: Exit code 0, all routes compiled.

- [x] **Step 6: Commit**

```bash
git add shop/src/app/category/\[slug\]/page.tsx shop/src/app/category/\[slug\]/CategoryPage.test.tsx
git commit -m "feat(shop): server-rendered category route and complete mock catalog retirement"
```
