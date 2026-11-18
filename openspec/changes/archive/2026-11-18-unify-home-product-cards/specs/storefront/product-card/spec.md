# Spec Delta: storefront/product-card

## Purpose

Defines standardized presentation, media fallback behavior, and user interactions for product cards across all storefront surfaces including home page carousels, catalog listings, and category showcases.

## ADDED Requirements

### Requirement: Conditional image and fallback placeholder rendering
Product cards SHALL render the product thumbnail image when `thumbnailUrl` is present and non-empty, and MUST NOT render any placeholder or background icon behind or over the image. When `thumbnailUrl` is absent, null, or empty, the card SHALL render a fallback placeholder icon (`ShoppingBag`).

#### Scenario: Product with thumbnail image
- **WHEN** a product has a valid `thumbnailUrl`
- **THEN** the product image is rendered inside the aspect-square container
- **AND** no placeholder icon or background graphic is rendered behind or layered with the image

#### Scenario: Product without thumbnail image
- **WHEN** a product has no `thumbnailUrl` or the value is empty
- **THEN** a centered placeholder shopping bag icon is rendered inside the container
- **AND** no broken image element is displayed

### Requirement: Unified product card usage in home carousels
The home page `SpecialOffersCarousel` and `PopularProductsCarousel` components SHALL render individual products using the shared `ProductCard` component rather than duplicated inline markup.

#### Scenario: Rendering items in Special Offers carousel
- **WHEN** the `SpecialOffersCarousel` component renders special offer items
- **THEN** each product is rendered using `<ProductCard />`
- **AND** product discount badges and Persian pricing are displayed identically to catalog cards

#### Scenario: Rendering items in Popular Products carousel
- **WHEN** the `PopularProductsCarousel` component renders popular items
- **THEN** each product is rendered using `<ProductCard />`
- **AND** inventory status and add-to-cart actions function consistently with catalog cards
