# Category and Brand Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate storefront category and brand navigation from fragmented showcase pages into the unified `/products` catalog screen with pre-applied filters, and issue HTTP 308 redirects for legacy showcase routes.

**Architecture:** Update all customer entry points (categories directory, brands directory, home circles, promo tiles, hero banner, product card brand badges) to navigate to `/products?categoryId={id}` or `/products?brandId={id}`. Replace legacy server components (`/category/[slug]` and `/brands/[slug]`) with Next.js `permanentRedirect()` calls (HTTP 308) to `/products?categorySlug={slug}` and `/products?brandSlug={slug}`. Ensure `ProductsPage` resolves both numeric IDs and slugs for pre-selection in `FilterSidebar`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Vitest, Testing Library.

**Spec:** `openspec/changes/category-brand-navigation/` (including `proposal.md`, `design.md`, `tasks.md`, `specs/catalog/categories/spec.md`, `specs/catalog/brands/spec.md`).

## Global Constraints

- Never alter staff back-office (`admin/`) routes or public catalog API endpoints (`api/`).
- Preserve RTL layout, Vazirmatn typography, and Persian text formatting.
- Follow TDD: update/write tests first (RED), then implement minimal code (GREEN).
- Every redirect from legacy routes must issue HTTP 308 (via `permanentRedirect`) and unknown slugs must call `notFound()`.

## Review Focus

1. Subcategory pills and root category cards must point to `/products?categoryId={id}` with exact numeric ID.
2. Brand badges on `ProductCard` must only be clickable links if `brandId` exists, preventing broken links.
3. Category circles and HeroBanner "All" links must navigate to `/products`.
4. Legacy showcase URLs (`/category/[slug]` and `/brands/[slug]`) must not render old showcase UI; they must issue 308 redirect or 404 for invalid slugs.
5. In `ProductsPage`, when `categorySlug` or `brandSlug` is passed, `FilterSidebar` must resolve the slug to active highlight/checkbox state.

---

### Task 1: Category Navigation to Products Screen

**Files:**
- Modify: `shop/src/app/categories/page.tsx`
- Modify: `shop/src/app/categories/CategoriesPage.test.tsx`
- Modify: `shop/src/components/home/CategoryCircles.tsx`
- Modify: `shop/src/components/home/PromoTiles.tsx`
- Modify: `shop/src/components/home/HeroBanner.tsx`
- Modify: `shop/src/app/HomePage.test.tsx`
- Modify: `shop/src/app/category/[slug]/page.tsx`
- Modify: `shop/src/app/category/[slug]/CategoryPage.test.tsx`

**Interfaces:**
- Consumes: `CategoryItem`, `fetchCategoryBySlug` from `@/lib/serverCatalog`, `permanentRedirect`, `notFound` from `next/navigation`.
- Produces: Navigation links pointing to `/products?categoryId={id}` and permanent redirects from `/category/{slug}` to `/products?categorySlug={slug}`.

- [ ] **Step 1: Update `CategoriesPage.test.tsx` to assert `/products?categoryId={id}` link destinations**

Update tests in `shop/src/app/categories/CategoriesPage.test.tsx`:
- Root category link: assert `href` is `/products?categoryId=1`
- Subcategory link: assert `href` is `/products?categoryId=2`

- [ ] **Step 2: Run test to verify failure**

Run: `cd shop && npx vitest run src/app/categories/CategoriesPage.test.tsx`
Expected: FAIL (links currently point to `/category/hotdogs` and `/category/sausages-coldcuts`)

- [ ] **Step 3: Update `shop/src/app/categories/page.tsx`**

Change link hrefs:
- Root card link: `/products?categoryId=${root.id}`
- Subcategory pill link: `/products?categoryId=${child.id}`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd shop && npx vitest run src/app/categories/CategoriesPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Update `shop/src/components/home/CategoryCircles.tsx`, `PromoTiles.tsx`, `HeroBanner.tsx` and `HomePage.test.tsx`**

- In `CategoryCircles.tsx`:
  - Update "مشاهده تمام دسته‌ها" link to `/products`.
  - Update circle items href to `cat.id ? `/products?categoryId=${cat.id}` : `/products?categorySlug=${cat.slug}``.
- In `PromoTiles.tsx`:
  - Update sausage tile to `/products?categoryId=1`.
  - Update dairy tile to `/products?categoryId=8`.
  - Update snacks tile to `/products?categoryId=6`.
- In `HeroBanner.tsx`:
  - Update default `ctaHref` to `/products`.
- In `HomePage.test.tsx`:
  - Add assertions verifying `HeroBanner` CTA links to `/products`, category circle links point to `/products?categoryId=...`, and promo tile CTAs point to `/products?categoryId=...`.

- [ ] **Step 6: Run `HomePage.test.tsx` to verify passes**

Run: `cd shop && npx vitest run src/app/HomePage.test.tsx`
Expected: PASS

- [ ] **Step 7: Update `shop/src/app/category/[slug]/page.tsx` and `CategoryPage.test.tsx`**

- In `CategoryPage.test.tsx`:
  - Mock `permanentRedirect` and `notFound` from `next/navigation`.
  - Test 1: When category exists, assert `permanentRedirect('/products?categorySlug=sausage-hotdog')` is called.
  - Test 2: When category does not exist, assert `notFound()` is called.
- In `shop/src/app/category/[slug]/page.tsx`:
  - Replace showcase rendering with `fetchCategoryBySlug(slug)`. If null, call `notFound()`. If found, call `permanentRedirect(`/products?categorySlug=${encodeURIComponent(slug)}`)`.

