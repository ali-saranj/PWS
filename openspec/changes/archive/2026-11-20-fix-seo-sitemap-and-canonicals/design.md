# Design

## Context
See `proposal.md` for motivation. Currently, Next.js metadata inheritance causes `alternates: { canonical: '/' }` in `layout.tsx` to bleed into all downstream routes that lack explicit metadata. Concurrently, `sitemap.ts` emits `/category/[slug]` and `/brands/[slug]` routes that return HTTP 308 permanent redirects to `/products?categorySlug={slug}` and `/products?brandSlug={slug}`, causing Google Search Console to reject sitemap referrals and collapse indexed URLs into the homepage.

## Goals / Non-Goals

**Goals:**
- Decouple canonical inheritance by removing root layout `alternates.canonical` and defining explicit self-referential canonical tags on each public route.
- Implement server-side dynamic metadata for `/products` resolving category and brand titles, descriptions, and facet-specific canonical URLs.
- Provide explicit canonical tags on static directory and auxiliary routes (`/categories`, `/brands`, `/discounts`, `/about`, `/contact`).
- Eliminate all HTTP 308 redirect URLs from `sitemap.xml`, generating strictly 200 OK canonical catalog and detail URLs.

**Non-Goals:**
- Reverting the consolidated navigation architecture back to separate `/category/[slug]` and `/brands/[slug]` showcase pages (browsing remains on `/products`).
- Altering robots exclusion directives for private authenticated routes (`/profile`, `/checkout`, `/auth`, `/track`).

## Decisions

### 1. Root Layout Canonical Removal vs Global Route Map
- **Choice**: Remove `alternates: { canonical: '/' }` from `shop/src/app/layout.tsx`. Keep `metadataBase: new URL(BRAND.domain)`. Set `alternates: { canonical: 'https://proteinirany.ir/' }` explicitly in `shop/src/app/page.tsx`.
- **Rationale**: Next.js App Router metadata shallow-merges top-level metadata keys, but nested keys like `alternates.canonical` inherit unless an explicit override is provided. Removing it from `layout.tsx` ensures forgotten pages do not falsely claim to be duplicates of `/`.
- **Alternatives considered**:
  - Keeping `canonical: '/'` in `layout.tsx` and overriding on every single route: Fragile because any future page or route added without explicit metadata would immediately regress to canonical `/`.

### 2. Catalog Canonical Handling for Facets (`/products`)
- **Choice**: In `shop/src/app/products/page.tsx`, export `generateMetadata({ searchParams })`:
  - When `categorySlug` (or `categoryId`) is present: resolve category name for Title (`خرید انواع {nameFa} | پروتئین ایرانی`) and emit `canonical: 'https://proteinirany.ir/products?categorySlug={slug}'`.
  - When `brandSlug` (or `brandId`) is present: resolve brand name for Title (`محصولات برند {nameFa} | پروتئین ایرانی`) and emit `canonical: 'https://proteinirany.ir/products?brandSlug={slug}'`.
  - When no primary facet is present: emit Title (`همه محصولات | پروتئین ایرانی`) and `canonical: 'https://proteinirany.ir/products'`.
  - Secondary/ephemeral query parameters (e.g. `page`, `sort`, `minPrice`, `maxPrice`) do not alter the canonical URL, consolidating faceted search equity onto the clean primary facet.
- **Rationale**: Preserves search equity for top-level categories and brand listings while preventing duplicate content crawl traps from pagination and price sorting.
- **Alternatives considered**:
  - Setting canonical of all `/products?...` variations strictly to `/products`: Destroys Google indexing for specific categories and brands since Google would discard them as duplicates of the root catalog.

### 3. XML Sitemap Clean Destination URLs
- **Choice**: Update `shop/src/app/sitemap.ts` to generate:
  - `${baseUrl}/products?categorySlug=${encodeURIComponent(c.slug)}` (priority 0.8)
  - `${baseUrl}/products?brandSlug=${encodeURIComponent(b.slug)}` (priority 0.7)
  - `${baseUrl}/products/${encodeURIComponent(p.slug)}` (priority 0.8)
  - Static root and directory routes (`${baseUrl}`, `${baseUrl}/products`, `${baseUrl}/categories`, `${baseUrl}/brands`, `${baseUrl}/discounts`, `${baseUrl}/about`, `${baseUrl}/contact`).
- **Rationale**: Google Sitemaps protocol strictly requires 200 OK destination URLs. Sitemaps containing 301/308 redirects are penalized or ignored by Googlebot.
- **Alternatives considered**:
  - Excluding categories and brands from `sitemap.xml` altogether: Drastically harms organic discovery of the deli store's primary categories (سوسیس، کالباس، ترشیجات) and manufacturer brands.

## Risks / Trade-offs

- **[Risk]** Existing backlinks pointing to `/brands/[slug]` or `/category/[slug]`.
  - **Mitigation**: Existing 308 redirects on `/brands/[slug]` and `/category/[slug]` remain intact to preserve external inbound links, but sitemaps and canonicals explicitly declare the destination URLs.
- **[Risk]** Next.js URL parameter encoding differences (e.g., Persian characters in slugs).
  - **Mitigation**: Standardize on `encodeURIComponent(slug)` across both `sitemap.ts` and `generateMetadata` canonical tags so URLs match character-for-character.
