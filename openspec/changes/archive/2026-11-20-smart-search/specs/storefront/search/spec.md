# Spec Delta

## Purpose

Enables instant product discovery in the storefront header via a debounced live autocomplete dropdown and provides a relevance-preserving search results page.

## ADDED Requirements

### Requirement: Header Live Autocomplete Dropdown
The storefront header search bar SHALL display a live autocomplete dropdown as the customer types, querying the suggestion endpoint after a 250ms debounce delay.

#### Scenario: Display suggestions on typing
- **WHEN** a user enters at least two non-whitespace characters into the search bar
- **THEN** an autocomplete overlay displays up to 6 matching products with thumbnail, title, price in Toman, and a "مشاهده همه نتایج" link

#### Scenario: Dropdown dismissal
- **WHEN** the user clicks outside the search bar, clears the input, or presses the Escape key
- **THEN** the autocomplete overlay closes immediately

#### Scenario: Keyboard navigation
- **WHEN** the dropdown is open and the user presses ArrowDown or ArrowUp
- **THEN** focus moves through the suggested products, and pressing Enter navigates to the selected product page

### Requirement: Relevance-Preserving Search Results Page
The storefront search results page at /search SHALL display products preserving the backend relevance ranking by default unless the customer explicitly selects a different sort option.

#### Scenario: Default search sorting preserves relevance
- **WHEN** a user arrives on /search?q=سوسیس without specifying a sort query parameter
- **THEN** the products are presented in the relevance order returned by the catalog search API

#### Scenario: Fallback empty state
- **WHEN** a search query yields zero products
- **THEN** the search page displays a clear zero-results message along with suggestions to check spelling or try broader terms
