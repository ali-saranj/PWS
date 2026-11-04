# Design: Storefront Category Pages & Catalog Hierarchy

## Context

The backend already has `CategoryRepository` and a rich `PublicCatalogService` that handles descendant category queries (`getCategoryAndDescendantIds`). However, the public catalog API currently only offers brand listings and a product search/list endpoint, lacking dedicated endpoints for category listings and single-category metadata with breadcrumbs.

On the storefront (`shop/`), `src/app/categories/page.tsx` renders static mock data, while `src/app/category/[slug]/page.tsx` is an untyped Client Component with hardcoded fallback fixtures and mismatched query parameter keys.

See `proposal.md` for background context and motivation.

## Goals / Non-Goals

**Goals:**
- Provide public read-only API endpoints for listing active categories and fetching category metadata by slug with breadcrumbs and active subcategories.
- Implement server-side rendered storefront pages for `/categories` (hierarchical catalog directory) and `/category/[slug]` (responsive category product showcase).
- Keep filter state synchronized with browser URL query parameters (`brand`, `inStock`, `onSale`, `minPrice`, `maxPrice`, `sort`, `page`).
- Maintain full test coverage across API integration tests and Next.js / Vitest unit tests.

**Non-Goals:**
- Mutations or category editing (managed exclusively via staff admin endpoints under `/api/admin/categories`).
- Dynamic faceted count aggregation on the backend (e.g., Elasticsearch aggregation buckets).
- Category tree drag-and-drop or taxonomy re-ordering.

## Decisions

### 1. Dedicated Public Catalog Category Endpoints (Option A)
- **`GET /api/shop/catalog/categories`**:
  Returns `List<PublicCategoryDto>` (`id`, `nameFa`, `nameEn`, `slug`, `parentId`, `sortOrder`) for all active categories ordered by `sortOrder ASC, id ASC`.
- **`GET /api/shop/catalog/categories/{slug}`**:
  Returns `PublicCategoryDetailDto`:
  - Category core fields (`id`, `nameFa`, `nameEn`, `slug`, `parentId`, `sortOrder`)
  - `breadcrumbs`: Ordered list of `CategoryBreadcrumb(id, nameFa, slug)` from root ancestor down to current category.
  - `subcategories`: List of immediate active children (`PublicCategoryDto`) for subcategory navigation tabs/chips.
- **Alternatives Considered**: Returning full nested category tree in a single deeply nested response. Rejected to avoid redundant payload weight and keep the REST API straightforward and cacheable.

### 2. Next.js 15 Server Components with URL SearchParams
- `shop/src/app/category/[slug]/page.tsx` is implemented as an async React Server Component.
- Props receive `{ params: Promise<{ slug: string }>, searchParams: Promise<Record<string, string | string[] | undefined>> }` (Next.js 15 promise-based contract).
- The Server Component fetches category details and the filtered product page in parallel via `api.get` / `fetch`.
- If category fetch returns 404, invoke Next.js `notFound()`.
- Interactive filter controls (`FilterSidebar`, `SortDropdown`, subcategory chips) are client components that push URL updates via `useRouter` / `usePathname` / `useSearchParams`.

### 3. Categories Directory (`/categories`) Hierarchy Rendering
- `shop/src/app/categories/page.tsx` is an async Server Component fetching `GET /api/shop/catalog/categories`.
- Computes roots (`parentId == null` or parent not found) and organizes children beneath their corresponding parent.
- Renders responsive category cards with Persian typography, Lucide icons, and links to `/category/{slug}`.

## Risks / Trade-offs

- **[Risk] Multiple levels of category depth could cause deep breadcrumb recursion.**
  $\rightarrow$ *Mitigation*: Category depth in grocery/deli catalog is naturally shallow (1–3 tiers). Ancestor resolution in `PublicCatalogService` uses loop with visited set guard against circular parent references.
- **[Risk] Products in subcategories might be missed when querying parent category.**
  $\rightarrow$ *Mitigation*: Reuses existing `PublicCatalogService.getCategoryAndDescendantIds()` which recursively collects all descendant category IDs for the product filter.
- **[Risk] Search params change causes page re-fetching.**
  $\rightarrow$ *Mitigation*: Next.js App Router performs soft transitions preserving layout state while server re-rendering the product grid cleanly.
