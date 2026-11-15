# Tasks

## 1. Product Image Gallery Sizing & Containment

- [x] 1.1 Constrain gallery container dimensions in `shop/src/components/product/ProductImageGallery.tsx` with responsive width and height caps (`max-w-[380px]` on desktop, capped height `max-h-[300px]` on mobile) to eliminate vertical blowout, and verify with component rendering tests.
- [x] 1.2 Optimize image presentation and layout stability using `object-contain` and priority loading attributes, verifying that aspect ratios remain undistorted across screen sizes.

## 2. Desktop 3-Column Layout & Sticky Buy Box

- [x] 2.1 Refactor `shop/src/app/products/[slug]/page.tsx` to adopt a 3-column responsive grid on desktop viewports (`lg:grid-cols-12` with right gallery, center details, and left Buy Box in RTL).
- [x] 2.2 Implement the elevated sticky Buy Box card containing unit price, discount comparison, stock availability badge, quantity stepper, volume tier discount feedback, and the primary "افزودن به سبد خرید" button.
- [x] 2.3 Verify that variant switching in the center column immediately updates the price, stock status, and total calculation inside the sticky Buy Box card.

## 3. Mobile Sticky Purchase Bar

- [x] 3.1 Implement a mobile-only (`lg:hidden`) bottom sticky action bar displaying active variant pricing and a one-tap "افزودن به سبد خرید" button.
- [x] 3.2 Add page-bottom padding compensation (`pb-20 lg:pb-0`) to prevent overlap with the mobile bottom action bar and footer.

## 4. Regression Testing & Verification

- [x] 4.1 Update `shop/src/app/products/ProductDetailPage.test.tsx` to verify the 3-column elements, sticky Buy Box behavior, and mobile action bar.
- [x] 4.2 Run `npm test` in `shop/` and execute `npm run build` to verify that all unit tests and Next.js production builds pass without errors.
