# Spec Delta: store/branding

## MODIFIED Requirements

### Requirement: Storefront Metadata and SEO Identity
The storefront SHALL specify the brand name "دهکده پروتئین" and title reflecting "دهکده پروتئین اصفهان" across HTML document titles, meta descriptions, OpenGraph tags, and metadataBase configuration.

#### Scenario: Root layout metadata
- **WHEN** a customer loads the storefront home page
- **THEN** the document title includes "دهکده پروتئین", metadataBase points to "https://proteinirany.ir", and the meta description references the specialized Isfahan protein deli catalog including sausages, cold cuts, deli cheeses, sauces, and pickles.

#### Scenario: Search input placeholder
- **WHEN** a user views the search bar in the storefront header
- **THEN** the input placeholder displays "جستجو در محصولات دهکده پروتئین...".

### Requirement: Support and Contact Point Identification
The storefront footer and contact pages SHALL display the official support telephone "۰۳۱-۳۵۳۲۳۲۴۰", official support email "support@proteinirany.ir", store location "اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین", and copyright ownership for "دهکده پروتئین".

#### Scenario: Footer copyright and support channel
- **WHEN** a user navigates to the storefront footer
- **THEN** the copyright statement attributes ownership to "فروشگاه آنلاین دهکده پروتئین اصفهان", support telephone displays "۰۳۱-۳۵۳۲۳۲۴۰", and email displays "support@proteinirany.ir".

#### Scenario: Contact page store address and operating hours
- **WHEN** a user navigates to the contact page (/contact)
- **THEN** the page displays the store address "اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین", phone "۰۳۱-۳۵۳۲۳۲۴۰", and daily operating hours "همه‌روزه از ۹:۰۰ تا ۲۳:۰۰".

### Requirement: Staff Admin Application Branding
The administrative back-office application SHALL display the application title and browser tab title reflecting "دهکده پروتئین".

#### Scenario: Admin browser tab title
- **WHEN** a staff member opens the administrative back-office
- **THEN** the HTML document title displays "پنل مدیریت دهکده پروتئین" (or "Dehkadeh Protein Admin").
