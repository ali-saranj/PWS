# Proposal

## Why

The platform is evolving from a generic placeholder name ("سبد سبز" / "PWS") to its definitive market identity: **پروتئین ایرانی (Protein Irany)**. The domain `http://proteinirany.ir` has already been allocated and configured at the reverse proxy layer, requiring all customer-facing storefront presentation, staff administrative titles, support contact points, and customer order identifiers to align consistently under the new brand.

## What Changes

- **Storefront Brand Presentation**: Update all header brand titles from "سبد سبز" to "پروتئین ایرانی" (mobile) and "پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی" (desktop) with updated descriptive subtitle.
- **Storefront Metadata & SEO**: Update root metadata, OpenGraph tags, page titles (`/categories`, `/brands`, `/about`, `/contact`), and search placeholders (`جستجو در پروتئین ایرانی...`).
- **Footer & Legal Copy**: Update footer copyright statement, brand description, and support email from `support@sabadsabz.ir` to `support@proteinirany.ir`.
- **Cart Storage Persistence**: Migrate client-side cart localStorage key from `sabad-sabz-cart` to `protein-irany-cart` with automatic legacy fallback/migration.
- **Staff Back-Office Branding**: Update admin web title in `index.html` to "پنل مدیریت پروتئین ایرانی" and update i18n application title keys.
- **Customer Order Tracking Identifiers**: Update generated order numbers from `PWS-YYMMDD-XXXX` to `PI-YYMMDD-XXXX` (Protein Irany).

## Capabilities

### New Capabilities
- `store/branding`: Defines brand metadata, contact info, legal copy, and persistent storage identifiers for Protein Irany across web clients.

### Modified Capabilities
- `storefront/navigation`: Updates the responsive header branding requirement and scenarios to render "پروتئین ایرانی" on mobile and "پروتئین ایرانی - فروشگاه تخصصی فرآورده‌های پروتئینی" on desktop.

## Impact

- **Storefront (`shop/`)**: `Header.tsx`, `Footer.tsx`, `layout.tsx`, `cartStore.ts`, and informational pages (`about`, `contact`, `categories`, `brands`), along with unit and snapshot tests.
- **Admin (`admin/`)**: `index.html` title and i18n message bundles (`fa.json`, `en.json`).
- **Core API (`api/`)**: `CheckoutService.java` order number prefix generation (`PWS-` to `PI-`) and associated integration tests.
- **Documentation & Deployment**: Align reference documentation and environment variable naming comments with the `proteinirany.ir` identity.
