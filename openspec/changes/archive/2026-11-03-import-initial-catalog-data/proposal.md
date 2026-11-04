# Proposal

## Why
The PWS store needs real production-grade catalog data to replace placeholder mock data. We have 63 categorized grocery and deli products in `product list/` with full specifications (SKU, brand, package type, net weight, retail price, wholesale price tier, stock, notes) and high-resolution product photography in `product list/images/`. Importing this dataset into the database and media store provides an immediate, functional catalog for the storefront and admin panels.

## What Changes
- Populate database tables (`category`, `brand`, `product`, `variant`, `volume_tier`, `stock_movement`, and `product_image`) with the 63 items from `product list/`.
- Provide an automated catalog data loader script (`scripts/import-catalog.mjs`) to process metadata, generate SEO slugs, convert Toman prices to Rials (`Toman * 10`), resize and convert product images into standard WebP assets (1600px large, 400px thumb) under the configured media directory, and record initial stock movements.
- Provide a permanent Flyway migration `V11__initial_catalog_data.sql` to ensure database schema and core seed rows remain reproducible across deployments.

## Capabilities

### New Capabilities
- `catalog/initial-data`: Baseline catalog data specification covering default categories, brands, production products, pricing in Rials, stock ledger entries, and optimized WebP product imagery.

### Modified Capabilities
None.

## Impact
- **Database**: Adds production catalog rows in `category`, `brand`, `product`, `variant`, `volume_tier`, `stock_movement`, and `product_image`.
- **Media Storage**: Generates standard WebP renditions (`<stem>-1600.webp` and `<stem>-400.webp`) in `api/.media/products/` matching `ProductImage` paths.
- **Storefront & Admin UI**: Real product listings, pricing, filters, wholesale discounts, and high quality imagery immediately render in both the shop storefront and admin catalog management.
