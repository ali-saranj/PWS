# Proposal

## Why
Currently, the storefront's brand directory (`/brands`) is a static mock with hardcoded brands and lacks dynamic brand logo integration and real database synchronization. Furthermore, customers have no dedicated brand showcase page (`/brands/[slug]`) to discover, filter, and purchase products produced by their favorite brands. Providing a dynamic brand directory and dedicated brand showcase pages completes the brand shopping journey and leverages the existing backend catalog infrastructure.

## What Changes
- Enhance the public catalog API to expose `logoUrl` in `PublicBrandDto` and provide `GET /api/shop/catalog/brands/{slug}` for single-brand metadata resolution.
- Transform the storefront `/brands` route into a dynamic, responsive directory that loads live active brands from the API, presents brand logos and Persian/English names, and supports real-time search/filtering.
- Implement the storefront `/brands/[slug]` showcase page with brand header information (logo, bilingual titles), breadcrumbs, interactive filters (in-stock status, price range, categories), sorting, and responsive product cards with pagination.
- Add frontend client/server catalog fetch utilities for brand lookup and product listing by brand slug.

## Capabilities

### New Capabilities
- `catalog/brands`: Defines public brand discovery, brand metadata resolution by slug including logo exposure, dynamic brand directory rendering, and brand-specific catalog product showcase with interactive filtering and sorting.

### Modified Capabilities
None.

## Impact
- **Backend API (`api`)**:
  - `ir.pws.store.catalog.PublicCatalogService`: Update `PublicBrandDto` to include `logoUrl`, add `getBrandBySlug(String slug)` returning `PublicBrandDto`.
  - `ir.pws.store.catalog.PublicCatalogController`: Expose `GET /api/shop/catalog/brands/{slug}`.
  - Tests: `ir.pws.store.catalog.PublicCatalogIntegrationTest`.
- **Frontend Storefront (`shop`)**:
  - `shop/src/lib/serverCatalog.ts`: Extend `BrandItem` with `logoUrl`, add `fetchBrandBySlug(slug: string)`.
  - `shop/src/app/brands/page.tsx`: Replace static mock with dynamic SSR/Client brand directory.
  - `shop/src/app/brands/[slug]/page.tsx`: New dedicated brand showcase page with breadcrumbs, brand header, catalog filters, and product grid.
