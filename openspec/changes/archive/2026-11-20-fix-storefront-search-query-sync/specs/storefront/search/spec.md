# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Header Search Input Synchronization
The storefront header search bar SHALL synchronize its displayed input value with the active query parameter when browsing the /search page.

#### Scenario: Header reflects active search query
- **WHEN** a user navigates to /search?q=خیارشور
- **THEN** the header search input field reflects "خیارشور"
