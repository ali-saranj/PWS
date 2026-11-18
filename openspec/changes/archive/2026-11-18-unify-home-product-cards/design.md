# Design

## Context

See `proposal.md` for motivation.

The storefront (`shop/`) currently maintains a comprehensive, tested, and localized product card component at `shop/src/components/ProductCard.tsx`. This component handles:
- Aspect-square image container with clean conditional fallback (`thumbnailUrl ? <img /> : <ShoppingBag />`)
- Iranian Toman currency formatting and Persian digit conversions
- Top badges for discounts and out-of-stock indicators
- Add-to-cart mutations via `useCartStore` with instant feedback state
- Out-of-stock disabled overlay

Meanwhile, `SpecialOffersCarousel.tsx` and `PopularProductsCarousel.tsx` currently implement duplicate inline JSX for rendering cards, which introduced the bug where `<ShoppingBag>` rendered unconditionally under transparent product PNGs.

## Goals / Non-Goals

**Goals:**
- Replace inline product card JSX in `SpecialOffersCarousel` with `<ProductCard product={prod} />`.
- Replace inline product card JSX in `PopularProductsCarousel` with `<ProductCard product={prod} />`.
- Preserve the outer section layouts, gradient cards, headers ("پیشنهادهای شگفت‌انگیز", "پرفروش‌ترین محصولات"), and responsive grid containers.
- Verify all home page and product card tests pass without regressions.

**Non-Goals:**
- Modifying backend catalog API responses or database schemas.
- Re-architecting the global `useCartStore`.
- Changing product detail routing (`/product/[slug]`).

## Decisions

### Decision 1: Use `ProductCard` as a drop-in replacement
- **Rationale**: `ProductData` in `ProductCard.tsx` is already a superset of `ProductItem` and `PopularProductItem`. Passing `product={prod}` provides immediate consistency in badges, discount calculations, out-of-stock states, and cart additions.
- **Alternatives considered**:
  - *Patching inline carousels*: Fixing the condition in each carousel leaves duplicated code and allows future discrepancies to re-emerge.

### Decision 2: Preserve carousel section wrappers and headers
- **Rationale**: The distinct styling of `SpecialOffersCarousel` (rose gradient card with flame icon) and `PopularProductsCarousel` (section heading with view-all link) provides high visual hierarchy on the home page. Unifying only the product card elements preserves the curated look of the storefront while eliminating technical debt.

## Risks / Trade-offs

- **[Risk] Layout/Aspect Ratio shift in carousels** → **Mitigation**: `ProductCard` uses `w-full aspect-square` and `flex flex-col justify-between`, which seamlessly fits the existing grid container (`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4`).
