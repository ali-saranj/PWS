# Tasks

## 1. Backend Schema, DTOs & Seed Data (`api/`)

- [x] 1.1 Create Flyway migration `api/src/main/resources/db/migration/V13__category_brand_seo_fields.sql` adding nullable `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa` columns to `category` and `brand`, plus initial `UPDATE ... WHERE slug = ...` seed copy for core categories and partner brands; verify Hibernate schema validation passes on API test run.
- [x] 1.2 Write/update failing API integration tests for admin and public category/brand SEO fields (create/update with SEO fields, blank-to-null normalization, public listing and slug endpoints returning SEO fields), then update `Category`, `CategoryRequest`, `CategoryDto`, `CategoryService`, `Brand`, `BrandRequest`, `BrandDto`, `BrandService`, and `PublicCatalogService` to pass `./mvnw -q verify` in `api/`.

## 2. Admin Back-Office SEO Fields (`admin/`)

- [x] 2.1 Add bilingual i18n keys (`seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`, and section title/hints) to `admin/src/i18n/fa.json` and `admin/src/i18n/en.json`, and update admin category/brand TypeScript types.
- [x] 2.2 Write Vitest tests in `admin/src/features/categories/CategoriesPage.test.tsx` and `admin/src/features/brands/BrandsPage.test.tsx` verifying optional SEO fields render and submit in `CategoryDialog` and `BrandDialog`, then implement the collapsible SEO section in both dialogs and verify `npm test && npm run lint && npm run build` pass in `admin/`.

## 3. Storefront Homepage, Local Schema & Wholesale SEO (`shop/`)

- [x] 3.1 Update `shop/src/app/HomePage.test.tsx` and `shop/src/lib/jsonLd.test.ts` (RED) to assert that homepage `<h1>` contains both «فروشگاه پروتئینی» and «پروتئین ایرانی», `GroceryStore` JSON-LD includes `alternateName`, Isfahan `areaServed`, and daily `openingHoursSpecification`, and homepage renders topical internal links; then update `HeroBanner.tsx`, `jsonLd.ts`, and `HomePageClient.tsx` to turn tests GREEN.
- [x] 3.2 Update `shop/src/app/TrustPages.test.tsx` (RED) for `/wholesale` metadata targeting «خرید عمده سوسیس و کالباس و مواد اولیه ساندویچی و فست‌فود» and verify `Footer.tsx` internal links; then update `wholesale/page.tsx` and `Footer.tsx` to pass tests.

## 4. Storefront Category & Brand Custom SEO Rendering (`shop/`)

- [x] 4.1 Update `shop/src/lib/serverCatalog.ts` interfaces (`CategoryItem`, `CategoryDetail`, `BrandItem`) with optional `seoTitle`, `seoDescription`, `seoH1`, `seoContentFa`, and write Vitest tests in `shop/src/app/products/ProductsPage.test.tsx` (RED) covering custom SEO override vs. null fallback for `generateMetadata`, `CatalogFilters` `<h1>`, and bottom SEO copy block.
- [x] 4.2 Update `shop/src/app/products/page.tsx` and `shop/src/components/catalog/CatalogFilters.tsx` so custom category/brand SEO fields override dynamic fallbacks cleanly and render plain-text `seoContentFa` below the product grid, then verify `npm test && npm run lint && npm run build` pass in `shop/`.
