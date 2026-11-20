# Proposal

## Why

Product search across the PWS storefront and back-office currently suffers from orthographic mismatches, lack of relevance ranking, and absence of an interactive autocomplete experience:
1. Persian/Arabic letter variants (e.g. `ک`/`ك`, `ی`/`ي`), half-space / ZWNJ (نیم‌فاصله `\u200C`), and diacritics cause search queries to miss matching products.
2. The search backend requires strict Boolean `AND` across all tokens with no fuzzy or relaxed fallback, leading to zero-result dead-ends for multi-word queries.
3. Search results are ordered strictly by creation timestamp (`createdAt DESC`) rather than relevance; matches in the product title carry the same weight as mentions buried inside long HTML descriptions.
4. The storefront header search bar requires a full form submit and page navigation to `/search?q=...` without live suggestions or autocomplete previews.

Now that the product catalog and customer traffic are active, delivering fast, resilient Persian search and instant discovery directly drives conversion and customer satisfaction.

## What Changes

- Introduce a robust Persian text normalizer (`PersianTextNormalizer`) to unify Arabic/Persian letters (`ك/ک`, `ي/ی`), fold alef forms (`آ/أ/إ/ا`), handle zero-width non-joiner (ZWNJ / نیم‌فاصله) variants, strip diacritics (اعراب), and map Persian/Arabic digits.
- Upgrade the catalog search engine in `PublicCatalogService`:
  - Calculate relevance ranking: weight exact Title / SKU matches higher than Brand/Category matches, which rank higher than description matches.
  - Progressive match fallback: execute multi-token `AND` matching first; if zero results are found, fall back to weighted `OR` matching instead of an empty dead-end.
- Introduce a dedicated lightweight search suggestion endpoint: `GET /api/shop/catalog/search/suggest?q=...` returning top 5-6 matching products.
- Upgrade the admin product list query from full-phrase `LIKE` to tokenized, normalized matching across title and SKU.
- Upgrade the Storefront Header (`Header.tsx`):
  - Add an interactive, debounced (250ms) live autocomplete dropdown showing product thumbnails, titles, portion/weight labels, and prices in Toman.
  - Support keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) and outside-click dismissal.
  - Include a direct link to "مشاهده همه نتایج" (View all results).
- Refactor Storefront Search Page (`shop/src/app/search/page.tsx`):
  - Preserve backend relevance ranking as default sort order rather than forcing client-side re-sort by product ID.
  - Improve empty-state guidance with helpful suggestions.

## Capabilities

### New Capabilities
- `catalog/search`: Covers backend Persian text normalization, multi-token matching, relevance ranking, progressive `AND` -> `OR` fallback, and suggestion API.
- `storefront/search`: Covers storefront live autocomplete search dropdown, keyboard accessibility, and relevance-preserving search results page.

### Modified Capabilities
None.

## Impact

- **Backend (`api/`)**:
  - `ir.pws.store.common.text.PersianTextNormalizer` added for reusable Persian orthography processing.
  - `PublicCatalogService` and `PublicCatalogController` updated with relevance scoring, fallback matching, and `/suggest` endpoint.
  - `ProductService` updated with tokenized search for admin catalog.
- **Frontend (`shop/`)**:
  - `shop/src/components/Header.tsx` updated with debounced live autocomplete dropdown.
  - `shop/src/app/search/page.tsx` updated to respect backend relevance ranking and improve empty states.
- **Dependencies & Performance**:
  - No external search engine dependency (e.g. Elasticsearch/Solr) needed; implemented using optimized PostgreSQL queries and Java normalization.
  - Zero breaking changes to existing endpoints.
