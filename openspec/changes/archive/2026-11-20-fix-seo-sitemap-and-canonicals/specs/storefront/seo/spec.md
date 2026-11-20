# Spec Delta

## MODIFIED Requirements

### Requirement: Dynamic XML Sitemap Generation
The storefront SHALL serve a dynamic XML sitemap at `/sitemap.xml` via Next.js metadata route enumerating all static shopping pages, active categories, brands, and products retrieved from the catalog backend with appropriate priority and change frequency, strictly ensuring every listed URL resolves to an HTTP 200 OK final destination without redirects.

#### Scenario: Catalog entities in sitemap
- **WHEN** a crawler or user fetches `/sitemap.xml`
- **THEN** the XML document contains URLs for static pages, all active category filter paths (`/products?categorySlug={slug}`), brand filter paths (`/products?brandSlug={slug}`), and product slugs (`/products/{slug}`) prefixed with `https://proteinirany.ir`.

#### Scenario: No redirected routes in sitemap
- **WHEN** a search engine crawler inspects all URLs in `/sitemap.xml`
- **THEN** every URL resolves directly to HTTP 200 OK and no listed entry issues an HTTP 301, 302, 307, or 308 redirect.

#### Scenario: Sitemaps reflect entity priorities
- **WHEN** the sitemap entries are generated
- **THEN** the home page has priority `1.0`, products and categories have priority `0.8`, brand filter routes have priority `0.7`, and static auxiliary pages have priority `0.5`.

### Requirement: Canonical Routing and Alternate URL Consolidation
The storefront SHALL enforce singular canonical indexing by permanently redirecting alternate singular `/product/[slug]` paths to `/products/[slug]` with an HTTP 301 or 308 status code, and SHALL emit explicit, uninherited self-referential canonical tags across all public storefront routes (homepage, catalog, filtered catalog, directories, and auxiliary pages) to prevent search engine indexing collapse.

#### Scenario: Permanent redirect from singular to plural product path
- **WHEN** a client requests `/product/[slug]`
- **THEN** the server returns an HTTP 301 or 308 permanent redirect to `/products/[slug]`.

#### Scenario: Root homepage explicit self-referential canonical
- **WHEN** a crawler or browser navigates to the storefront homepage `/`
- **THEN** the document metadata declares an explicit canonical URL pointing to `https://proteinirany.ir/` and root layout does not cascade this canonical URL onto child routes.

#### Scenario: Catalog list self-referential canonical
- **WHEN** a client navigates to `/products` without filter parameters
- **THEN** the document metadata declares an explicit canonical URL pointing to `https://proteinirany.ir/products`.

#### Scenario: Filtered catalog self-referential canonical
- **WHEN** a client navigates to `/products?categorySlug={slug}` or `/products?brandSlug={slug}`
- **THEN** the document metadata declares an explicit canonical URL targeting the corresponding filtered catalog endpoint (`https://proteinirany.ir/products?categorySlug={slug}` or `https://proteinirany.ir/products?brandSlug={slug}`) matching the sitemap declaration.

#### Scenario: Static directories and auxiliary pages canonicals
- **WHEN** a client navigates to `/categories`, `/brands`, `/discounts`, `/about`, or `/contact`
- **THEN** the document metadata declares an explicit self-referential canonical URL matching the exact request path rather than falling back to the root domain.
