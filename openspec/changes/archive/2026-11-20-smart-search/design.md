# Design

## Context

See `proposal.md` for motivation and background. The PWS platform currently uses Spring Boot 3.5 with PostgreSQL 16 on the backend and Next.js 15 on the storefront. Currently, `PublicCatalogService.search()` performs basic substring matching (`LIKE %token%`) with unweighted ordering (`createdAt DESC`).

## Goals / Non-Goals

**Goals:**
- Provide normalized Persian text matching covering Arabic/Persian letter variants (`ك/ک`, `ي/ی`), alef forms, half-spaces (ZWNJ `\u200C`), diacritics, and numbers.
- Rank search results by relevance (title > brand/category > description).
- Implement progressive fallback from strict `AND` to relaxed `OR` when multi-word queries produce zero results.
- Expose a lightweight `/suggest` endpoint for instant autocomplete.
- Build an accessible, debounced live search dropdown in the storefront header.

**Non-Goals:**
- Deploying external search clusters (Elasticsearch, Meilisearch, Solr) - PostgreSQL and Spring Boot provide more than sufficient performance for this catalog scale.
- Full Persian NLP lemmatization or phonetic indexing.

## Decisions

### 1. In-Memory Java Persian Text Normalization
* **Decision**: Create `ir.pws.store.common.text.PersianTextNormalizer` to handle text cleaning and token expansion.
* **Details**:
  - Arabic yeh (`\u064A`, `\u0649`) -> Persian yeh (`\u06CC`).
  - Arabic kaf (`\u0643`) -> Persian keheh (`\u06A9`).
  - Alef variants (`\u0622` آ, `\u0623` أ, `\u0625` إ) -> bare alef (`\u0627` ا).
  - Strips Arabic/Persian harakat/diacritics (`\u064B` to `\u0652`).
  - Handles ZWNJ (`\u200C`): treats ZWNJ as a word separator or produces dual search tokens (e.g. `هات‌داگ` maps to `هات داگ` and `هاتداگ`).
  - Reuses `Digits.toLatin` for Persian and Arabic numeral conversion.
* **Alternatives Considered**:
  - PostgreSQL full-text search dictionaries: Requires custom database extensions/dictionaries not portably available across embedded Zonky DB test environments.

### 2. Relevance Scoring in JPA / PostgreSQL Query
* **Decision**: Compute dynamic relevance scores using conditional criteria / `CASE` expressions:
  - Exact or prefix match on `nameFa`: Score 100
  - Contains match on `nameFa`: Score 50
  - Brand or Category name match: Score 25
  - Description match: Score 5
* **Ordering**: Results ordered by `score DESC`, followed by `id DESC`.
* **Alternatives Considered**:
  - Post-filtering in memory: Breaks pagination across multiple database pages. Scoring in the query maintains correct pagination.

### 3. Progressive Fallback Matching (AND -> OR)
* **Decision**: When a multi-token query returns 0 results under strict `AND`, execute a fallback query with `OR` predicates ordered by match score.
* **Rationale**: Prevents harsh zero-result pages when a shopper enters a long or slightly descriptive query (e.g. `سوسیس گوشت ۹۰ درصد کاله`).

### 4. Search Suggestion Endpoint
* **Endpoint**: `GET /api/shop/catalog/search/suggest?q={term}`
* **Response**: Lightweight list of up to 6 items:
  ```json
  [
    {
      "id": 101,
      "slug": "andre-turkey-ham-90",
      "nameFa": "ژامبون بوقلمون ۹۰٪ آندره",
      "thumbnailUrl": "/media/products/101.jpg",
      "priceToman": 240000,
      "categoryNameFa": "کالباس و ژامبون"
    }
  ]
  ```
* **Performance**: Skips heavy pagination counts, limits directly to 6 rows, executes under 15ms.

### 5. Storefront Header Dropdown Architecture
* **Component**: Enhanced `Header.tsx` or modular `SearchAutocomplete.tsx`.
* **State Management**:
  - `query`: Current text input.
  - `debouncedQuery`: Value updated after 250ms of typing inactivity.
  - `suggestions`: Array of products returned by `/api/shop/catalog/search/suggest`.
  - `isOpen`: Boolean controlling dropdown visibility.
* **Interactions**:
  - Click outside or `Escape`: Closes overlay.
  - Keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`): Highlighting and selection.
  - Footer link: "مشاهده همه نتایج" navigating directly to `/search?q={query}`.

## Risks / Trade-offs

- **[Risk]** Heavy `LIKE` queries with multiple `OR` branches on large catalogs could impact database query times.
  - **Mitigation**: Filter early on `status = 'ACTIVE'` and limit suggest queries to `size = 6`. Local and production indexes on `name_fa`, `status`, and foreign keys ensure sub-20ms response times.
- **[Risk]** Multi-word queries with many tokens could generate large queries.
  - **Mitigation**: Cap search tokens to a maximum of 8 words.
