# catalog/search Specification

## Purpose
Provides resilient Persian text normalization, relevance-ranked product search, zero-result progressive fallback, and quick search suggestions across the catalog API.

## Requirements

### Requirement: Persian Text Normalization
The catalog search engine SHALL normalize input text and stored target fields by folding Arabic letters to Persian equivalents, standardizing alef forms, handling half-spaces (ZWNJ), stripping diacritics, and converting Persian/Arabic digits.

#### Scenario: Arabic character folding
- **WHEN** a customer searches with Arabic kaf "ك" or Arabic yeh "ي"
- **THEN** the search engine matches products written with Persian "ک" and "ی"

#### Scenario: Half-space (ZWNJ) flexibility
- **WHEN** a customer searches for a compound word with a space, half-space, or no space (e.g., "هات داگ", "هات‌داگ", or "هاتداگ")
- **THEN** the search engine matches the corresponding product regardless of the internal spacing variation

#### Scenario: Persian and Arabic digits normalization
- **WHEN** a search query contains Persian or Arabic numerals (e.g., "۹۰" or "۹۰٪")
- **THEN** the search engine matches products containing both Persian and ASCII Latin numeral representations

### Requirement: Relevance-Ranked Catalog Search
The catalog search endpoint SHALL rank matching products primarily by match relevance, weighting exact product title and SKU matches higher than brand/category matches, and brand/category matches higher than description matches.

#### Scenario: Title match takes precedence over description match
- **WHEN** a search term appears in Product A's nameFa and in Product B's descriptionHtml
- **THEN** Product A appears before Product B in the returned search results list

#### Scenario: Brand and category match
- **WHEN** a search term matches an active brand name or category name
- **THEN** products associated with that brand or category are included in the results

### Requirement: Progressive Match Fallback
The catalog search query SHALL attempt a multi-token Boolean AND match first, and if zero products match all tokens, SHALL progressively fall back to weighted Boolean OR matching.

#### Scenario: All tokens match
- **WHEN** all query tokens match product attributes
- **THEN** only products matching all tokens are returned

#### Scenario: Progressive fallback on zero matches
- **WHEN** a multi-token query returns zero results under strict Boolean AND logic
- **THEN** the search engine returns products matching a subset of tokens ranked by the number and weight of matched tokens

### Requirement: Quick Search Suggestions Endpoint
The catalog API SHALL expose a lightweight suggestion endpoint at GET /api/shop/catalog/search/suggest returning up to 6 matching active products.

#### Scenario: Retrieve quick suggestions
- **WHEN** a client sends GET /api/shop/catalog/search/suggest?q=سوسیس
- **THEN** the API returns a JSON list of up to 6 active products containing id, slug, nameFa, thumbnailUrl, priceToman, and categoryNameFa
