# Tasks

## 1. Catalog Migration & SQL Seeding

- [x] 1.1 Parse `product list/لیست_محصولات_تبدیل_شده.md` to extract all 63 products with categories, brands, packaging, Rials prices, wholesale tiers, and stock; verify parsing output with node script.
- [x] 1.2 Generate idempotent Flyway migration `api/src/main/resources/db/migration/V11__initial_catalog_data.sql` inserting categories, brands, products, variants, volume tiers, and initial stock movements; verify file syntax and line count.

## 2. Media Asset Processing Pipeline

- [x] 2.1 Create asset importer script `scripts/import-catalog.mjs` that resizes source images from `product list/images/` into 1600px large and 400px thumb WebP files in `api/.media/products/` and links them into `product_image`.
- [x] 2.2 Run the image asset pipeline to generate WebP renditions and verify generated files exist in `api/.media/products/`.

## 3. Verification & Regression Testing

- [x] 3.1 Execute Maven unit and integration tests (`./mvnw -q test -Dtest=DevSeedTest,ProductApiTest,PublicCatalogIntegrationTest`) to verify V11 migration compatibility and zero regressions.
- [x] 3.2 Verify public catalog endpoint returns the new categories, brands, and products.

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify the archived result.
