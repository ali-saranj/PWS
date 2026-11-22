# Tasks

## 1. Related Products Resolver Logic (TDD)

- [x] 1.1 Write unit tests in `shop/src/lib/serverCatalog.test.ts` for `resolveRelatedProducts` covering category matching, same-brand prioritization, current product exclusion, and graceful mock fallback; verify tests fail initially (RED)
- [x] 1.2 Implement `resolveRelatedProducts` in `shop/src/lib/serverCatalog.ts` with brand/category affinity ranking and mock catalog fallback; verify unit tests pass (GREEN)

## 2. Server-Side Page and Client View Integration

- [x] 2.1 Update `shop/src/app/products/ProductDetailPage.test.tsx` with test cases verifying real related products are rendered and no fake slugs (`related-1`, `related-2`) exist in DOM; verify tests fail (RED)
- [x] 2.2 Update `shop/src/app/products/[slug]/page.tsx` to fetch related products server-side via `resolveRelatedProducts` and pass `initialRelated` to `ProductDetailView`
- [x] 2.3 Refactor `shop/src/components/product/ProductDetailView.tsx` to accept `initialRelated`, remove hardcoded `defaultRelated` synthetic items, and initialize state cleanly without hydration layout shifts; verify PDP tests pass (GREEN)

## 3. End-to-End Verification

- [x] 3.1 Run Vitest test suite `npx vitest run src/app/products/ProductDetailPage.test.tsx src/lib/serverCatalog.test.ts` in `shop/` and confirm all tests pass
- [x] 3.2 Run linter and typecheck via `npm run lint` in `shop/` to ensure no linting or TypeScript errors remain

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
