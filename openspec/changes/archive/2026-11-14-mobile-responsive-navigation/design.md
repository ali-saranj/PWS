# Design

## Context

The storefront navigation currently lives entirely in `shop/src/components/Header.tsx`. On mobile viewports (< 768px), horizontal space is severely constrained, causing the brand title, user login button, cart button, and mobile menu trigger to collide and overflow. Additionally, placing the mobile search bar in a stacked row increases sticky header height to ~120px. See `proposal.md` for problem motivation and `specs/storefront/navigation/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Provide a clean, sticky mobile header (`h-14` / ~56px) that fits brand logo, concise title ("سبد سبز"), inline search input, and a small `[☰]` menu button without wrapping.
- Provide a fixed mobile bottom navigation bar (`BottomNav.tsx`) with 4 primary touch targets: Home, Categories, Cart (triggering `CartDrawer` with live badge count), and Profile.
- Provide a smooth slide-over navigation drawer for secondary links (Discounts, Brands, Order Tracking, About, Contact).
- Add `pb-16 md:pb-0` spacing to the layout container to prevent bottom bar overlap.
- Preserve full desktop layout and pass all existing storefront tests.

**Non-Goals:**
- Modifying desktop navigation layout, breakpoints, or styling.
- Changing admin back-office navigation or API endpoints.
- Building a complex autocomplete search modal (standard search submission to `/search?q=...` is retained).

## Decisions

### Decision 1: Separate `BottomNav.tsx` Component in `RootLayout`
- **Choice**: Create `shop/src/components/BottomNav.tsx` as a dedicated client component and render it in `shop/src/app/layout.tsx` alongside `Header` and `Footer`.
- **Rationale**: Isolates mobile bottom navigation logic and avoids nesting fixed-bottom elements inside a sticky top header (preventing CSS stacking context issues).
- **Alternative considered**: Nesting bottom navigation inside `Header.tsx`. Rejected because the header is sticky at the top, which complicates fixed bottom positioning, transitions, and z-index layers.

### Decision 2: Inline Mobile Search Bar in Header
- **Choice**: Place the search input on the same row as the logo and menu toggle (`flex-1 mx-2 sm:mx-3`).
- **Rationale**: Eliminates the 50px stacked second row on mobile, reclaiming 20% of vertical screen space, while still providing 1-tap search entry.
- **Alternative considered**: Expanding search overlay on icon click. Rejected because supermarket/grocery shopping heavily relies on quick immediate text search from any screen.

### Decision 3: Slide-Over Drawer for Secondary Links
- **Choice**: When `[☰]` is clicked, display a slide-over panel from the right with a backdrop blur overlay (`fixed inset-0 z-50`), consistent with `CartDrawer.tsx`.
- **Rationale**: Replaces the jarring inline accordion that pushes page content down when opened, creating a polished native app feel.

### Decision 4: Safe-Area and Main Layout Spacing
- **Choice**: Add `pb-16 md:pb-0` to the `<main>` tag in `shop/src/app/layout.tsx` and use `pb-[env(safe-area-inset-bottom)]` on `BottomNav`.
- **Rationale**: Guarantees that mobile pages, footers, and bottom-aligned elements are never obscured by the fixed bottom navigation bar on iOS and Android devices.

## Risks / Trade-offs

- **[Risk] Fixed bottom bars in checkout or product detail pages**: Pages with their own sticky action buttons (such as mobile "Add to Cart" sticky footers) could collide with `BottomNav`.
  - **Mitigation**: Verify that floating checkout buttons sit above or stack properly with bottom navigation padding, and test sticky interactions on mobile screen sizes.
- **[Risk] Hydration mismatches with customer name / cart count**: SSR render might differ from client Zustand store.
  - **Mitigation**: Follow the established `mounted` state pattern from `Header.tsx` so customer name and cart badges render safely after client mount.
