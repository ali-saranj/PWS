# Tasks

## 1. Persian Text Normalizer

- [x] 1.1 Write comprehensive unit tests in `api/src/test/java/ir/pws/store/common/text/PersianTextNormalizerTest.java` covering Arabic `ك/ي` folding, Alef forms, diacritics, ZWNJ variants, and digits.
- [x] 1.2 Implement `ir.pws.store.common.text.PersianTextNormalizer.java` and verify all tests pass with `./mvnw test -Dtest=PersianTextNormalizerTest`.

## 2. Backend Search Engine & Suggestion API

- [x] 2.1 Add integration tests in `PublicCatalogIntegrationTest.java` asserting title matches rank before description matches, Arabic/ZWNJ queries match, and progressive fallback matches tokens when strict AND yields 0.
- [x] 2.2 Update `PublicCatalogService.java` to compute relevance scores, order results by relevance, and progressively fall back from AND to OR on zero results.
- [x] 2.3 Implement `GET /api/shop/catalog/search/suggest` in `PublicCatalogController.java` and `PublicCatalogService.java`, returning top 6 suggestions, and verify with `PublicCatalogIntegrationTest`.
- [x] 2.4 Update admin product search in `ProductService.java` to split and normalize query tokens, and verify with `./mvnw test -Dtest=ProductApiTest`.

## 3. Storefront Autocomplete & Search Page

- [x] 3.1 Add component tests in `shop/src/components/Header.test.tsx` for live autocomplete dropdown debouncing, suggestion rendering, and keyboard accessibility.
- [x] 3.2 Implement live autocomplete dropdown in `shop/src/components/Header.tsx` with 250ms debouncing, keyboard navigation, and click-outside dismissal.
- [x] 3.3 Update `shop/src/app/search/page.tsx` to preserve API relevance sorting by default and improve zero-result empty state guidance.
- [x] 3.4 Verify storefront unit tests and type checks pass with `npm test` and `npm run build` in `shop/`.

## 4. End-to-End Verification

- [x] 4.1 Run full backend test suite (`./mvnw test`) and storefront test suite (`npm test`) to ensure zero regressions across the codebase.
- [x] 4.2 Validate the complete change artifacts with `openspec validate smart-search --strict`.
