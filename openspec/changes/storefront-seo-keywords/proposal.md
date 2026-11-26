# Proposal

## Why

The storefront's technical SEO foundation (`robots.txt`, `sitemap.xml`, self-referential canonicals, and basic JSON-LD) is in place, but on-page keyword targeting and local/commercial content depth are incomplete. Specifically, the homepage `<h1>` lacks the primary head keyword «فروشگاه پروتئینی» alongside the brand «پروتئین ایرانی», `GroceryStore` structured data lacks Isfahan local business signals, and category/brand catalog pages rely on generic metadata templates instead of admin-manageable SEO titles, descriptions, headings, and topical copy for high-intent keywords (e.g., sausages, cold cuts, bacon, pizza cheese, pickles, sauces, wholesale fast-food supplies, and partner brands).

## What Changes

- **Homepage & Local SEO Alignment (`shop/`)**:
  - Update `HeroBanner` `<h1>` to include both «فروشگاه پروتئینی» and «پروتئین ایرانی» without duplicating the keyword on subpages.
  - Enrich `Organization`/`GroceryStore` JSON-LD with `alternateName` (`فروشگاه پروتئینی پروتئین ایرانی`), `areaServed` (Isfahan), and daily `openingHoursSpecification` (`09:00`–`23:00`).
  - Add a concise homepage SEO intro and internal linking section targeting core product categories, partner brands, and `/wholesale` with descriptive Persian anchor text.
- **Database & Admin-Managed Category/Brand SEO (`api/`, `admin/`, `shop/`)**:
  - Add Flyway migration `V13__category_brand_seo_fields.sql` introducing nullable `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa` columns to `category` and `brand`, seeded with initial SEO copy for existing core categories and brands.
  - Expose these optional SEO fields in `api/` admin DTOs/requests (`CategoryDto`, `CategoryRequest`, `BrandDto`, `BrandRequest`) and public catalog DTOs (`PublicCategoryDto`, `PublicCategoryDetailDto`, `PublicBrandDto`).
  - Add an optional collapsible "SEO Settings" section in `admin/` `CategoryDialog` and `BrandDialog` with `fa.json` and `en.json` translations.
  - Update `shop/` `/products` `generateMetadata`, `CatalogFilters` `<h1>`, and bottom-of-catalog SEO copy block to use custom category/brand SEO fields when present, falling back to the existing dynamic templates when absent.
- **Wholesale & Internal Linking (`shop/`)**:
  - Optimize `/wholesale` metadata and headings for B2B fast-food and sandwich-shop raw material queries (`خرید عمده سوسیس و کالباس و مواد اولیه ساندویچی و فست‌فود`).
  - Ensure footer and trust-page internal links use consistent, non-cannibalizing anchor text.

## Capabilities

### New Capabilities
- None (extends existing catalog and storefront SEO capabilities).

### Modified Capabilities
- `catalog/categories`: Add optional SEO metadata fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`) to category persistence, admin management, and public category API responses.
- `catalog/brands`: Add optional SEO metadata fields (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`) to brand persistence, admin management, and public brand API responses.
- `storefront/seo`: Align homepage `<h1>` and `GroceryStore` JSON-LD for «فروشگاه پروتئینی | پروتئین ایرانی» and Isfahan local SEO; render custom category/brand SEO metadata, `<h1>`, and body copy on `/products` with graceful fallback; optimize `/wholesale` metadata and internal linking.

## Impact

- **Backend (`api/`)**: Flyway migration `V13`, `Category` & `Brand` entities, `CategoryService`/`BrandService`, `PublicCatalogService`, and integration tests.
- **Admin (`admin/`)**: `CategoryDialog.tsx`, `BrandDialog.tsx`, API client types, `fa.json` / `en.json` i18n keys, and Vitest specs.
- **Storefront (`shop/`)**: `HeroBanner.tsx`, `HomePageClient.tsx`, `jsonLd.ts`, `products/page.tsx`, `CatalogFilters.tsx`, `wholesale/page.tsx`, `Footer.tsx`, `serverCatalog.ts`, and Vitest specs.
