# Spec Delta

## MODIFIED Requirements

### Requirement: Schema.org JSON-LD Structured Data
The storefront SHALL render Schema.org JSON-LD scripts in page HTML, providing `Organization` (`GroceryStore`) with local Isfahan service metadata (`alternateName`, `areaServed`, `openingHoursSpecification`) and `WebSite` with `SearchAction` at the root layout, and `Product`, `Offer` (with price in Iranian Rials, availability, SKU, and brand), and `BreadcrumbList` on product detail pages.

#### Scenario: Root layout organization and search schema
- **WHEN** any storefront page is loaded
- **THEN** the document includes JSON-LD structured data for `Organization`/`GroceryStore` (including `alternateName` covering «فروشگاه پروتئینی پروتئین ایرانی», `areaServed` for Isfahan, and daily `openingHoursSpecification` 09:00–23:00) and `WebSite` specifying site search URL template `/search?q={search_term_string}`.

#### Scenario: Product detail rich snippet schema
- **WHEN** a valid product detail page is rendered
- **THEN** the page contains JSON-LD structured data with `@type: "Product"`, associated `brand`, `offers` with price and in-stock status, and a `BreadcrumbList` reflecting the category path.

### Requirement: Dynamic Semantic Heading on Catalog
The storefront catalog page (`/products`) SHALL render a primary semantic `<h1>` tag in the DOM reflecting the active category or brand custom `seoH1` when configured, or falling back to the active category name, brand name, or default catalog title to establish clear topical hierarchy for search engine crawlers and screen readers.

#### Scenario: Default catalog title
- **WHEN** the catalog page is rendered without category or brand filters
- **THEN** an `<h1>` tag containing the default title "همه محصولات و فرآورده‌های پروتئینی" is present in the document.

#### Scenario: Category filtered catalog heading
- **WHEN** the catalog page is rendered with a category filter
- **THEN** an `<h1>` tag containing the category's custom `seoH1` (if set) or the category name (e.g. "خرید انواع خیارشور و ترشیجات") is present in the document.

#### Scenario: Brand filtered catalog heading
- **WHEN** the catalog page is rendered with a brand filter
- **THEN** an `<h1>` tag containing the brand's custom `seoH1` (if set) or the brand name (e.g. "محصولات برند کاله") is present in the document.

## ADDED Requirements

### Requirement: Homepage Dual-Keyword H1 and Topical Internal Linking
The storefront homepage (`/`) SHALL include both «فروشگاه پروتئینی» and «پروتئین ایرانی» in its primary `<h1>` heading and SHALL render a concise topical introduction with internal links to core categories, partner brands, `/wholesale`, and `/shipping` using descriptive Persian anchor text, while subpages SHALL NOT use «فروشگاه پروتئینی» as their primary title keyword.

#### Scenario: Homepage H1 contains both primary keywords
- **WHEN** the homepage `/` is rendered
- **THEN** the single primary `<h1>` element contains both «فروشگاه پروتئینی» and «پروتئین ایرانی» and the document `<title>` remains `فروشگاه پروتئینی | پروتئین ایرانی`.

#### Scenario: Homepage internal links to priority clusters
- **WHEN** the homepage `/` is rendered
- **THEN** it includes crawlable internal links to core categories, `/brands`, `/wholesale`, and `/shipping`.

### Requirement: Category and Brand Custom SEO Metadata and Copy
The storefront catalog route (`/products`) SHALL use custom `seoTitle`, `seoDescription`, and `seoContentFa` from the resolved category or brand when present, and SHALL fall back cleanly to the existing dynamic metadata templates when any SEO field is null or empty.

#### Scenario: Custom SEO metadata overrides fallback on category or brand filter
- **WHEN** `/products?categorySlug={slug}` or `/products?brandSlug={slug}` is requested for an entity with non-empty `seoTitle`, `seoDescription`, or `seoContentFa`
- **THEN** `generateMetadata` emits the custom `seoTitle` and `seoDescription` and the page renders `seoContentFa` below the product grid.

#### Scenario: Null SEO fields fall back to dynamic template
- **WHEN** `/products?categorySlug={slug}` or `/products?brandSlug={slug}` is requested for an entity whose SEO fields are null
- **THEN** `generateMetadata` emits the existing dynamic title and description without rendering an empty SEO copy block.

### Requirement: Wholesale B2B SEO Metadata
The storefront wholesale route (`/wholesale`) SHALL expose metadata targeting bulk sausage, cold cuts, and fast-food/sandwich-shop raw material queries.

#### Scenario: Wholesale page metadata
- **WHEN** a crawler or browser requests `/wholesale`
- **THEN** the document metadata includes a title and description targeting «خرید عمده سوسیس و کالباس و مواد اولیه ساندویچی و فست‌فود» with self-referential canonical `https://proteinirany.ir/wholesale`.
