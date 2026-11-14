# Spec Delta

## Purpose
Defines the unified brand identity, contact channels, order code prefixes, and client-side persistence keys for Protein Irany (پروتئین ایرانی) across the storefront, administrative portal, and core API.

## ADDED Requirements

### Requirement: Storefront Metadata and SEO Identity
The storefront SHALL specify the brand name "پروتئین ایرانی" and primary domain "http://proteinirany.ir" across HTML document titles, meta descriptions, and OpenGraph tags.

#### Scenario: Root layout metadata
- **WHEN** a customer loads the storefront home page
- **THEN** the document title includes "پروتئین ایرانی" and the meta description references the specialized protein deli catalog.

#### Scenario: Search input placeholder
- **WHEN** a user views the search bar in the storefront header
- **THEN** the input placeholder displays "جستجو در پروتئین ایرانی...".

### Requirement: Support and Contact Point Identification
The storefront footer and contact pages SHALL display the official support email "support@proteinirany.ir" and copyright ownership for "پروتئین ایرانی".

#### Scenario: Footer copyright and support channel
- **WHEN** a user navigates to the storefront footer
- **THEN** the copyright statement attributes ownership to "سوپرمارکت آنلاین پروتئین ایرانی" and displays "support@proteinirany.ir".

### Requirement: Local Cart Storage Persistence
The client application SHALL persist cart state using the storage key "protein-irany-cart" and automatically migrate any legacy stored cart data.

#### Scenario: Saving items to local cart storage
- **WHEN** items are added or updated in the customer shopping cart
- **THEN** the serialized state is written to the localStorage key "protein-irany-cart".

#### Scenario: Migrating legacy cart storage
- **WHEN** a user opens the storefront with existing cart items stored under "sabad-sabz-cart" and no items under "protein-irany-cart"
- **THEN** the store migrates the items into "protein-irany-cart" and clears the legacy key.

### Requirement: Order Number Tracking Code Formatting
The checkout system SHALL generate human-readable customer order numbers prefixed with "PI-" followed by the date and random discriminator.

#### Scenario: Checkout generates order number with PI prefix
- **WHEN** a customer initiates or completes checkout for a reserved cart
- **THEN** the assigned orderNumber begins with the prefix "PI-" (e.g. "PI-050814-XXXX").

### Requirement: Staff Admin Application Branding
The administrative back-office application SHALL display the application title and browser tab title reflecting "پروتئین ایرانی".

#### Scenario: Admin browser tab title
- **WHEN** a staff member opens the administrative back-office
- **THEN** the HTML document title displays "پنل مدیریت پروتئین ایرانی" (or "Protein Irany Admin").
