# storefront/search Specification

## Purpose
Enables instant product discovery in the storefront header via a debounced live autocomplete dropdown and provides a relevance-preserving search results page.

## Requirements

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
The storefront search results page at /search SHALL display products preserving the backend relevance ranking by default unless the customer explicitly selects a different sort option, and SHALL reactively synchronize with URL search query parameter changes at all times.

#### Scenario: Default search sorting preserves relevance
- **WHEN** a user arrives on /search?q=سوسیس without specifying a sort query parameter
- **THEN** the products are presented in the relevance order returned by the catalog search API

#### Scenario: Fallback empty state
- **WHEN** a search query yields zero products
- **THEN** the search page displays a clear zero-results message along with suggestions to check spelling or try broader terms

#### Scenario: Reactive query update on URL change
- **WHEN** a user on /search navigates to a new search query (e.g. /search?q=کالباس)
- **THEN** the search page immediately re-executes the search with the new query term and displays the matching products rather than retaining previous search results

#### Scenario: Direct navigation from empty to populated query
- **WHEN** a user visits /search without a query and subsequently submits a search term
- **THEN** the search page transitions from all products to the specific filtered results for that term

### Requirement: Header Search Input Synchronization
The storefront header search bar SHALL synchronize its displayed input value with the active query parameter when browsing the /search page.

#### Scenario: Header reflects active search query
- **WHEN** a user navigates to /search?q=خیارشور
- **THEN** the header search input field reflects "خیارشور"