- [ ] **Step 8: Run `CategoryPage.test.tsx` to verify passes**

Run: `cd shop && npx vitest run src/app/category/[slug]/CategoryPage.test.tsx`
Expected: PASS

---

### Task 2: Brand Navigation to Products Screen

**Files:**
- Modify: `shop/src/app/brands/BrandsDirectory.tsx`
- Modify: `shop/src/app/brands/BrandsDirectory.test.tsx`
- Modify: `shop/src/components/ProductCard.tsx`
- Modify: `shop/src/components/ProductCard.test.tsx`
- Modify: `shop/src/app/brands/[slug]/page.tsx`
- Modify: `shop/src/app/brands/[slug]/BrandShowcase.test.tsx`

**Interfaces:**
- Consumes: `BrandItem`, `fetchBrandBySlug` from `@/lib/serverCatalog`, `permanentRedirect`, `notFound` from `next/navigation`.
- Produces: Navigation links pointing to `/products?brandId={id}` and permanent redirects from `/brands/{slug}` to `/products?brandSlug={slug}`.

- [ ] **Step 1: Update `BrandsDirectory.test.tsx` to assert `/products?brandId={id}` link destinations**

In `shop/src/app/brands/BrandsDirectory.test.tsx`:
- Assert brand links point to `/products?brandId=1` and `/products?brandId=2` (previously `/brands/kalleh` and `/brands/andre`).

- [ ] **Step 2: Run test to verify failure**

Run: `cd shop && npx vitest run src/app/brands/BrandsDirectory.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `shop/src/app/brands/BrandsDirectory.tsx`**

Change card link href to `b.id ? `/products?brandId=${b.id}` : `/products?brandSlug=${b.slug}``.

- [ ] **Step 4: Run test to verify passes**

Run: `cd shop && npx vitest run src/app/brands/BrandsDirectory.test.tsx`
Expected: PASS

- [ ] **Step 5: Update `ProductCard.test.tsx` to assert clickable brand badge**

In `shop/src/components/ProductCard.test.tsx`:
- Add test case verifying that when `brandId: 10` is provided on the product, the brand badge renders as a link with `href="/products?brandId=10"`.

- [ ] **Step 6: Run test to verify failure**

Run: `cd shop && npx vitest run src/components/ProductCard.test.tsx`
Expected: FAIL (brand is currently rendered as a plain `<span>`)

- [ ] **Step 7: Update `shop/src/components/ProductCard.tsx`**

When `brandNameFa` is present and `item.brandId` exists:
Render a `<Link href={`/products?brandId=${item.brandId}`} className="font-medium text-gray-500 hover:text-primary transition-colors focus:outline-none" onClick={(e) => e.stopPropagation()}>{brandNameFa}</Link>`.

- [ ] **Step 8: Run test to verify passes**

Run: `cd shop && npx vitest run src/components/ProductCard.test.tsx`
Expected: PASS

- [ ] **Step 9: Update `shop/src/app/brands/[slug]/page.tsx` and `BrandShowcase.test.tsx`**

- In `BrandShowcase.test.tsx`:
  - Mock `permanentRedirect` and `notFound` from `next/navigation`.
  - Assert that `BrandPage` calls `permanentRedirect('/products?brandSlug=kalleh')` when brand is found.
  - Assert that `BrandPage` calls `notFound()` when brand is missing.
- In `shop/src/app/brands/[slug]/page.tsx`:
  - Fetch brand via `fetchBrandBySlug(slug)`. If null, call `notFound()`. Otherwise, call `permanentRedirect(`/products?brandSlug=${encodeURIComponent(slug)}`)`.

- [ ] **Step 10: Run test to verify passes**

Run: `cd shop && npx vitest run src/app/brands/[slug]/BrandShowcase.test.tsx`
Expected: PASS

---

### Task 3: Products Page & FilterSidebar Integration and Full Verification

**Files:**
- Modify: `shop/src/app/products/page.tsx`
- Modify: `shop/src/components/catalog/CatalogFilters.tsx`
- Modify: `shop/src/app/products/ProductsPage.test.tsx`

**Interfaces:**
- Consumes: Query params (`categoryId`, `categorySlug`, `brandId`, `brandSlug`).
- Produces: Resolved `initialFilters` for `FilterSidebar` so that pre-selection highlight is active for both IDs and slugs.

- [ ] **Step 1: Write failing test in `ProductsPage.test.tsx` for brand/category slug pre-selection**

Add test to `shop/src/app/products/ProductsPage.test.tsx` verifying that when `brandSlug="andre"` or `categorySlug="ham-bacon"` is passed in searchParams, `initialFilters` resolves the corresponding `brandId` and `categoryId` so the sidebar checkboxes are checked.

- [ ] **Step 2: Run test to verify failure**

Run: `cd shop && npx vitest run src/app/products/ProductsPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `shop/src/app/products/page.tsx` and `CatalogFilters.tsx`**

- In `shop/src/app/products/page.tsx`: Resolve `categorySlug` to matching category ID from `categories`, and `brandSlug` to matching brand ID from `brands` for `initialFilters`.
- In `shop/src/components/catalog/CatalogFilters.tsx`: Ensure `categorySlug` and `brandSlug` are stripped when filter selections change.

- [ ] **Step 4: Run test to verify passes**

Run: `cd shop && npx vitest run src/app/products/ProductsPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Full test suite verification**

Run: `cd shop && npm test`
Expected: All 23 test suites pass.

- [ ] **Step 6: Production build verification**

Run: `cd shop && npm run build`
Expected: Next.js production build succeeds with no type errors.
