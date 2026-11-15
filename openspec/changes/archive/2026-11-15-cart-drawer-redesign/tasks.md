# Tasks

## 1. Automated Unit Tests (TDD - RED)

- [x] 1.1 Add failing unit tests in `shop/src/components/CartDrawer.test.tsx` asserting the 80×80px (`w-20 h-20`) thumbnail container, `aspect-square`, `shrink-0`, and image error fallback handling. Verify tests fail as expected (`npx vitest run src/components/CartDrawer.test.tsx`).

## 2. Cart Item & Drawer Redesign (GREEN)

- [x] 2.1 Update `shop/src/components/CartDrawer.tsx` to replace invalid `w-18 h-18` with `w-20 h-20` (80×80px), `aspect-square`, `shrink-0`, `rounded-xl`, and `object-cover`.
- [x] 2.2 Add `onError` fallback handling in `shop/src/components/CartDrawer.tsx` to gracefully fall back to `/images/products/placeholder-meat.svg` on broken or missing image URLs.
- [x] 2.3 Refine cart card padding, typography, unit price vs line total contrast, and quantity stepper controls.
- [x] 2.4 Verify all CartDrawer unit tests pass (`npx vitest run src/components/CartDrawer.test.tsx`).

## 3. Integration Verification & Build Quality

- [x] 3.1 Run complete storefront test suite (`npm --prefix shop test`) and verify 100% tests pass.
- [x] 3.2 Run storefront linter (`npm --prefix shop run lint`) and typecheck/build (`npm --prefix shop run build`) and confirm zero regressions.
