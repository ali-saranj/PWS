# Storefront Real Catalog API Integration Specification

**Date:** 2026-10-27  
**Scope:** `shop/` (Next.js 15 App Router storefront) and `api/` (Spring Boot catalog endpoints)  
**Goal:** Retire hardcoded static mock products from the customer storefront and wire all catalog browsing routes (`/products`, `/products/[slug]`, `/category/[slug]`, `/search`, `/discounts`) directly to the Spring Boot catalog API via Server Components, server-side data fetching, and URL search parameter synchronization.

---

## 1. Context & Motivation

Phase 1 established the catalog API (`/api/shop/catalog/home`, `/products`, `/products/{slug}`, `/search`), and Phase 2 introduced checkout and customer account management. However, several storefront pages still import and render `MOCK_CATALOG_PRODUCTS` from `shop/src/lib/mockProducts.ts`. Consequently, newly created or updated deli products, variants, images, and prices created in the Admin back-office do not reflect on storefront listing, search, category, or product detail pages.

This phase connects all storefront catalog routes to the live Spring Boot API, rendering with Next.js 15 Server Components for SEO, performance, and immediate shareability.

---

## 2. Architectural Design

### 2.1 Server-Side Data Fetching & URL Query Synchronization

- **Server Components:**
  - Route handlers (`page.tsx`) in `shop/src/app/{products, category/[slug], search, discounts}` will be async Server Components that accept `searchParams: Promise<{ [key: string]: string | string[] | undefined }>`.
  - Data fetching runs on the server before HTML is streamed to the client, providing SEO metadata, zero layout shift, and instant indexing.
- **Server API Helper (`shop/src/lib/serverCatalog.ts`):**
  - Uses `process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'` as the absolute base URL during SSR.
  - Exposes typed functions:
    - `fetchCatalogProducts(params: CatalogQueryParams): Promise<PageResponse<ProductSummaryResponse>>`
    - `fetchProductBySlug(slug: string): Promise<ProductDetailResponse | null>`
    - `fetchCatalogSearch(q: string, page?: number, size?: number): Promise<PageResponse<ProductSummaryResponse>>`
    - `fetchHomeCatalog(): Promise<HomeCatalogResponse>`
    - `fetchCategoryList(): Promise<CategoryDto[]>`
- **URL Parameter Synchronization:**
  - Standardized URL parameters:
    - `categoryId`: number
    - `brandId`: number
    - `onSale`: boolean (`true`)
    - `minPrice`: number (Toman)
    - `maxPrice`: number (Toman)
    - `sort`: string (`newest`, `price_asc`, `price_desc`, `popular`)
    - `page`: 0-indexed number (displayed as 1-based in UI)
    - `size`: default `24`
- **Interactive Client Controls:**
  - `FilterSidebar`: Client component (`useSearchParams`, `useRouter`, `usePathname`) pushing parameter updates to the URL.
  - `SortDropdown`: Client component pushing sort option to the URL.
  - `Pagination`: Reusable Persian pagination component displaying current page, total pages, item range in Persian digits, and prev/next navigation.

---

## 3. Route Specifications

### 3.1 `/products` (Main Catalog Listing)
- Server Component reading all filter `searchParams`.
- Converts Toman filter bounds (`minPrice`, `maxPrice`) to Rials for backend query (`rials = toman × 10`).
- Fetches `PageResponse<ProductSummaryResponse>` with `size=24`.
- Renders:
  - Persian breadcrumb (`خانه > محصولات`).
  - Active filter badges with 1-click removal.
  - Responsive grid of `ProductCard` components.
  - Empty state when no products match filters.
  - Server-driven pagination controls.

### 3.2 `/products/[slug]` (Product Detail Page)
- Server Component resolving `params: Promise<{ slug: string }>`.
- Calls `fetchProductBySlug(slug)`. If `null` or 404, triggers Next.js `notFound()` to display the Persian 404 page.
- Renders:
  - Hierarchical breadcrumbs (`خانه > [دسته بندی] > [نام محصول]`).
  - Interactive multi-image gallery with thumbnail rail and main viewer (with fallback SVG placeholder if product has no images).
  - Persian title (`nameFa`), English title (`nameEn`), brand pill, badges (تخفیف، جدید، ویژه).
  - Price display in Toman with Persian numerals (`compareAtPriceToman`, `priceToman`, discount pill).
  - Variant selector:
    - Flavour / Cut picker (e.g. دودی، ساده، تند).
    - Package size / Weight picker (e.g. ۲۵۰ گرم، ۵۰۰ گرم، ۱ کیلوگرم).
  - Dynamic stock status based on selected variant (`stockOnHand`, `inStock`).
  - Volume pricing tiers table (تخفیف پله‌ای) displaying quantity ranges and discounted unit prices.
  - Add to cart button integrated with `cartStore` using the selected variant's ID.
  - Product description in rich Persian typography.

### 3.3 `/category/[slug]` (Category Locus)
- Resolves category slug. Fetches category metadata and products filtered by `categoryId` with `size=24`.
- Renders category title, breadcrumbs, and faceted filter controls scoped to the category.

### 3.4 `/search` (Catalog Search)
- Reads `?q=...` search param.
- If query is blank, renders search input prompt.
- If query is provided, fetches `GET /api/shop/catalog/search?q=...&page=...&size=24`.
- Renders result count in Persian (e.g. `۱۲ نتیجه برای "ژامبون"`), search grid, and pagination.

### 3.5 `/discounts` (Special Offers & Promotions)
- Server Component fetching `GET /api/shop/catalog/products?onSale=true&size=24`.
- Displays promotional hero banner, discount-filtered catalog grid, and pagination.

---

## 4. UI & Storefront Components Refactoring

1. **`ProductCard`:**
   - Accepts real `ProductSummaryResponse`.
   - Supports 1-click add-to-cart using `defaultVariantId`.
   - Displays authentic deli thumbnail images with local fallback.
2. **`FilterSidebar`:**
   - Fetches available categories and brands dynamically from the API rather than hardcoded mock categories.
   - Preserves active filters from URL query parameters.
3. **`Pagination`:**
   - Renders 1-based Persian numbers (`۱، ۲، ۳ ...`).
   - Disables previous on page 0 and next on the last page.
4. **Mock Data Clean-Up:**
   - Remove imports of `MOCK_CATALOG_PRODUCTS` from all app routes.
   - Retain mock products solely as test fixtures for unit tests if required.

---

## 5. Verification & Testing Plan

1. **Unit & Integration Tests (`shop/`):**
   - Test Server Components with mocked API responses.
   - Test `FilterSidebar` and `SortDropdown` URL synchronization.
   - Test `ProductDetailPage` variant selection and volume tier price calculation.
   - Verify all tests pass with `npm test`.
2. **End-to-End Build Verification:**
   - Run `npm run build` in `shop/` to ensure all Server Components compile and generate valid SSR routes.
   - Verify API tests (`./mvnw -q test`) and Admin tests (`npm test` in `admin/`) remain unaffected.
