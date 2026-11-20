# Proposal

## Why

When searching in the storefront, queries submitted from the header or entered via URL navigation are currently ignored on the `/search` page if the component already mounted or if initial query params were empty. Instead of updating to display products matching the new query, the page remains locked to the initial stale query (or empty query) and keeps displaying all catalog products or fallback items.

This occurs because `shop/src/app/search/page.tsx` is a client component that receives a stale `searchParamsPromise` prop from initial mount and checks `if (searchParamsPromise)` before the Next.js `useSearchParams()` hook, creating a dead code branch that prevents dynamic URL query parameter updates from re-triggering search results.

## What Changes

- Refactor `SearchPageContent` in `shop/src/app/search/page.tsx` to directly and synchronously derive `q` from `useSearchParams().get('q')`.
- Remove the asynchronous `searchParamsPromise` prop and dual `useEffect` reconciliation flow from `SearchPageContent` and `SearchPage`.
- Make the search fetch effect directly depend on the synchronous query string, eliminating the initial empty query fetch and race conditions.
- Sync the header search input in `shop/src/components/Header.tsx` with the current URL query parameter `q` when browsing `/search`.
- Update vitest test suite in `SearchPage.test.tsx` to verify that changing URL search parameters properly updates the displayed query and triggers fresh searches.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `storefront/search`: Adds requirements and scenarios for dynamic URL query synchronization, reactive query updates on client-side navigation, and search input synchronization.

## Impact

- `shop/src/app/search/page.tsx`: Eliminates `searchParamsPromise` dead branch; ensures immediate, reactive search updates on URL query changes.
- `shop/src/components/Header.tsx`: Keeps search input in sync with current URL search query.
- `shop/src/app/search/SearchPage.test.tsx`: Tests multi-query transitions and URL param updates.
- Zero breaking changes to backend API or contracts.
