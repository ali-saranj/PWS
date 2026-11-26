# Tasks

## 1. Brand Image Asset Generation

- [x] 1.1 Crop the shield emblem from `/Users/ali/.gemini/antigravity/brain/734b832a-c4e6-4084-9a60-20790e3dc9de/.user_uploaded/media_1795692834296_f14a7506.png` into a centered, padded square `shop/public/images/logo-emblem.png` (512×512) and verify dimensions and visual framing.
- [x] 1.2 Generate Next.js App Router icon files from `shop/public/images/logo-emblem.png`: `shop/src/app/icon.png` (512×512), `shop/src/app/apple-icon.png` (180×180), and `shop/src/app/favicon.ico` (16×16, 32×32, 48×48) and verify file formats with `file`.
- [x] 1.3 Update `shop/public/images/logo.png` (512×512) and generate `shop/src/app/opengraph-image.png` (1200×630) from the full lockup source image and verify dimensions and `layout.test.tsx` `Organization.logo` URL compatibility.

## 2. Storefront Header and Footer Branding

- [x] 2.1 Add failing unit test assertions in `shop/src/components/Header.test.tsx` verifying the header and mobile drawer render the official brand emblem `<img>` (`/images/logo-emblem.png`) with Persian alt text, then update `shop/src/components/Header.tsx` to replace the `<Store />` brand badge icons and verify `Header.test.tsx` passes.
- [x] 2.2 Add failing unit test assertions in `shop/src/components/Footer.test.tsx` verifying the footer renders the official brand emblem `<img>` (`/images/logo-emblem.png`) inside a light badge container, then update `shop/src/components/Footer.tsx` to replace the `<Store />` brand badge icon and verify `Footer.test.tsx` passes.

## 3. Verification

- [x] 3.1 Run `npm test`, `npm run lint`, and `npm run build` in `shop/` and confirm all tests, linting, and production build pass with zero errors.
