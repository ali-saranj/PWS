# Design

## Context

See `proposal.md` for background and motivation. The Storefront uses Next.js 15 (App Router), Tailwind CSS, Lucide icons, and Zustand stores (`cartStore`). The product detail page (`shop/src/app/products/[slug]/page.tsx`) renders client-side with RTL directionality and Persian typography (Vazirmatn).

## Goals / Non-Goals

**Goals:**
- Constrain image gallery dimensions so the main image never dominates the screen or expands beyond 380px on desktop or 300px on mobile.
- Transform the flat product info column into a structured 3-column layout on desktop:
  - Right (RTL): Image gallery and trust guarantee badges.
  - Center (RTL): Title, ratings, brand badge, variant selector, specs, and volume tiers table.
  - Left (RTL): Dedicated elevated sticky Buy Box card.
- Add a sticky bottom purchase action bar on mobile viewports for one-tap cart addition without scrolling.
- Retain complete compatibility with existing cart state actions and volume tier calculations.

**Non-Goals:**
- Server-side rendering (SSR) refactor of the product page (remains client-driven with hydration and API fetch).
- Modifying backend pricing, volume tier logic, or cart API endpoints.
- Redesigning unrelated pages (e.g. cart drawer, checkout, homepage).

## Decisions

### 1. 3-Column Desktop Grid Allocation
- **Decision**: Use a 12-column responsive CSS grid on `lg` screens (`grid grid-cols-1 lg:grid-cols-12 gap-8`):
  - Gallery (Right): `lg:col-span-4 xl:col-span-4` (contains gallery within `max-w-[360px] mx-auto`).
  - Details & Specs (Center): `lg:col-span-5 xl:col-span-5` (titles, ratings, variant chips, volume tier table, storage recommendations).
  - Sticky Buy Box (Left): `lg:col-span-3 xl:col-span-3` (`sticky top-24 self-start`).
- **Alternative considered**: 2-column layout with a floating box. A 2-column layout fails to separate product specification browsing from purchasing intent, causing the purchase box to scroll away during inspection of volume tiers or specs.

### 2. Gallery Height & Dimension Caps
- **Decision**: In `ProductImageGallery.tsx`, wrap the main image in a container with `max-w-[380px] max-h-[380px] sm:max-h-[360px] max-h-[280px]` and `aspect-square`, using `object-contain` and priority image hints.
- **Alternative considered**: Full-width swipe carousel on mobile. Full-width carousels still consume excessive vertical real estate on tall mobile screens unless height is strictly capped.

### 3. Mobile Sticky Bottom Purchase Bar
- **Decision**: Render a fixed bottom bar on mobile (`fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-lg lg:hidden`).
  - Displays selected variant price and unit label.
  - Includes a direct "افزودن به سبد خرید" CTA with quantity indicator and feedback state.
  - Accounts for safe area insets on mobile devices.
- **Alternative considered**: Leaving mobile without a sticky bar. Without it, mobile users must scroll back up after reading product specifications and descriptions to buy.

## Risks / Trade-offs

- **[Risk] Screen space on medium laptops (1024px–1200px)** → Use proportional grid spans (`lg:col-span-4`, `lg:col-span-5`, `lg:col-span-3`) and compact padding so elements do not feel cramped.
- **[Risk] Mobile bottom bar overlapping footer or mobile navigation** → Ensure appropriate padding bottom (`pb-20 lg:pb-0`) on the page wrapper so bottom content is never obscured by the fixed bar.
