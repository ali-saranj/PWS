# Proposal

## Why

In the customer storefront shopping cart drawer (`shop/src/components/CartDrawer.tsx`), product thumbnails were styled using `w-18 h-18`, which are invalid Tailwind CSS utilities that do not compile into any CSS classes. As a result, thumbnail containers lacked explicit width and height constraints, causing product images to explode to their raw unconstrained dimensions (600px–1200px+) and break the visual hierarchy and layout of the shopping cart.

Fixing the image dimensions to a structured 80×80px (`w-20 h-20`) format with image error fallback handling and an appetizing card layout restores visual polish, balance, and reliability to the checkout flow.

## What Changes

- **Thumbnail Sizing & Aspect Ratio**: Replace invalid `w-18 h-18` classes with fixed `w-20 h-20` (80×80px) aspect-square containers with `shrink-0`, `rounded-xl`, subtle border, and `object-cover`.
- **Image Fallback Handling**: Add image error handling (`onError`) so broken or missing images gracefully fall back to a placeholder icon or SVG without collapsing the container or breaking layout.
- **Cart Item Card Layout**: Refine spacing, typography, and contrast for product title, variant/portion label, unit price, quantity stepper, and line total.
- **Empty State & Drawer Polish**: Ensure seamless responsiveness and proper RTL padding across mobile and desktop drawers.

## Capabilities

### New Capabilities
- `storefront/cart-drawer`: Customer shopping cart slide-over drawer displaying reserved items, structured 80×80px thumbnails with fallback handling, quantity stepper controls, price calculations, and checkout routing.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Code**: `shop/src/components/CartDrawer.tsx`, `shop/src/components/CartDrawer.test.tsx`.
- **Dependencies & APIs**: No backend or API changes. Pure storefront frontend enhancement.
- **Breaking Changes**: None.
