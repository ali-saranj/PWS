# Spec Delta

## Purpose
Provides initial production-grade catalog categories, brands, products, variants, volume tiers, stock movements, and processed imagery for the PWS store.

## ADDED Requirements

### Requirement: Production Catalog Categories and Brands Population
The catalog database MUST contain all canonical product categories and brands referenced in the grocery and deli product dataset.

#### Scenario: Categories are seeded with unique slugs
- **WHEN** catalog data initialization is completed
- **THEN** all distinct categories (such as pickles, pickled vegetables, olives, tomato paste, cheese, corn, semi-prepared potatoes, sauces, and sausages/deli meats) exist with unique URL slugs and valid Persian display names.

#### Scenario: Brands are seeded with unique slugs
- **WHEN** catalog data initialization is completed
- **THEN** all distinct brands (such as Rahnamoud, Soroush, Basani, Kalleh, Mazraeh Sabz, etc.) exist with unique URL slugs and valid Persian display names.

### Requirement: Products and Variant Pricing Consistency in Rials
Each product MUST have an associated active variant storing its SKU, packaging label, net weight in grams, and prices strictly converted to Iranian Rials.

#### Scenario: Variant pricing conversion
- **WHEN** a product variant is loaded from Toman amounts in the product list
- **THEN** `base_price` is stored as `Toman * 10` (Rials) and `compare_at_price` is stored as `Toman * 10` if greater than base price, or null if identical.

### Requirement: Wholesale Volume Tier Pricing
The catalog system MUST support wholesale volume discount tiers for products that define a minimum wholesale quantity and wholesale price.

#### Scenario: Volume tier insertion
- **WHEN** a product defines a minimum bulk purchase quantity (such as 2 or 4 units) and a wholesale price
- **THEN** a `volume_tier` record is associated with the variant having `min_qty` and `unit_price` in Rials (`wholesale_price_toman * 10`).

### Requirement: Initial Stock Movement Ledger Invariant
Every variant initialized with positive stock on hand MUST have an accompanying stock movement record to preserve ledger reconciliation.

#### Scenario: Initial stock movement recorded
- **WHEN** a variant is inserted with positive `stock_on_hand`
- **THEN** an `INITIAL` stock movement record is inserted with `delta = stock_on_hand` and reason `INITIAL`.

### Requirement: Product Image Ingestion and Rendition Generation
The media subsystem MUST store and link product photographs with both high-resolution (1600px) and thumbnail (400px) WebP renditions.

#### Scenario: Image renditions created and linked
- **WHEN** a product with a referenced image file is imported
- **THEN** the image is processed into 1600px and 400px WebP files under the media directory and a `product_image` record links the stem path to the product.
