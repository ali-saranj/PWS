# Tasks

## 1. Brand Configuration & Global Metadata

- [x] 1.1 Update `BRAND` config in `shop/src/config/branding.ts` with "دهکده پروتئین", "Dehkadeh Protein", address ("اصفهان، خیابان رهنان، خیابان مطهری، چهارراه طاحونه، دهکده پروتئین"), phone ("۰۳۱-۳۵۳۲۳۲۴۰"), working hours ("همه‌روزه از ۹:۰۰ صبح الی ۲۳:۰۰ شب"), and Isfahan location fields; verify types and exports.
- [x] 1.2 Update JSON-LD schemas in `shop/src/lib/jsonLd.ts` and test assertions in `shop/src/lib/jsonLd.test.ts`; verify `npx vitest run src/lib/jsonLd.test.ts` passes.
- [x] 1.3 Update Root layout metadata in `shop/src/app/layout.tsx` to reflect Dehkadeh Protein and Isfahan deli catalog description.

## 2. Storefront Header, Navigation & Footer

- [x] 2.1 Update Header brand titles, search placeholder ("جستجو در محصولات دهکده پروتئین..."), and city delivery badge ("اصفهان - ارسال سریع با بسته‌بندی عایق") in `shop/src/components/Header.tsx`.
- [x] 2.2 Update `Header.test.tsx` to assert new brand title, search placeholder, and Isfahan delivery badge; verify `npx vitest run src/components/Header.test.tsx` passes.
- [x] 2.3 Update Footer copyright, telephone (`۰۳۱-۳۵۳۲۳۲۴۰`), address, and working hours in `shop/src/components/Footer.tsx`.
- [x] 2.4 Update `Footer.test.tsx` to assert Dehkadeh Protein copyright and phone number; verify `npx vitest run src/components/Footer.test.tsx` passes.

## 3. Home Page Marketing Components & Product Focus

- [x] 3.1 Update `HeroBanner.tsx` headline, subtitle, and badges to focus on fresh sausages, cold cuts, deli cheeses, sauces, and pickles in Isfahan.
- [x] 3.2 Update `PromoTiles.tsx` to highlight sausages & cold cuts, specialty cheeses (pizza, gouda, burger slices), and sauces & pickles.
- [x] 3.3 Update `ValueBadges.tsx` express delivery text to emphasize rapid insulated delivery across Isfahan.

## 4. Info Pages & Checkout Localization

- [x] 4.1 Update Contact page `shop/src/app/contact/page.tsx` with Rehnan store address, phone `۰۳۱-۳۵۳۲۳۲۴۰`, and daily hours (۹ صبح تا ۱۱ شب).
- [x] 4.2 Update About page `shop/src/app/about/page.tsx` with Dehkadeh Protein story, deli meat slicing, cheeses, and sauces in Isfahan.
- [x] 4.3 Update default province/city to Isfahan in `shop/src/app/checkout/page.tsx` and `shop/src/components/profile/AddressBookTab.tsx`.
- [x] 4.4 Update `shop/src/app/checkout/CheckoutPage.test.tsx` and `shop/src/components/profile/AddressBookTab.test.tsx` assertions for Isfahan; verify `npx vitest run src/app/checkout/CheckoutPage.test.tsx src/components/profile/AddressBookTab.test.tsx` passes.

## 5. Admin Portal & System Verification

- [x] 5.1 Update Admin application title in `admin/index.html`, `admin/src/i18n/fa.json` ("پنل مدیریت دهکده پروتئین"), and `admin/src/i18n/en.json` ("Dehkadeh Protein Admin").
- [x] 5.2 Run complete test suite and build in `shop` (`npm test && npm run build`) to ensure all tests and page routes build cleanly.
- [x] 5.3 Run complete test suite and build in `admin` (`npm test && npm run build`) to ensure admin passes all checks.
