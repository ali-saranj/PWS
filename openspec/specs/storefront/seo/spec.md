# storefront/seo Specification

## Purpose
Enables search engine discovery, crawling directives, real-time XML sitemaps, server-rendered dynamic metadata, and Schema.org JSON-LD rich snippets for the customer storefront.

## Requirements

### Requirement: Crawler Access and Robots Exclusion Directives
The storefront SHALL serve a robots exclusion protocol endpoint at `/robots.txt` via Next.js metadata route that permits crawling of public storefront routes, disallows private customer, internal search, and transactional endpoints (`/profile`, `/checkout`, `/auth`, `/track`, `/api/`, `/search`), and advertises the primary sitemap URL.

#### Scenario: Public crawler instructions
- **WHEN** a search engine crawler requests `/robots.txt`
- **THEN** the response allows root `/` and declares the sitemap reference `https://proteinirany.ir/sitemap.xml`.

#### Scenario: Private route exclusion
- **WHEN** a search engine crawler inspects the disallowed rules in `/robots.txt`
- **THEN** paths for `/profile`, `/checkout`, `/auth`, `/track`, `/api/`, and `/search` are explicitly disallowed.

### Requirement: Dynamic XML Sitemap Generation
The storefront SHALL serve a dynamic XML sitemap at `/sitemap.xml` via Next.js metadata route enumerating all static shopping pages, trust/legal pages, active categories, brands, and products retrieved from the catalog backend with appropriate priority and change frequency, strictly ensuring every listed URL resolves to an HTTP 200 OK final destination without redirects.

#### Scenario: Catalog entities in sitemap
- **WHEN** a crawler or user fetches `/sitemap.xml`
- **THEN** the XML document contains URLs for static pages, trust/legal pages (`/terms`, `/privacy`, `/returns`, `/faq`, `/how-to-order`, `/payment-methods`, `/shipping`, `/wholesale`), all active category filter paths (`/products?categorySlug={slug}`), brand filter paths (`/products?brandSlug={slug}`), and product slugs (`/products/{slug}`) prefixed with `https://proteinirany.ir`.

#### Scenario: No redirected routes in sitemap
- **WHEN** a search engine crawler inspects all URLs in `/sitemap.xml`
- **THEN** every URL resolves directly to HTTP 200 OK and no listed entry issues an HTTP 301, 302, 307, or 308 redirect.

#### Scenario: Sitemaps reflect entity priorities
- **WHEN** the sitemap entries are generated
- **THEN** the home page has priority `1.0`, products and categories have priority `0.8`, brand filter routes have priority `0.7`, and static auxiliary and trust pages have priority `0.5`.

### Requirement: Dynamic Product Metadata and OpenGraph Previews
The storefront product detail route (`/products/[slug]`) SHALL generate server-side metadata containing a localized document title with brand attribution, description with key deli attributes, self-referential canonical URL, and OpenGraph/Twitter Card preview tags.

#### Scenario: Server-rendered product page metadata
- **WHEN** a crawler or browser navigates to `/products/[slug]` for an existing product
- **THEN** the HTML contains a `<title>` including the product name and brand, a meta description, and an OpenGraph image tag pointing to the product photo.

#### Scenario: Canonical tag on product detail page
- **WHEN** an indexable product detail page is rendered
- **THEN** the document metadata contains a canonical URL pointing to `https://proteinirany.ir/products/[slug]`.

### Requirement: Schema.org JSON-LD Structured Data
The storefront SHALL render Schema.org JSON-LD scripts in page HTML, providing `Organization` and `WebSite` with `SearchAction` at the root layout, and `Product`, `Offer` (with price in Iranian Rials, availability, SKU, and brand), and `BreadcrumbList` on product detail pages.

#### Scenario: Root layout organization and search schema
- **WHEN** any storefront page is loaded
- **THEN** the document includes JSON-LD structured data for `Organization` and `WebSite` specifying site search URL template `/search?q={search_term_string}`.

#### Scenario: Product detail rich snippet schema
- **WHEN** a valid product detail page is rendered
- **THEN** the page contains JSON-LD structured data with `@type: "Product"`, associated `brand`, `offers` with price and in-stock status, and a `BreadcrumbList` reflecting the category path.

### Requirement: Canonical Routing and Alternate URL Consolidation
The storefront SHALL enforce singular canonical indexing by permanently redirecting alternate singular `/product/[slug]` paths to `/products/[slug]` with an HTTP 301 or 308 status code, SHALL ensure all internal product cards link directly to `/products/[slug]`, and SHALL emit explicit, uninherited self-referential canonical tags across all public storefront routes (homepage, catalog, paginated catalog, filtered catalog, directories, and auxiliary pages) to prevent search engine indexing collapse.

#### Scenario: Permanent redirect from singular to plural product path
- **WHEN** a client requests `/product/[slug]`
- **THEN** the server returns an HTTP 301 or 308 permanent redirect to `/products/[slug]`.

#### Scenario: Direct linking in product cards
- **WHEN** a product card is rendered on any storefront view
- **THEN** the thumbnail and title links target `/products/[slug]` directly without relying on `/product/[slug]` redirects.

#### Scenario: Root homepage explicit self-referential canonical
- **WHEN** a crawler or browser navigates to the storefront homepage `/`
- **THEN** the document metadata declares an explicit canonical URL pointing to `https://proteinirany.ir/` and root layout does not cascade this canonical URL onto child routes.

#### Scenario: Catalog list self-referential canonical
- **WHEN** a client navigates to `/products` without filter parameters and at page 0
- **THEN** the document metadata declares an explicit canonical URL pointing to `https://proteinirany.ir/products`.

#### Scenario: Paginated catalog self-referential canonical
- **WHEN** a client navigates to `/products` with `page` greater than 0
- **THEN** the document metadata declares an explicit canonical URL retaining the page query parameter rather than collapsing to the root catalog page.

#### Scenario: Filtered catalog self-referential canonical
- **WHEN** a client navigates to `/products?categorySlug={slug}` or `/products?brandSlug={slug}`
- **THEN** the document metadata declares an explicit canonical URL targeting the corresponding filtered catalog endpoint (`https://proteinirany.ir/products?categorySlug={slug}` or `https://proteinirany.ir/products?brandSlug={slug}`) matching the sitemap declaration.

#### Scenario: Static directories and auxiliary pages canonicals
- **WHEN** a client navigates to `/categories`, `/brands`, `/discounts`, `/about`, `/contact`, or any trust page
- **THEN** the document metadata declares an explicit self-referential canonical URL matching the exact request path rather than falling back to the root domain.

### Requirement: Dynamic Semantic Heading on Catalog
The storefront catalog page (`/products`) SHALL render a primary semantic `<h1>` tag in the DOM reflecting the currently active category filter, brand filter, or default catalog title to establish clear topical hierarchy for search engine crawlers and screen readers.

#### Scenario: Default catalog title
- **WHEN** the catalog page is rendered without category or brand filters
- **THEN** an `<h1>` tag containing the default title "همه محصولات و فرآورده‌های پروتئینی" is present in the document.

#### Scenario: Category filtered catalog heading
- **WHEN** the catalog page is rendered with a category filter
- **THEN** an `<h1>` tag containing the category name (e.g. "خرید انواع خیارشور و ترشیجات") is present in the document.

#### Scenario: Brand filtered catalog heading
- **WHEN** the catalog page is rendered with a brand filter
- **THEN** an `<h1>` tag containing the brand name (e.g. "محصولات برند کاله") is present in the document.
