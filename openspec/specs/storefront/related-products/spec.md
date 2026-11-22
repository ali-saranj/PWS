# storefront/related-products Specification

## Purpose
Enables reliable server-side recommendation and display of related products on the product detail page, matching items by category and brand while eliminating hardcoded dummy data.

## Requirements

### Requirement: Server-Side Related Products Resolution
The product detail page SHALL resolve related products during server-side rendering (SSR) before delivering the initial HTML to the customer.

#### Scenario: Server fetches category-related items
- **GIVEN** a customer requests `/products/:slug` for an active product
- **WHEN** the server page component executes
- **THEN** it queries the catalog for products in the current item's category and provides them as initial data to the view component

#### Scenario: Fallback when API returns no items
- **GIVEN** the catalog API is unreachable or returns zero products for the current category
- **WHEN** the server page component resolves related products
- **THEN** it falls back to valid catalog mock products matching the category rather than rendering dummy placeholder IDs

### Requirement: Category and Brand Affinity Ranking
The recommendation logic SHALL prioritize products that share both category and brand affinities with the current product, while excluding the current product itself.

#### Scenario: Same brand products are prioritized
- **GIVEN** a product belonging to category 2 and brand "Andre"
- **WHEN** related products are ranked
- **THEN** other products belonging to category 2 and brand "Andre" appear before products from different brands in category 2

#### Scenario: Current product exclusion
- **GIVEN** a catalog query returns candidates including the product currently being viewed
- **WHEN** candidate items are filtered
- **THEN** the currently viewed product is excluded from the final recommendation list

#### Scenario: Maximum display limit
- **GIVEN** multiple candidate products qualify as related
- **WHEN** the final recommendation list is assembled
- **THEN** at most 4 items are returned for display in the related products grid

### Requirement: Elimination of Hardcoded Dummy Placeholders
The storefront SHALL NOT render hardcoded dummy products with synthetic identifiers or non-routable slugs in the related products section.

#### Scenario: No synthetic slugs rendered
- **GIVEN** the related products section is rendered on initial load or during client hydration
- **WHEN** inspecting the rendered product cards
- **THEN** every card links to a valid product URL and no element contains placeholder slugs such as `related-1` or `related-2`

### Requirement: Seamless Client Hydration Without Content Shift
The client-side view component SHALL initialize its related products state using the server-provided initial data to prevent cumulative layout shift.

#### Scenario: Hydration preserves server-rendered products
- **GIVEN** the server rendered related products in the initial HTML response
- **WHEN** React hydrates on the client
- **THEN** the initial related products remain displayed without flashing or layout jumping
