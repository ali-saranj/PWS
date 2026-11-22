# storefront/navigation Specification

## Purpose
Provides responsive storefront navigation including a sticky compact mobile top bar, an inline search input, a slide-over drawer for secondary links, and a fixed mobile bottom navigation bar.

## Requirements

### Requirement: Responsive Brand Header
The storefront header SHALL display a compact brand identity "دهکده پروتئین" on mobile viewports (< 768px), the full brand name "دهکده پروتئین اصفهان" and specialty product slogan on desktop viewports (>= 768px), and an express delivery badge for Isfahan.

#### Scenario: Mobile viewport renders compact brand text
- **WHEN** the user views the storefront on a mobile screen (< 768px)
- **THEN** the header displays the brand logo icon and concise title "دهکده پروتئین" without horizontal overflow.

#### Scenario: Desktop viewport renders full brand title and subtitle
- **WHEN** the user views the storefront on a desktop screen (>= 768px)
- **THEN** the header displays "دهکده پروتئین اصفهان - فروشگاه تخصصی فرآورده‌های پروتئینی" along with the descriptive subtitle highlighting sausages, cold cuts, cheeses, sauces, and pickles.

#### Scenario: Header displays express delivery badge for Isfahan
- **WHEN** the user views the sub-navigation bar on desktop or the mobile drawer
- **THEN** the header displays the delivery badge "اصفهان - ارسال سریع با بسته‌بندی عایق".

### Requirement: Inline Mobile Search Bar
The storefront header SHALL provide an inline search bar directly in the primary header row on mobile devices, maintaining single-row efficiency without stacking.

#### Scenario: Submitting a search query on mobile
- **WHEN** a user enters a query in the inline mobile search bar and submits
- **THEN** the browser navigates to `/search?q=<query>` with the URL-encoded search term.

### Requirement: Slide-Over Secondary Navigation Drawer
The mobile header SHALL provide a menu button that toggles a slide-over drawer for secondary store links.

#### Scenario: Opening slide-over menu
- **WHEN** a user taps the menu button `[☰]` on a mobile screen
- **THEN** a slide-over drawer opens showing links to discounts (`/discounts`), brands (`/brands`), order tracking (`/track`), about (`/about`), and contact (`/contact`).

#### Scenario: Closing slide-over menu
- **WHEN** a user taps the close button `[✕]` or clicks outside the drawer on the backdrop
- **THEN** the slide-over drawer closes.

### Requirement: Mobile Bottom Navigation Bar
The storefront SHALL render a fixed bottom navigation bar on mobile viewports (< 768px) with quick access to primary customer destinations.

#### Scenario: Tapping Home tab
- **WHEN** a user taps the Home tab
- **THEN** the browser navigates to `/` and highlights the Home icon as active.

#### Scenario: Tapping Categories tab
- **WHEN** a user taps the Categories tab
- **THEN** the browser navigates to `/categories` and highlights the Categories icon as active.

#### Scenario: Tapping Cart tab
- **WHEN** a user taps the Cart tab
- **THEN** the cart drawer opens displaying currently reserved items and total price, and the badge displays the current item count.

#### Scenario: Tapping Profile tab
- **WHEN** a user taps the Profile tab
- **THEN** the browser navigates to `/profile`, showing the customer's first name if authenticated or "حساب کاربری".
