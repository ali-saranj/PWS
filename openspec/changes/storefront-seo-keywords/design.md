# Design

## Context

See `proposal.md` for motivation and scope. Currently:
- `api/` stores `Category` (`category` table) and `Brand` (`brand` table) without SEO fields. Flyway migrations are at `V12__add_tabapay_gateway.sql` and `spring.jpa.hibernate.ddl-auto` is `validate`.
- `admin/` manages categories in `CategoryDialog.tsx` and brands in `BrandDialog.tsx` using React Hook Form + Zod and `fa.json`/`en.json`.
- `shop/` already implements `robots.txt`, `sitemap.xml`, self-referential canonicals, and `Product`/`Organization`/`WebSite` JSON-LD (`openspec/specs/storefront/seo/spec.md`).

## Goals / Non-Goals

**Goals:**
- Align homepage `/` on-page signals (`<h1>`, `GroceryStore` JSON-LD, internal links) for «فروشگاه پروتئینی» and «پروتئین ایرانی» without introducing cross-page keyword cannibalization.
- Enable staff to manage optional `seoTitle`, `seoDescription`, `seoH1`, and `seoContentFa` on categories and brands via `admin/`, persisted in PostgreSQL (`api/`), and rendered on `shop/` `/products` with zero regression when null.
- Seed initial SEO metadata for existing core categories and partner brands in migration `V13` so target keywords are covered immediately upon deployment.

**Non-Goals:**
- Changing existing canonical URL structure (`/products?categorySlug=...` and `/products?brandSlug=...` remain canonical; `/category/[slug]` and `/brands/[slug]` keep their HTTP 308 redirects).
- Adding a rich-text/HTML editor in `admin/` (plain multi-line text for `seoContentFa` is sufficient and safe against XSS).
- Adding SEO fields to individual products (products already generate dynamic SEO metadata and `Product` JSON-LD from `nameFa`, `descriptionFa`, and `brandNameFa`).

## Decisions

1. **Nullable SEO columns on `category` and `brand` (`V13__category_brand_seo_fields.sql`)**
   - Add `seo_title VARCHAR(160)`, `seo_description VARCHAR(320)`, `seo_h1 VARCHAR(200)`, and `seo_content_fa TEXT` to both `category` and `brand`.
   - Normalize blank strings to `null` in `CategoryRequest`/`BrandRequest` handling so empty form inputs never override dynamic storefront fallbacks.
   - *Alternative considered*: Static slug-keyed map in `shop/`. Rejected because the user selected admin/DB-managed SEO (Option B) so copy can be tuned without code deploys.
2. **Public API backward compatibility**
   - Append `seoTitle`, `seoDescription`, `seoH1`, and `seoContentFa` as nullable fields on `PublicCategoryDto`, `PublicCategoryDetailDto`, and `PublicBrandDto`. Existing consumers that ignore unknown fields remain unaffected.
3. **Plain-text SEO copy rendering in `shop/`**
   - Render `seoContentFa` as sanitized plain-text paragraphs (splitting on newlines) inside a clean semantic `<section>` below the product grid in `/products`, avoiding `dangerouslySetInnerHTML`.
4. **Cannibalization guardrails**
   - Keep `فروشگاه پروتئینی` exclusive to `/` (`title` and `<h1>`).
   - Use `خرید عمده سوسیس و کالباس و مواد اولیه ساندویچی و فست‌فود` on `/wholesale` and category/brand-specific titles on `/products?...`.

## Risks / Trade-offs

- **Seed slug mismatch in `V13`**: If production/dev DBs have different category/brand slugs than `V11__initial_catalog_data.sql`, `UPDATE ... WHERE slug = ...` statements simply affect 0 rows safely without failing migration.
- **Length limits**: Enforcing `@Size(max = 160)` on `seoTitle`, `@Size(max = 320)` on `seoDescription`, and `@Size(max = 200)` on `seoH1` prevents accidental SERP bloat while keeping `seoContentFa` flexible (`@Size(max = 4000)`).
