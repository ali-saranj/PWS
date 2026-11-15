# storefront/cart-drawer Specification

## Purpose
Provides a responsive shopping cart slide-over drawer displaying customer selected items with constrained visual thumbnails, quantity adjustment steppers, real-time subtotal calculation, and checkout navigation.

## Requirements

### Requirement: Cart Item Thumbnail and Presentation
The cart drawer SHALL display each line item with an 80×80px (`w-20 h-20`) constrained aspect-square thumbnail, product title, variant/portion label, and unit price in Toman.

#### Scenario: Render product item with structured thumbnail
- **WHEN** an item with an image URL is in the cart drawer
- **THEN** the product image is rendered within a fixed 80×80px square container with object-cover scaling without distorting or overflowing the card layout.

#### Scenario: Missing or broken product image fallback
- **WHEN** an item has no image URL or the image fails to load
- **THEN** the thumbnail displays a fallback placeholder icon or SVG while maintaining the fixed 80×80px aspect-square container.

### Requirement: Cart Item Stepper and Quantity Management
The cart drawer SHALL provide stepper controls for each item allowing customers to increment, decrement, or remove items directly within the drawer.

#### Scenario: Incrementing item quantity
- **WHEN** the customer clicks the increase quantity button `[+]` on a cart item
- **THEN** the item quantity increments by 1 up to available stock and the line total and basket subtotal update accordingly.

#### Scenario: Decrementing item quantity
- **WHEN** the customer clicks the decrease quantity button `[-]` on an item with quantity greater than 1
- **THEN** the item quantity decrements by 1 and the price totals update immediately.

#### Scenario: Removing item when quantity reaches one
- **WHEN** the customer clicks the decrease/remove button on an item with quantity equal to 1
- **THEN** the item is removed from the cart and the total item count updates.

### Requirement: Cart Summary and Checkout Navigation
The cart drawer SHALL display the aggregate item count, formatted basket total in Toman with Persian digits, delivery notice, and a primary action button to proceed to checkout.

#### Scenario: Order subtotal and Persian currency formatting
- **WHEN** the cart drawer is open with one or more items
- **THEN** the subtotal is calculated and displayed with Persian formatted digits and Toman currency label.

#### Scenario: Navigating to checkout page
- **WHEN** the customer clicks the checkout action button
- **THEN** the cart drawer closes and the browser navigates to `/checkout`.

#### Scenario: Empty cart state display
- **WHEN** the cart drawer is opened with zero items
- **THEN** the drawer displays an empty basket graphic, helpful guidance message, and a call-to-action button linking to `/products`.
