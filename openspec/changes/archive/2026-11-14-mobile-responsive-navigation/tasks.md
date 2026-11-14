# Tasks

## 1. Mobile Bottom Navigation Component

- [x] 1.1 Create unit tests in `shop/src/components/BottomNav.test.tsx` verifying navigation links (Home, Categories, Profile), active route styling, and CartDrawer trigger with Persian badge count. Verify tests fail initially (RED).
- [x] 1.2 Implement `shop/src/components/BottomNav.tsx` with fixed bottom positioning (`md:hidden`), Lucide icons (`Home`, `LayoutGrid`, `ShoppingCart`, `User`), active route detection via `usePathname()`, and cart badge integration from `cartStore`. Verify `BottomNav.test.tsx` passes (GREEN).
- [x] 1.3 Mount `BottomNav` in `shop/src/app/layout.tsx` and add bottom spacing (`pb-16 md:pb-0`) to `<main>` so content is never obscured. Verify layout builds and renders without console or hydration warnings.

## 2. Mobile Sticky Header & Slide-Over Drawer

- [x] 2.1 Update `shop/src/components/Header.test.tsx` to add test cases for compact brand title on mobile, inline search form submission, and slide-over menu drawer toggling. Verify tests fail for new assertions (RED).
- [x] 2.2 Refactor `shop/src/components/Header.tsx` to render compact brand text ("سبد سبز") on mobile, inline search input in the primary row (`flex-1`), and a slide-over drawer triggered by `[☰]` for secondary links (تخفیف‌ها، برندها، پیگیری سفارش، درباره ما، تماس). Verify `Header.test.tsx` passes (GREEN).

## 3. End-to-End Verification & Regression Testing

- [x] 3.1 Run full storefront test suite with `cd shop && npm test -- --run` and verify all 23+ test suites pass.
- [x] 3.2 Run storefront production build with `cd shop && npm run build` and verify TypeScript compilation and Next.js bundling succeed without errors.
