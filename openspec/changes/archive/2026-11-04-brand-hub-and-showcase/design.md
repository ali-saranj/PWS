# Design

## Context
See `proposal.md` for background and user rationale. The storefront currently presents a hardcoded brand page (`shop/src/app/brands/page.tsx`) without real logo rendering or brand-specific product filtering. The backend already contains active brands in PostgreSQL with `logo_path` and supports filtering products by `brandSlug` on `/api/shop/catalog/products`. Exposing `logoUrl` on public brand DTOs, adding single-brand slug resolution, and building the dedicated `/brands/[slug]` storefront page closes the feature gap cleanly.

## Goals / Non-Goals

**Goals:**
- Extend `PublicBrandDto` to include `logoUrl` (derived from `logo_path` and `mediaBaseUrl`).
- Provide `GET /api/shop/catalog/brands/{slug}` returning `PublicBrandDto` or 404 `NOT_FOUND` if absent or inactive.
- Re-architect storefront `shop/src/app/brands/page.tsx` as a responsive live directory with search filtering and logo visuals.
- Build storefront `shop/src/app/brands/[slug]/page.tsx` as a full brand showcase page equipped with breadcrumbs, brand identity header, category filters, price range, in-stock toggle, sorting, and responsive product cards with pagination.
- Add comprehensive backend integration tests and frontend Vitest tests.

**Non-Goals:**
- Adding brand editorial CMS fields (rich description, brand story, hero banner) to the database; we keep existing schema intact and focus on logo + names + catalog.
- Modifying Admin brand management (`/admin/brands`), which is already operational.

## Decisions

### 1. Dedicated Brand Resolution Endpoint vs Client-Side Array Lookup
- **Decision**: Add `GET /api/shop/catalog/brands/{slug}` in `PublicCatalogController` and `PublicCatalogService`.
- **Rationale**: Direct RESTful resolution returns proper 404 status codes, avoids fetching the entire brand list on server-rendered brand pages, and enables independent caching and SEO metadata generation.
- **Alternatives Considered**: Fetching all brands in Next.js and matching `slug` client-side. Rejected because it wastes bandwidth and makes metadata generation fragile.

### 2. Storefront Brand Showcase Structure
- **Decision**: Implement `/brands/[slug]` using the same robust catalog layout pattern as `/category/[slug]`:
  - Server fetch for initial brand verification (`fetchBrandBySlug`) with Next.js `notFound()` fallback.
  - Interactive client shell for faceted filtering (`FilterSidebar`), sort options (`SortDropdown`), and product grid (`ProductCard`).
- **Rationale**: Provides consistent UX and reuse of battle-tested components (`FilterSidebar`, `ProductCard`, `SortDropdown`, `Pagination`).

### 3. Graceful Logo Fallbacks
- **Decision**: When `logoUrl` is null or fails to load, render an SVG monogram avatar with the brand's first Persian/English letter over an emerald tint.
- **Rationale**: Prevents broken image icons and maintains visual polish even for newly added brands without logos.

## Risks / Trade-offs

- **[Risk]** Media path resolution for brand logos across environments.
  - *Mitigation*: Use configured `mediaBaseUrl` (defaults to `/media`), matching `BrandService` and `ProductImageService`. The Next.js shop already proxies `/media` or connects to API static assets.
- **[Risk]** Brand with zero products showing an empty page.
  - *Mitigation*: Render an empty state component with a clear message and a button returning to the brand directory (`/brands`).
