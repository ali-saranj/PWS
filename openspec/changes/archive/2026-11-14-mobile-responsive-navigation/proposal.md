# Proposal

## Why

The current storefront top bar breaks on mobile screens (< 768px): the long brand title ("سبد سبز - سوپرمارکت آنلاین"), full login button text ("ورود / ثبت نام"), cart pill, and hamburger icon all fight for horizontal space in a single row, causing severe overflow or awkward line wrapping. Furthermore, a second stacked row for mobile search increases the sticky header height to over 120px, consuming roughly 20% of the mobile viewport. A modern, compact mobile top bar paired with a thumb-friendly bottom navigation bar and slide-over menu is required to provide an intuitive shopping experience on smartphones.

## What Changes

- **Compact Mobile Top Bar**:
  - Render concise brand text "سبد سبز" on mobile viewports (< 768px), expanding to full "سبد سبز - سوپرمارکت آنلاین" with slogan on desktop (`md:` and above).
  - Place a streamlined search input directly inline on the header row (`flex-1`) on mobile, removing the tall stacked second search row.
  - Add a small `[☰]` menu button on the mobile header that triggers a slide-over drawer for secondary links (تخفیف‌ها، برندها، پیگیری سفارش، درباره ما، تماس با ما).
  - Keep the mobile top bar sticky (`sticky top-0 z-40 bg-white shadow-sm`) for rapid search and navigation access.
- **Mobile Bottom Navigation Bar (`BottomNav`)**:
  - Introduce a fixed bottom navigation bar (`fixed bottom-0 inset-x-0 z-40 bg-white border-t md:hidden`) with safe-area padding for mobile devices.
  - Four key destinations:
    1. خانه (`/`) with Home icon.
    2. دسته‌بندی‌ها (`/categories`) with Categories icon.
    3. سبد خرید (`toggleCart()`) with Cart icon and real-time item count badge.
    4. حساب کاربری (`/profile`) with User icon (showing customer name if authenticated).
- **Layout Adjustments**:
  - Add bottom padding (`pb-16 md:pb-0`) to the main page wrapper so page content and buttons are never obscured by the bottom navigation bar.
- **Desktop Preservation**:
  - Preserve the full desktop header (`md:` and above) including dual-tier sub-navigation, city delivery badge, full search box, and login/cart buttons.

## Capabilities

### New Capabilities
- `storefront/navigation`: Covers customer storefront top navigation bar, mobile responsive header behavior, slide-over secondary drawer, and mobile bottom navigation bar.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Code**:
  - `shop/src/components/Header.tsx`: Refactored to support compact mobile top bar, inline search, and side drawer.
  - `shop/src/components/BottomNav.tsx`: New component providing mobile bottom navigation.
  - `shop/src/app/layout.tsx`: Includes `BottomNav` and adjusts content padding.
  - `shop/src/components/Header.test.tsx`: Updated and expanded to test mobile header elements, brand title display, and search interactions.
  - `shop/src/components/BottomNav.test.tsx`: New test suite for bottom navigation links, active states, and cart badge.
- **Dependencies & APIs**: No backend or external API changes required.
