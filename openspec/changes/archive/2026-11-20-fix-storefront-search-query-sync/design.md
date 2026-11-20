# Design

## Context

In Next.js 15 App Router, page components marked with `'use client'` run in the browser client lifecycle. Query parameters are managed through React context via the `useSearchParams()` hook. When a user navigates between query parameters (e.g., via `router.push('/search?q=...')`), Next.js updates the context read by `useSearchParams()` without recreating or passing new props to mounted page components.

Currently, `SearchPageContent` receives `searchParamsPromise` as a prop and attempts to reconcile it with `useSearchParams()` using a two-stage `useEffect` flow. Because `searchParamsPromise` is static from the initial render, `if (searchParamsPromise)` is always taken, ignoring `useSearchParams()` updates and keeping the search page locked to whatever query was loaded initially.

## Goals / Non-Goals

**Goals:**
- Eliminate `searchParamsPromise` and dual-effect state reconciliation in `SearchPageContent`.
- Derive search query `q` directly and synchronously from `useSearchParams().get('q')`.
- Ensure searching via the header bar or URL updates results immediately and cancels prior in-flight requests.
- Synchronize `Header.tsx` search input with the active search query when browsing `/search`.
- Update vitest test suite to cover multi-query transitions and verify query updates.

**Non-Goals:**
- Do not convert `SearchPage` into a Server Component (preserves client-side filter and sorting state architecture).
- Do not modify the backend search API or SQL queries (`PublicCatalogService` is already validated and functioning properly).

## Decisions

### Decision 1: Derive query synchronously via `useSearchParams()`
- **Approach**: Replace `const [resolvedQuery, setResolvedQuery] = useState('')` and the promise resolution effect with:
  ```tsx
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  ```
- **Rationale**: Synchronous read eliminates mount-time race conditions, avoids an initial empty query fetch, and ensures immediate reactivity whenever the URL changes.
- **Alternatives Considered**: Keeping `searchParamsPromise` but tracking query changes in an effect — rejected because Next.js does not update page props on client-side search parameter navigation, making any prop-based approach inherently stale.

### Decision 2: Single Reactive Data Fetching Effect
- **Approach**: Maintain a single fetch effect keyed on `query`:
  ```tsx
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const fetchSearchResults = async () => {
      try {
        const res = await api.get<{ items?: any[]; content?: any[] }>(
          `/api/shop/catalog/search?q=${encodeURIComponent(query)}`
        );
        const productList = res?.items || res?.content;
        if (!isCancelled && Array.isArray(productList)) {
          setProducts(productList);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local mock data
      }
      if (!isCancelled) {
        ...
        setLoading(false);
      }
    };

    fetchSearchResults();
    return () => {
      isCancelled = true;
    };
  }, [query]);
  ```
- **Rationale**: Automatically aborts previous stale in-flight requests via `isCancelled` flag and guarantees the displayed products match the active URL query.

### Decision 3: Sync Header input on navigation
- **Approach**: In `Header.tsx`, add an effect that synchronizes `searchQuery` state with `useSearchParams().get('q')` when on `/search`:
  ```tsx
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/search') {
      const q = searchParams.get('q') || '';
      setSearchQuery(q);
    }
  }, [pathname, searchParams]);
  ```
- **Rationale**: Prevents the search input from getting cleared or falling out of sync when the user navigates directly or clicks suggestions.

## Risks / Trade-offs

- **[Risk]** Existing unit tests in `SearchPage.test.tsx` pass `searchParams={Promise.resolve({ q: '...' })}` as a prop.
  → **Mitigation**: Update test suite to mock `useSearchParams()` with `new URLSearchParams(...)`, which reflects standard Next.js App Router testing conventions and cleans up test act warnings.
