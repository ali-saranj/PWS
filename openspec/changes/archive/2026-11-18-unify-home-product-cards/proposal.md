# Proposal

## Why

On the storefront home page, product cards inside `SpecialOffersCarousel` and `PopularProductsCarousel` currently render inline duplicate markup where the placeholder `<ShoppingBag>` icon is rendered unconditionally as an `absolute inset-0` background layer behind the product image. Because grocery products (deli meats, cheese, sausages) use transparent PNG photos, the placeholder bag icon bleeds directly through the product image. In contrast, the rest of the storefront uses the shared `ProductCard` component which properly conditionally renders either the image or the fallback placeholder. Unifying the home page carousels to reuse `ProductCard` eliminates this visual artifact, removes code duplication, and ensures consistent styling and cart behavior across the entire storefront.

## What Changes

- Refactor `SpecialOffersCarousel` to reuse the shared `ProductCard` component instead of inline duplicated card markup.
- Refactor `PopularProductsCarousel` to reuse the shared `ProductCard` component instead of inline duplicated card markup.
- Ensure product item interfaces used on the home page (`ProductItem`, `PopularProductItem`) map cleanly to `ProductData`.
- Eliminate the unconditional background icon layer that caused visual bleed-through on transparent images.
- Retain all home page section layouts, gradient styling, flame/star badges, and responsive grids.

## Capabilities

### New Capabilities
- `storefront/product-card`: Standardized product card presentation and interaction across catalog listings, search results, category showcases, and home carousels.

### Modified Capabilities
<!-- None: No existing spec requirements are modified -->

## Impact

- **Affected code**:
  - `shop/src/components/home/SpecialOffersCarousel.tsx`
  - `shop/src/components/home/PopularProductsCarousel.tsx`
- **APIs**: No backend or API changes.
- **Dependencies**: No new dependencies added.
