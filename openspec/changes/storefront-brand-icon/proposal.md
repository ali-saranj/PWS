# Proposal

## Why

The storefront (`shop/`) currently renders a generic Lucide `<Store />` icon in the header, mobile drawer, and footer, and lacks a favicon, Apple touch icon, or OpenGraph social image. Meanwhile, `shop/public/images/logo.png` is only referenced in JSON-LD structured data and does not yet use the official **پروتئین ایرانی** (Protein Irany) emblem and wordmark provided by the store owner.

## What Changes

- Derive a cropped **shield emblem** icon (transparent/clean background, square aspect ratio) from the provided `پروتئین ایرانی` logo image for small UI and browser slots (`favicon.ico`, `icon.png`, `apple-icon.png`, header brand badge, mobile drawer header badge, and footer brand badge).
- Update `shop/public/images/logo.png` with the **full lockup** (shield emblem + `پروتئین ایرانی` wordmark) and add an OpenGraph image (`opengraph-image.png` / metadata) so search engines and social shares display the official brand identity.
- Update `Header.tsx` and `Footer.tsx` to render the brand emblem image instead of the generic `<Store />` icon, with a light/white badge surface in the dark footer to preserve contrast.
- Keep `admin/` branding and `admin/public/favicon.svg` unchanged (out of scope).

## Capabilities

### New Capabilities
- *(none)*

### Modified Capabilities
- `store/branding`: Add storefront visual icon and logo asset requirements covering browser favicons/app icons, header/footer brand emblem rendering, and `logo.png` / OpenGraph brand imagery.

## Impact

- **Assets**: `shop/src/app/icon.png`, `shop/src/app/apple-icon.png`, `shop/src/app/favicon.ico`, `shop/src/app/opengraph-image.png` (or `shop/public/images/og-logo.png`), `shop/public/images/logo-emblem.png`, `shop/public/images/logo.png`.
- **Components & Layout**: `shop/src/components/Header.tsx`, `shop/src/components/Footer.tsx`, `shop/src/app/layout.tsx`.
- **Tests**: `shop/src/components/Header.test.tsx`, `shop/src/components/Footer.test.tsx`, `shop/src/app/layout.test.tsx`.
- **Out of Scope**: `admin/` back-office favicon or UI, `api/` backend, database migrations.
