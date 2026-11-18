# Design

## Context

The customer storefront is built with Next.js 15 (App Router). In the App Router, search engine optimization relies on two core primitives:
1. `MetadataRoute` conventions (`app/robots.ts`, `app/sitemap.ts`) for crawler directives and dynamic sitemap feeds.
2. Server Component page lifecycles exporting `generateMetadata` for per-route dynamic `<head>` injection and rendering inline `<script type="application/ld+json">` tags.

Currently, `products/[slug]/page.tsx` is marked with `'use client'`, preventing Next.js from invoking `generateMetadata` on the server. Furthermore, no sitemap or robots routes exist, and the primary domain in `branding.ts` is configured with insecure `http://`.

## Goals / Non-Goals

**Goals:**
- Provide typed Next.js `MetadataRoute.Robots` (`shop/src/app/robots.ts`) and `MetadataRoute.Sitemap` (`shop/src/app/sitemap.ts`).
- Refactor `products/[slug]/page.tsx` into a Server Component with `generateMetadata`, server-side data prefetching via `serverCatalog.ts`, and Schema.org JSON-LD generation.
- Extract interactive product details (gallery, variant selector, quantity controls, cart actions) into `ProductDetailClient.tsx`.
- Inject root-level JSON-LD schemas (`Organization` and `WebSite` with `SearchAction`) in `shop/src/app/layout.tsx`.
- Consolidate URL canonicalization by permanently redirecting `/product/[slug]` to `/products/[slug]`.
- Update `branding.ts` to `https://proteinirany.ir`.

**Non-Goals:**
- Modifying Spring Boot API controllers or database schemas (existing catalog endpoints suffice).
- Editorial blog or news article SEO schemas (out of scope for this store change).
- Adding third-party tracking scripts (Google Analytics / Tag Manager).

## Decisions

### 1. Dynamic MetadataRoute Handlers vs Static Assets
- **Choice**: Implement `shop/src/app/robots.ts` and `shop/src/app/sitemap.ts` using Next.js App Router metadata conventions.
- **Rationale**: Next.js automatically maps these to `/robots.txt` and `/sitemap.xml`. The sitemap dynamically fetches active product, category, and brand slugs from the internal catalog API with `next: { revalidate: 3600 }`, eliminating manual sitemap maintenance.
- **Alternatives Considered**: Static `.xml` and `.txt` files in `public/` (rejected: stale over time as new inventory is published).

### 2. Server/Client Component Boundary for Product Details
- **Choice**: Server Component `shop/src/app/products/[slug]/page.tsx` fetching product data on the server via `fetchProductBySlug(slug)` and rendering `generateMetadata` + JSON-LD script, passing initial data to client-rendered `ProductDetailClient.tsx`.
- **Rationale**: Search engine crawlers (Googlebot) receive fully rendered titles, OpenGraph images, and structured JSON-LD in the raw HTML payload without executing client JavaScript bundles.
- **Alternatives Considered**: Keeping page as client-side and using third-party `<Helmet>` or `useEffect` DOM manipulation (rejected: ignored or de-prioritized by search crawlers).

### 3. Currency and Pricing Format in Schema.org
- **Choice**: Emit `priceCurrency: "IRR"` using `basePriceRials` for Google Rich Results compliance, while displaying Persian Toman formatting in human-readable UI.
- **Rationale**: Schema.org validators and Google Merchant / Shopping rich snippets strictly validate against ISO 4217 standard currency codes. Iranian Rial (`IRR`) is the recognized standard code.

### 4. Canonical Redirect Strategy for `/product/[slug]`
- **Choice**: Use `permanentRedirect('/products/' + slug)` with HTTP 308/301 status.
- **Rationale**: Completely prevents split link equity and Google Search Console duplicate page indexation warnings.

## Risks / Trade-offs

- **[Risk] Catalog API latency during sitemap generation** → **Mitigation**: Wrap API requests in try/catch blocks with fallbacks to static routes, set `revalidate = 3600` for ISR caching, and batch entity queries.
- **[Risk] Hydration mismatches between SSR product data and client cart store** → **Mitigation**: Pass server-fetched `ProductDetailData` as read-only initial props to `ProductDetailClient`. Dynamic cart quantities remain strictly hydrated on client mount.
- **[Risk] Missing image URLs in OpenGraph tags** → **Mitigation**: Supply absolute fallback image URLs (`https://proteinirany.ir/images/...`) whenever catalog products lack explicit image assets.
