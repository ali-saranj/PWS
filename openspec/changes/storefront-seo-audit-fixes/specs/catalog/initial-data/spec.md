# Spec Delta

## ADDED Requirements

### Requirement: Customer-Facing Product Descriptions
Seeded product records in `product.description_fa` MUST contain clean, customer-facing Persian product copy free of internal QA or editorial notes, and MUST differentiate near-duplicate SKUs by packaging, weight, grade, or culinary use.

#### Scenario: No internal QA notes in product descriptions
- **WHEN** catalog migrations have been applied
- **THEN** no `product.description_fa` contains internal notes such as `فاقد تصویر`, `نیاز به بررسی`, `تصویر قبلی`, or `بررسی تطابق`.

#### Scenario: Unique differentiated descriptions for products
- **WHEN** a product detail page or `Product` JSON-LD renders `description_fa`
- **THEN** it displays meaningful Persian copy describing the product's characteristics, packaging/weight, and use-case rather than bare single-line SKU boilerplate.

### Requirement: Complete Category and Brand SEO Metadata
All seeded canonical categories and partner brands MUST have populated, non-cannibalizing `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa` values that accurately reflect actual catalog inventory and maintain a clear intent boundary with `/wholesale`.

#### Scenario: All nine categories have complete SEO metadata
- **WHEN** catalog migrations have been applied
- **THEN** all 9 canonical categories (`pickles`, `pickled-vegetables`, `olives`, `tomato-paste`, `cheese`, `corn`, `semi-prepared-potatoes`, `sauces-condiments`, `sausages-deli-meats`) have non-empty `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa`, and `sausages-deli-meats` references only brands present in the catalog.

#### Scenario: All fourteen partner brands have complete SEO metadata
- **WHEN** catalog migrations have been applied
- **THEN** all 14 seeded brands have non-empty `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa`.
