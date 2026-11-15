# Design

## Context

In `shop/src/components/CartDrawer.tsx`, product thumbnails were given `w-18 h-18`. Because Tailwind CSS's default spacing jumps from `16` (64px) to `20` (80px), `18` produces no CSS rules. Without explicit width and height constraints on the parent container, child `<img>` elements render unconstrained at their intrinsic image resolutions, severely breaking the cart layout.

## Goals / Non-Goals

**Goals:**
- Replace missing `w-18 h-18` classes with standard `w-20 h-20` (80×80px) fixed aspect-square thumbnail containers.
- Add image load error handling (`onError`) with graceful fallback to the deli product placeholder SVG or icon.
- Refine the cart item card layout with balanced padding, clear typography, and responsive stepper controls.
- Maintain full compatibility with existing Zustand `cartStore` and Next.js App Router navigation.
- Ensure all automated unit and integration tests pass.

**Non-Goals:**
- Changing cart business logic, state management (`cartStore.ts`), or pricing algorithms.
- Modifying backend API endpoints or checkout flows (`/checkout`).
- Redesigning unrelated storefront pages or components.

## Decisions

### Decision 1: 80×80px (`w-20 h-20`) Thumbnail Dimensions
- **Choice**: Use `w-20 h-20` (80×80px) with `aspect-square`, `shrink-0`, `rounded-xl`, `border border-gray-200/80`, and `bg-white`.
- **Alternatives Considered**:
  - `w-16 h-16` (64×64px): More compact, but diminishes appetizing visual appeal of charcuterie and deli cuts.
  - Custom Tailwind spacing extension (e.g. adding `18: '4.5rem'` to `tailwind.config.ts`): Adds non-standard custom utilities when standard 80px (`w-20`) delivers better visual presence.

### Decision 2: Robust Fallback with `onError`
- **Choice**: Render `<img>` with `onError` event handler switching to `/images/products/placeholder-meat.svg`, plus fallback icon when `imageUrl` is absent.
- **Alternatives Considered**:
  - `next/image`: Requires remote domain whitelist configuration in `next.config.js` and strict width/height props; using native `<img>` with error handler matches `OrdersTab.tsx` and prevents unconfigured domain runtime failures.

### Decision 3: Card Layout and Visual Hierarchy
- **Choice**:
  - Top line: Product title (`line-clamp-1` or `truncate`, bold `text-gray-900`) and optional portion/variant badge (`text-xs text-gray-500`).
  - Middle: Unit price (`text-xs text-primary font-semibold`).
  - Bottom row: Stepper pill (`[+]` count `[-]`) on the right and formatted line total on the left.
- **Alternatives Considered**:
  - Separate delete button on top right: Takes extra vertical space and risks accidental clicks on mobile touchscreens.

## Risks / Trade-offs

- **[Risk]** Variable image aspect ratios causing distortion.
  - **Mitigation**: Constrain thumbnail container to `aspect-square overflow-hidden` and apply `w-full h-full object-cover`.
- **[Risk]** Narrow mobile screens (e.g. 320px).
  - **Mitigation**: 80px thumbnail leaves ~220px for the title, stepper, and price; flex layout with `min-w-0` and truncate ensures no horizontal overflow.
