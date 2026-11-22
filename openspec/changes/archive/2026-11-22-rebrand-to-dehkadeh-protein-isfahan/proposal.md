# Proposal: Rebrand to Dehkadeh Protein Isfahan

## Why
The platform needs to transition its customer-facing identity, contact details, product focus, and geographic localization from the previous brand to **دهکده پروتئین (Dehkadeh Protein)** located in **اصفهان (Isfahan)**. The physical store is based in Rehnan, Isfahan, with specialized expertise and product focus in various types of sausages, cold cuts, deli hams, specialty cheeses, gourmet sauces, and traditional pickles and gherkins. Customer communication, storefront copy, contact pages, header badges, and administrative titles must reflect this accurate identity and local delivery capabilities.

## What Changes
- **Storefront Branding & Identity**: Update core store branding constants (`BRAND.nameFa`, `BRAND.nameEn`, `BRAND.titleFa`, `BRAND.sloganFa`, address, phone number, and city) across `shop/src/config/branding.ts` to "دهکده پروتئین".
- **Storefront Navigation & Location Badges**: Update header location badges from Tehran to Isfahan ("اصفهان - ارسال سریع با بسته‌بندی عایق"), search input placeholder to "جستجو در محصولات دهکده پروتئین...", and header brand titles.
- **Home Page Copy & Product Focus**:
  - Update `HeroBanner` headline and subtitle to focus on fresh sausages, cold cuts, deli cheeses, sauces, and pickles delivered rapidly across Isfahan.
  - Update `PromoTiles` and `ValueBadges` to highlight deli meats, specialty cheeses (pizza, gouda, burger slices), gourmet sauces, pickles & gherkins, and express refrigerated delivery in Isfahan.
- **Contact & About Pages**: Update `/contact` and `/about` with the official store address ("اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین"), support telephone (`۰۳۱-۳۵۳۲۳۲۴۰`), daily operating hours (۹:۰۰ صبح الی ۲۳:۰۰ شب), and store story.
- **Footer & Trust Channels**: Update footer contact information, working hours, and copyright attribution to "فروشگاه آنلاین دهکده پروتئین اصفهان".
- **Checkout & Address Defaults**: Update default province and city in checkout and address book from Tehran to Isfahan.
- **Staff Back-Office Portal**: Update admin document title in `admin/index.html` and localization string in `admin/src/i18n/fa.json` to "پنل مدیریت دهکده پروتئین" ("Dehkadeh Protein Admin").

## Capabilities

### New Capabilities
<!-- No new capabilities introduced; this change updates branding and navigation requirements. -->

### Modified Capabilities
- `store/branding`: Updates brand name requirements, support telephone number (`۰۳۱-۳۵۳۲۳۲۴۰`), physical store address in Rehnan Isfahan, daily operating hours, and admin application titles.
- `storefront/navigation`: Updates header brand titles and replaces the default city delivery badge with Isfahan delivery representation.

## Impact
- **Storefront (`shop/`)**: `config/branding.ts`, `components/Header.tsx`, `components/Footer.tsx`, `components/home/HeroBanner.tsx`, `components/home/ValueBadges.tsx`, `components/home/PromoTiles.tsx`, `app/contact/page.tsx`, `app/about/page.tsx`, `app/checkout/page.tsx`, `components/profile/AddressBookTab.tsx`, and associated component unit tests.
- **Staff Back-Office (`admin/`)**: `admin/index.html`, `admin/src/i18n/fa.json`, `admin/src/i18n/en.json`.
- **OpenSpec Specifications**: Delta specs for `store/branding` and `storefront/navigation`.
