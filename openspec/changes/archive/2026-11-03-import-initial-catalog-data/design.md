# Design

## Context
See `proposal.md` for background and business objectives.
The PWS monorepo stores monetary amounts strictly in Iranian Rials (`BIGINT`), with `/10` conversion to Tomans in the public presentation layer (`PublicCatalogService`).
Media files are stored on disk under `app.media.dir` (`api/.media`) and referenced via stem paths in `product_image.path` (with `-1600.webp` and `-400.webp` suffixes).

## Goals / Non-Goals

**Goals:**
- Provide a robust Flyway migration (`V11__initial_catalog_data.sql`) inserting canonical categories, brands, products, variants, wholesale tiers, and initial stock movements.
- Provide an automated catalog asset importer (`scripts/import-catalog.mjs`) that processes images from `product list/images/`, generates the 1600px and 400px WebP files in `api/.media/products/<productId>/<uuid>`, and creates corresponding `product_image` records.
- Ensure all prices are converted from Toman to Rials (`Toman * 10`).
- Ensure idempotency so running the migration or script multiple times does not duplicate or corrupt records.

**Non-Goals:**
- Modifying core database schema or entity models.
- Editing existing migration files `V1` through `V10`.

## Decisions

### 1. Dual-Path Initialization: Flyway `V11` + Asset Processing Script
- **Rationale**: Flyway is strictly responsible for relational database consistency and schema migrations across CI, dev, and production databases. Binary media processing belongs in an asset pipeline script (`scripts/import-catalog.mjs`) that reads the source markdown and high-res images, generates WebP renditions, copies them to `api/.media`, and inserts/updates `product_image` entries.
- **Alternatives Considered**: 
  - Embedding binary images in SQL: Rejected due to database bloat and performance degradation.
  - Doing image processing at API runtime: Rejected because runtime generation adds latency to first visits.

### 2. Pricing & Currency Invariants
- `variant.base_price`: `قیمت فروش ما (تومان) * 10`
- `variant.compare_at_price`: If `قیمت مصرف‌کننده (تومان)` > `قیمت فروش ما`, set to `قیمت مصرف‌کننده * 10`; otherwise `NULL`.
- `volume_tier.unit_price`: `قیمت عمده (تومان) * 10` with `min_qty` = `حداقل خرید عمده`.

### 3. Slugs and Naming Strategy
- Category and brand slugs are normalized to kebab-case English strings (e.g., `pickles`, `deli-meats`, `rahnamoud`, `soroush`).
- Product slugs follow the pattern `<brand-slug>-<sku-lowercase>`, ensuring uniqueness and search-engine friendly URLs.

### 4. Stock Reconciliation Invariant
- For every variant with `stock_on_hand > 0`, an initial row in `stock_movement` is inserted with `delta = stock_on_hand`, `reason = 'INITIAL'`, and note `'Initial catalog load'`.

## Risks / Trade-offs

- **[Missing images for certain deli products]** → Products without images (noted as "فاقد تصویر" in the markdown) will simply have no `product_image` rows; storefront will render default category placeholder.
- **[Persian file paths & encoding in images directory]** → Resolved using Unicode normalization (`NFC`) when reading and matching files from `product list/images/`.
- **[Flyway migration on existing dev databases]** → `INSERT ... ON CONFLICT (slug) DO NOTHING` and `ON CONFLICT (sku) DO NOTHING` guarantees idempotency without violating primary/unique key constraints.
