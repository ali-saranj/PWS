# Spec Delta

## MODIFIED Requirements

### Requirement: Storefront Metadata and SEO Identity
The storefront SHALL specify the brand name "پروتئین ایرانی" and primary secure domain "https://proteinirany.ir" across HTML document titles, meta descriptions, OpenGraph tags, and metadataBase configuration.

#### Scenario: Root layout metadata
- **WHEN** a customer loads the storefront home page
- **THEN** the document title includes "پروتئین ایرانی", metadataBase points to "https://proteinirany.ir", and the meta description references the specialized protein deli catalog.

#### Scenario: Search input placeholder
- **WHEN** a user views the search bar in the storefront header
- **THEN** the input placeholder displays "جستجو در پروتئین ایرانی...".
