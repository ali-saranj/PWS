# Design

## Context

See [proposal.md](./proposal.md) for motivation and scope. Existing Flyway migrations `V11__initial_catalog_data.sql` and `V13__category_brand_seo_fields.sql` are already committed and applied, so any database data fixes must be delivered in a new Flyway migration (`V14`) without modifying `V11` or `V13`. On the storefront (`shop/`), `serverCatalog.ts` already exposes `categorySlug` and `breadcrumb` on `ProductDetail`, which enables canonical `categorySlug` linking without backend API changes.

## Goals / Non-Goals

**Goals:**
- Ensure every internal category link, breadcrumb, `BreadcrumbList` JSON-LD item, and pagination link on the storefront matches the canonical `/products?categorySlug={slug}` format declared in `sitemap.ts` and `generateMetadata`.
- Ensure all 74 seeded products in `V11` have clean, customer-facing Persian `description_fa` copy free of internal QA strings.
- Ensure all 9 categories and 14 brands have complete, non-cannibalizing `seo_title`, `seo_description`, `seo_h1`, and `seo_content_fa`.

**Non-Goals:**
- Changing product URL slugs (`pws-*`) or adding product slug redirects (existing product URLs are retained).
- Modifying committed Flyway migrations (`V11`, `V13`).
- Adding new blog/guide routes or editorial CMS entities.

## Decisions

1. **New Flyway migration `V14__seo_audit_and_copy_cleanup.sql` over editing `V11`/`V13`:**
   - *Rationale:* `AGENTS.md` prohibits modifying already committed Flyway migrations. `V14` will use idempotent `UPDATE ... WHERE slug = ...` statements for `category`, `brand`, and `product`.
   - *Alternative considered:* Editing `V11`/`V13` directly (rejected — breaks Flyway checksum validation on existing databases).

2. **Resolve `categorySlug` in storefront components from `product.categorySlug` or `product.breadcrumb`:**
   - *Rationale:* `ProductDetail` includes `categorySlug` and `breadcrumb[].slug`. Using `product.categorySlug || product.breadcrumb?.[0]?.slug` with fallback to `categoryId` ensures canonical links work for both live API responses and mock/test fixtures.
   - *Alternative considered:* Fetching all categories on every product page render (rejected — unnecessary extra API call).

3. **Retail vs. Wholesale Intent Boundary in `V14` copy:**
   - *Rationale:* `/wholesale` owns B2B bulk queries (`خرید عمده`, `تامین فست‌فود`, `مواد اولیه ساندویچی`). Category `seo_title` and `seo_h1` values will target retail/SKU-browsing intent (`خرید و قیمت ...`, `خرید آنلاین ...`), while `seo_content_fa` may briefly mention bulk availability with a pointer rather than competing for primary wholesale head terms.

## Risks / Trade-offs

- **Mock/test fixtures lacking `categorySlug`:** Existing Vitest tests for `ProductDetailView` or `ProductDetailPage` may pass mock products with `categoryId` only → *Mitigation:* Fall back to `categoryId` when `categorySlug` is absent, and add test cases verifying `categorySlug` takes precedence when present.
- **Migration length & SQL escaping:** Updating 74 products + 9 categories + 14 brands in SQL requires careful single-quote escaping → *Mitigation:* Verify migration cleanly against Zonky embedded Postgres via `./mvnw -q verify`.

## Migration Plan

1. Add `api/src/main/resources/db/migration/V14__seo_audit_and_copy_cleanup.sql`.
2. Run `cd api && ./mvnw -q verify` to confirm Flyway applies `V14` cleanly and all integration tests pass.
3. Update `shop/` components and Vitest specs, then run `npm test`, `npm run lint`, and `npm run build` in `shop/`.
