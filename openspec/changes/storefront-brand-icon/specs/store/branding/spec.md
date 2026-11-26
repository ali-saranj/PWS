# Spec Delta

## ADDED Requirements

### Requirement: Storefront Browser and App Icons
The storefront SHALL serve browser favicons (`favicon.ico`, `icon.png`) and an Apple touch icon (`apple-icon.png`) derived from the official Protein Irany shield emblem.

#### Scenario: Storefront HTML head exposes icon links
- **WHEN** a user or crawler requests any storefront page
- **THEN** Next.js serves the storefront favicon and app icon assets derived from the official shield emblem

### Requirement: Storefront Header and Footer Brand Emblem
The storefront header, mobile navigation drawer header, and footer SHALL display the official Protein Irany shield emblem image alongside the store brand title instead of a generic store icon.

#### Scenario: Header displays official brand emblem
- **WHEN** a customer views the storefront header or opens the mobile navigation drawer
- **THEN** the brand link displays the official shield emblem image with descriptive Persian alt text for "پروتئین ایرانی"

#### Scenario: Footer displays official brand emblem with sufficient contrast
- **WHEN** a customer views the dark-themed storefront footer
- **THEN** the footer brand block displays the official shield emblem inside a light/white badge container so the dark-green emblem remains clearly legible

### Requirement: Storefront SEO and OpenGraph Brand Logo
The storefront SHALL serve the full official Protein Irany lockup (shield emblem and "پروتئین ایرانی" wordmark) at `/images/logo.png` and expose an OpenGraph preview image in root metadata.

#### Scenario: Organization JSON-LD and OpenGraph metadata reference official logo
- **WHEN** a search engine or social platform inspects the storefront root metadata and JSON-LD
- **THEN** `Organization.logo` resolves to `https://proteinirany.ir/images/logo.png` with the official full lockup and OpenGraph metadata includes a valid brand preview image
