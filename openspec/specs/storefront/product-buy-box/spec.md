# storefront/product-buy-box Specification

## Purpose
Provides a balanced, high-converting product detail page layout with a contained responsive image gallery, a dedicated desktop sticky Buy Box card, and a mobile sticky purchase action bar.

## Requirements

### Requirement: Contained Responsive Image Gallery
The product detail page image gallery SHALL constrain main image dimensions to prevent layout shifts and vertical viewport overflow across all viewport widths.

#### Scenario: Desktop gallery bounds
- **GIVEN** a desktop viewport width greater than or equal to 1024px
- **WHEN** the product page is rendered
- **THEN** the image gallery container width SHALL NOT exceed 380px and the main image maintains a contained aspect ratio without distortion.

#### Scenario: Mobile gallery height containment
- **GIVEN** a mobile viewport width less than 768px
- **WHEN** the product page is rendered
- **THEN** the image container height SHALL be capped at a maximum of 300px so product titles, price, and actions remain visible above or near the initial fold.

### Requirement: Dedicated Desktop Sticky Buy Box Card
The storefront desktop layout SHALL present purchase actions within an elevated, sticky Buy Box card on the left side of the RTL 3-column grid.

#### Scenario: Sticky buy box displays price, stock, and add-to-cart
- **GIVEN** a desktop user viewing an in-stock product
- **WHEN** the user views or scrolls through product specifications and descriptions
- **THEN** the Buy Box card remains docked in view, displaying the active unit price, compare-at price savings, stock status, quantity controls, and the "افزودن به سبد خرید" button.

#### Scenario: Variant selection updates the Buy Box immediately
- **GIVEN** a product with multiple package variants
- **WHEN** the customer selects a different variant from the center column
- **THEN** the Buy Box immediately updates its active price, stock availability status, and recalculates total price.

### Requirement: Mobile Sticky Purchase Action Bar
The storefront mobile layout SHALL display a persistent bottom action bar enabling one-tap cart addition without requiring the customer to scroll back up.

#### Scenario: Mobile bottom bar visibility and purchase
- **GIVEN** a mobile user viewing the product detail page
- **WHEN** the customer scrolls past the hero product area
- **THEN** a bottom-docked sticky bar displays the active variant price, portion label, and an "افزودن به سبد خرید" button that adds the selected quantity to the cart.
