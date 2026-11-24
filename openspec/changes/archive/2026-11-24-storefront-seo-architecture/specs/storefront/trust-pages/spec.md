# Spec Delta

## Purpose
Provides dedicated, server-rendered static informational and regulatory trust pages for customer service, terms of purchase, privacy policies, return procedures, shopping guides, shipping terms, and wholesale inquiries.

## ADDED Requirements

### Requirement: Customer Trust and Legal Policy Pages
The storefront SHALL render dedicated, public routes for Terms of Service (`/terms`), Privacy Policy (`/privacy`), Returns and Refund Policy (`/returns`), Frequently Asked Questions (`/faq`), Ordering Guide (`/how-to-order`), Payment Methods (`/payment-methods`), Shipping and Cold-Chain Delivery (`/shipping`), and Wholesale Inquiries (`/wholesale`).

#### Scenario: Rendering legal policy routes
- **WHEN** a user or crawler navigates to `/terms`, `/privacy`, or `/returns`
- **THEN** the server returns an HTTP 200 OK document containing localized policy terms, clear headers, and contact information.

#### Scenario: Rendering customer guide and FAQ routes
- **WHEN** a user navigates to `/faq`, `/how-to-order`, or `/payment-methods`
- **THEN** the server returns an HTTP 200 OK document providing actionable questions and answers, step-by-step checkout guidance, and accepted payment options.

#### Scenario: Rendering shipping and cold-chain logistics information
- **WHEN** a customer visits `/shipping`
- **THEN** the page displays delivery areas for Isfahan, temperature-insulated packaging details for perishable deli products, and dispatch schedules.

#### Scenario: Rendering wholesale information and tiered volume pricing
- **WHEN** a business customer visits `/wholesale`
- **THEN** the page details volume tier discounts, bulk packaging sizes (such as 13kg pickle tubs and cheese loaves) for fast foods and sandwich shops, and B2B ordering contact channels.

### Requirement: Trust Page Document Metadata and Canonical Tags
Each trust page SHALL generate unique, server-side document `<title>`, meta `description`, and self-referential `canonical` URL tags reflecting the page topic and store brand identity.

#### Scenario: Trust page metadata generation
- **WHEN** a search engine crawler visits any of the 8 trust page routes
- **THEN** the document metadata contains a distinct title formatted as `{Page Title} | پروتئین ایرانی`, an informative description, and a self-referential canonical URL.
