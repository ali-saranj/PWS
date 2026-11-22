# Design: Rebrand to Dehkadeh Protein Isfahan

## Context
See `proposal.md` for background and motivation. The application monorepo currently contains hardcoded references to "پروتئین ایرانی" and "تهران" across storefront components, metadata generation, contact pages, checkout forms, and unit test suites. This design standardizes branding and geographic parameters in `BRAND` config and propagates them to all presentation layers and tests.

## Goals / Non-Goals

**Goals:**
- Centralize all brand attributes (name, title, slogan, address, phone number, operating hours, primary city/province) in `shop/src/config/branding.ts`.
- Update customer-facing UI components across Storefront (`Header`, `Footer`, `HeroBanner`, `ValueBadges`, `PromoTiles`, `/contact`, `/about`, `/checkout`, and user profile address tab) to reflect Dehkadeh Protein, its Isfahan location, and its core catalog focus (sausages, cold cuts, specialty cheeses, sauces, and pickles).
- Update staff back-office title strings in `admin/` to "پنل مدیریت دهکده پروتئین".
- Keep unit tests green across `shop/` and `admin/` by updating test assertions to match the new text.

**Non-Goals:**
- Modifying backend core database schemas or existing order ledger historical records.
- Changing payment gateway configurations (Tabapay / Zarinpal) or bank merchant IDs.
- Changing internal cookie names (`pws_shop_at`, `pws_shop_rt`) or backend JWT claim roles.

## Decisions

### Decision 1: Extend `BRAND` config as Single Source of Truth
- **Choice**: Add `addressFa`, `phoneFa`, `phoneRaw`, `cityFa`, `provinceFa`, and `workingHoursFa` to `shop/src/config/branding.ts`.
- **Rationale**: Eliminates ad-hoc strings in components. When contact info or store hours change, updating `branding.ts` propagates changes across `Footer`, `Header`, `contact/page.tsx`, and JSON-LD schemas.
- **Alternatives Considered**: Hardcoding the address in `Footer.tsx` and `contact/page.tsx` separately, which risks future drift.

### Decision 2: Refactor PromoTiles and Hero Banner for Product Focus
- **Choice**: Align hero banner headlines and promo tiles directly with the user's defined specialty items:
  1. سوسیس و کالباس ممتاز (sausages & cold cuts)
  2. انواع پنیرهای تخصصی (pizza, gouda, burger slices)
  3. سس‌ها، خیارشور و ترشیجات (specialty sauces, pickles, and gherkins)
- **Rationale**: The previous tiles included generic grocery categories (e.g. dairy milk/butter and snacks). Focusing on deli meats, cheeses, pickles, and sauces accurately represents Dehkadeh Protein.

### Decision 3: Update Default Shipping & Address Book Location
- **Choice**: Set default province and city to "اصفهان" in `checkout/page.tsx` and `AddressBookTab.tsx`.
- **Rationale**: Customers purchasing from Dehkadeh Protein are predominantly located in Isfahan. Setting the default reduces checkout friction.

### Decision 4: Test Suite Synchronization
- **Choice**: Update unit tests (`Header.test.tsx`, `Footer.test.tsx`, `jsonLd.test.ts`, `ProductDetailPage.test.tsx`, `CheckoutPage.test.tsx`, `AddressBookTab.test.tsx`) alongside code updates.
- **Rationale**: Strict CI passes require all Vitest suites in `shop/` and `admin/` to succeed.

## Risks / Trade-offs

- **[Risk] Test breakage due to exact string matches** → *Mitigation*: Run `npm test` in `shop/` and `admin/` during implementation and update expected text regexes/strings.
- **[Risk] Legacy cart storage loss** → *Mitigation*: Retain migration support in `useCartStore` so that existing cached cart items remain intact.
