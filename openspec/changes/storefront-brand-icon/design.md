# Design

## Context

See `proposal.md` for motivation and scope. Currently `shop/` has no `favicon.ico`, `icon.png`, `apple-icon.png`, or `opengraph-image.png`, uses a generic Lucide `<Store />` icon in `Header.tsx` and `Footer.tsx`, and has an older `shop/public/images/logo.png` (512×512 PNG). The source asset is the user-provided 1024×1024 RGBA PNG (`/Users/ali/.gemini/antigravity/brain/734b832a-c4e6-4084-9a60-20790e3dc9de/.user_uploaded/media_1795692834296_f14a7506.png`) containing a shield emblem on top and the `"پروتئین ایرانی"` wordmark below.

## Goals / Non-Goals

**Goals:**
- Derive crisp, properly padded square emblem assets for 16px–192px icon slots and Next.js App Router file-based metadata (`icon.png`, `apple-icon.png`, `favicon.ico`).
- Preserve the full lockup for `shop/public/images/logo.png` and OpenGraph social sharing (`opengraph-image.png`).
- Replace the generic `<Store />` brand icon in `Header.tsx` (desktop/mobile bar and mobile drawer header) and `Footer.tsx` while keeping `Footer.tsx` legible on its dark background.

**Non-Goals:**
- Changing `admin/` (`admin/public/favicon.svg`) or `api/`.
- Replacing the generic `<Store />` icon used as a menu link icon for `"صفحه اصلی"` inside the mobile drawer navigation list (`Header.tsx` line 465).

## Decisions

1. **Split the source image into Emblem vs. Full Lockup**:
   - *Choice*: Crop the upper shield emblem (transparent background or clean white-removed background, centered in a square canvas with ~8% padding) into `shop/public/images/logo-emblem.png` (and derive `shop/src/app/icon.png` 512×512, `shop/src/app/apple-icon.png` 180×180, and `shop/src/app/favicon.ico` multi-size 16/32/48). Keep the full lockup (emblem + `"پروتئین ایرانی"` wordmark) for `shop/public/images/logo.png` (512×512) and `shop/src/app/opengraph-image.png` (1200×630 centered on a clean white canvas).
   - *Rationale*: At 16×16–40×40px, the full lockup's Persian wordmark becomes illegible noise; the shield emblem reads clearly at all icon sizes.
   - *Alternative considered*: Using the 1024×1024 full lockup everywhere. Rejected due to illegibility at favicon and header-badge sizes.

2. **Use Next.js App Router File-Based Metadata (`shop/src/app/`)**:
   - *Choice*: Place `favicon.ico`, `icon.png`, `apple-icon.png`, and `opengraph-image.png` directly in `shop/src/app/`.
   - *Rationale*: Next.js 15 App Router automatically generates `<link rel="icon">`, `<link rel="apple-touch-icon">`, and `og:image` tags without manual `<head>` link management.

3. **Contrast Container in Header & Dark Footer**:
   - *Choice*: Render `logo-emblem.png` inside a clean white/light rounded container (`bg-white border border-gray-100` in `Header.tsx`, `bg-white` in `Footer.tsx` dark background) using standard `<img>` (matching `enamad.png` / `tabapay.png` in `Footer.tsx` since `next.config.ts` does not configure custom image optimization loaders for local static icons in standalone mode, or `<img>` with explicit `width`/`height`).
   - *Rationale*: The emblem uses dark green (`#0b3b1e`) strokes that would disappear against `Header`'s old `bg-primary` or `Footer`'s dark background.

## Risks / Trade-offs

- **White background removal / edge aliasing on cropped PNG** → Inspect the cropped emblem and generated `favicon.ico` / `icon.png` dimensions and visual edges after generation (using Python `Pillow`) to ensure no clipped shield corners or halo artifacts.
- **Standalone/test environment `<img>` rendering** → Using `<img src="/images/logo-emblem.png" alt={BRAND.nameFa} ... />` works cleanly in both Vitest (`jsdom`) and Next.js standalone builds without requiring `next/image` mocks in component tests.
