# Tasks

## 1. Automated Tests for Query Synchronization (TDD RED)

- [x] 1.1 Add tests in `shop/src/app/search/SearchPage.test.tsx` for multi-query transitions and dynamic URL parameter updates, and verify they fail before implementation.
- [x] 1.2 Add unit tests in `shop/src/components/Header.test.tsx` verifying that the header search input synchronizes with the active search query on `/search`.

## 2. Storefront Search Synchronization Implementation (TDD GREEN)

- [x] 2.1 Refactor `SearchPageContent` in `shop/src/app/search/page.tsx` to derive `query` synchronously from `useSearchParams().get('q')`, eliminate `searchParamsPromise`, and bind `fetchSearchResults` directly to the active query string.
- [x] 2.2 Update `shop/src/components/Header.tsx` to synchronize `searchQuery` state with URL parameters when active on `/search`.

## 3. Verification & Build Integrity

- [x] 3.1 Run `npx vitest run src/app/search/SearchPage.test.tsx src/components/Header.test.tsx` and verify all tests pass without act warnings.
- [x] 3.2 Run `npm test` and `npm run build` in `shop/` to verify zero regression and build integrity.
