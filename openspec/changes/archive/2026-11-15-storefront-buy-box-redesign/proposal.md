# Proposal

## Why

The product detail page (PDP) image gallery currently occupies unbounded vertical space (`aspect-square w-full` with raw `<img>`), causing the product image to blow up to 600px–800px on tablet/laptop viewports and pushing critical conversion elements below the fold on mobile. Furthermore, purchasing controls (price, variant selections, quantity stepper, volume discount tiers, and Add to Cart) are scattered in a single flat column rather than packaged in a focused, high-converting Buy Box card.

Redesigning the PDP into a balanced 3-column layout on desktop (contained gallery, centered product specifications, and a dedicated sticky Buy Box card) alongside responsive image constraints and a sticky bottom purchase action bar on mobile will improve user experience, reduce layout shifts, and accelerate shopping cart conversions.

## What Changes

- **Constrained Responsive Image Gallery**: Bound gallery dimensions (`max-w-[380px]` on desktop, capped height `max-h-[300px]` on mobile) with Next.js image loading optimization to prevent layout shift and viewport takeover.
- **Dedicated Desktop Buy Box Card**: Consolidate unit price, compare-at price, discount badges, stock status ("موجود در انبار" / "آماده ارسال فوری دلی"), active volume tier savings, quantity stepper, and primary "افزودن به سبد خرید" CTA into an elevated, sticky purchase card (`sticky top-24`).
- **3-Column Desktop Layout (RTL)**:
  - Right column: Image gallery & trust guarantee badges (سرمایش، اصالت).
  - Center column: Breadcrumbs, Persian & English titles, ratings, brand badge, variant selector, specifications, and volume tiers table.
  - Left column: Dedicated Sticky Buy Box card.
- **Mobile Sticky Purchase Bar**: Introduce a bottom-docked action bar visible when scrolling on mobile devices, exposing the active variant price, stock badge, and one-tap "افزودن به سبد خرید" button.

## Capabilities

### New Capabilities
- `storefront/product-buy-box`: Covers product detail page layout, contained image gallery presentation, dedicated sticky buy box purchase card on desktop, and mobile sticky action bar.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `shop/src/components/product/ProductImageGallery.tsx`: Responsive image constraints and container bounding.
  - `shop/src/app/products/[slug]/page.tsx`: Layout refactoring to 3 columns on desktop, sticky Buy Box card integration, and mobile sticky purchase bar.
  - `shop/src/app/products/ProductDetailPage.test.tsx`: Vitest regression tests covering the 3-column layout, sticky Buy Box, and mobile action bar elements.
- **APIs & State**: No backend or API changes required; relies on existing client Zustand `cartStore` and `/api/shop/products/[slug]` data contracts.
