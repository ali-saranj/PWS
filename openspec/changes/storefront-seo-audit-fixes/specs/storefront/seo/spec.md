# Spec Delta

## MODIFIED Requirements

### Requirement: Schema.org JSON-LD Structured Data
The storefront SHALL render Schema.org JSON-LD scripts in page HTML, providing `Organization` and `WebSite` with `SearchAction` at the root layout, and `Product`, `Offer` (with price in Iranian Rials, availability, SKU, and brand), and `BreadcrumbList` on product detail pages, using canonical `/products?categorySlug={slug}` URLs for category breadcrumb items whenever the category slug is available.

#### Scenario: Root layout organization and search schema
- **WHEN** any storefront page is loaded
- **THEN** the document includes JSON-LD structured data for `Organization` and `WebSite` specifying site search URL template `/search?q={search_term_string}`.

#### Scenario: Product detail rich snippet schema
- **WHEN** a valid product detail page is rendered
- **THEN** the page contains JSON-LD structured data with `@type: "Product"`, associated `brand`, `offers` with price and in-stock status, and a `BreadcrumbList` whose category item URL points to `https://proteinirany.ir/products?categorySlug={categorySlug}` when `categorySlug` is present (falling back to `categoryId` only when slug is unavailable).

## ADDED Requirements

### Requirement: Canonical Category Internal Linking Hygiene
The storefront SHALL use canonical `/products?categorySlug={slug}` URLs across homepage category links, product detail breadcrumbs, and catalog pagination links, and SHALL retain existing product `/products/{slug}` URLs without introducing slug redirects.

#### Scenario: Homepage SEO intro links to valid canonical category slugs
- **WHEN** the homepage SEO intro section renders category links
- **THEN** every category link targets an active canonical `/products?categorySlug={slug}` route (such as `sausages-deli-meats`, `cheese`, `pickles`, `pickled-vegetables`, and `sauces-condiments`) rather than non-existent slugs.

#### Scenario: Product detail breadcrumb links to canonical category slug
- **WHEN** a product detail page renders its breadcrumb navigation and `categorySlug` is available on the product or its breadcrumb trail
- **THEN** the category breadcrumb link targets `/products?categorySlug={categorySlug}` rather than `/products?categoryId={categoryId}`.

#### Scenario: Catalog pagination preserves categorySlug parameter
- **WHEN** `/products?categorySlug={slug}` renders pagination links for additional pages
- **THEN** the generated pagination URLs preserve `categorySlug={slug}` rather than rewriting the parameter to `categoryId`.
