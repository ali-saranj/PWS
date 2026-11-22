# store/branding Specification

## Purpose
Defines the unified brand identity, contact channels, order code prefixes, and client-side persistence keys for Protein Irany (پروتئین ایرانی) in Isfahan across the storefront, administrative portal, and core API.

## Requirements

### Requirement: Storefront Metadata and SEO Identity
The storefront SHALL specify the brand name "پروتئین ایرانی" and title reflecting "پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی" across HTML document titles, meta descriptions, OpenGraph tags, and metadataBase configuration.

#### Scenario: Root layout metadata
- **WHEN** a customer loads the storefront home page
- **THEN** the document title includes "پروتئین ایرانی", metadataBase points to "https://proteinirany.ir", and the meta description references the specialized Isfahan protein deli catalog including sausages, cold cuts, deli cheeses, sauces, and pickles.

#### Scenario: Search input placeholder
- **WHEN** a user views the search bar in the storefront header
- **THEN** the input placeholder displays "جستجو در محصولات پروتئین ایرانی...".

### Requirement: Support and Contact Point Identification
The storefront footer and contact pages SHALL display the official support telephone "۰۳۱-۳۵۳۲۳۲۴۰", official support email "support@proteinirany.ir", store location "اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین", and copyright ownership for "پروتئین ایرانی".

#### Scenario: Footer copyright and support channel
- **WHEN** a user navigates to the storefront footer
- **THEN** the copyright statement attributes ownership to "فروشگاه آنلاین پروتئین ایرانی", support telephone displays "۰۳۱-۳۵۳۲۳۲۴۰", and email displays "support@proteinirany.ir".

#### Scenario: Contact page store address and operating hours
- **WHEN** a user navigates to the contact page (/contact)
- **THEN** the page displays the store address "اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین", phone "۰۳۱-۳۵۳۲۳۲۴۰", and daily operating hours "همه‌روزه از ۹:۰۰ تا ۲۳:۰۰".

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
