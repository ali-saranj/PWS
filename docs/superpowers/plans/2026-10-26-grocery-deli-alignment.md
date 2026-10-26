# Deli & Grocery Catalog Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the existing Phase 1 catalog seed data, admin interface labels, and tests with the authentic Iranian deli & grocery store (پروتئینی) domain.

**Architecture:** Maintain complete backwards compatibility with the existing Flyway schema and JPA entities (`variant.flavour_fa`, `variant.size_label`, etc.) while updating the dev-seed SQL dataset, aligning `DevSeedTest`, updating admin i18n labels to represent deli styles/cuts (طعم / مدل), and updating documentation.

**Tech Stack:** Java 17, Spring Boot 3.5, JUnit 5, AssertJ, PostgreSQL, React 19, TypeScript, MUI, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-25-grocery-deli-store-design.md`

## Global Constraints

- Retain exact database schema (no breaking Flyway table/column alterations).
- Keep monetary units in whole Rials in the database and Toman in the UI.
- All tests in `api` (`./mvnw test`) and `admin` (`npm test`, `npm run build`) must pass cleanly.
- Maintain bilingual support (Persian RTL default, English LTR).

## Review Focus

- Seed data must strictly satisfy `DevSeedTest`: every active product has at least one active variant.
- Stock movements must balance: `stock_on_hand` equals the sum of initial `stock_movement` rows.
- Volume tiers must be monotonically decreasing in unit price and have `min_qty >= 2`.
- Admin variant dialog and table headers must display "طعم / مدل" (Flavor / Style) smoothly in both Persian and English.
- Admin tests and build must succeed without type or test regressions.

---

### Task 1: Update Dev Seed Data for Deli & Grocery Catalog

**Files:**
- Modify: `api/src/main/resources/db/dev/V1000__dev_seed.sql`
- Test: `api/src/test/java/ir/pws/store/DevSeedTest.java`

**Interfaces:**
- Consumes: Flyway tables `category`, `brand`, `product`, `variant`, `volume_tier`, `stock_movement`.
- Produces: Authentic Iranian deli categories (سوسیس و هات‌داگ, کالباس و ژامبون, خیارشور و ترشیجات, سس و چاشنی, نان ساندویچی, چیپس و تنقلات, کنسروجات), brands (آندره, ۲۰۲, یک‌و‌یک, دلپذیر, کاله), products, variants with pre-set portion weights (e.g. 250g sliced, 500g, 1kg), volume tiers, and initial stock movements.

- [x] **Step 1: Write the updated assertions in `DevSeedTest.java`**

Update `seedsExpectedCounts` to check for 7 categories (with subcategories), 5 brands, 3 deli products, and variants with valid tiers and stock balance.

- [x] **Step 2: Run `DevSeedTest` to verify failure**

Run: `cd api && ./mvnw test -Dtest=DevSeedTest`
Expected: FAIL due to mismatch with existing bodybuilding seed.

- [x] **Step 3: Replace content of `V1000__dev_seed.sql`**

Insert categories:
1. `سوسیس و هات‌داگ` (`sausages-hotdogs`)
2. `کالباس و ژامبون` (`cold-cuts-deli`)
   - Subcategory: `ژامبون بوقلمون` (`turkey-ham`, parent: `cold-cuts-deli`)
   - Subcategory: `ژامبون گوشت` (`beef-ham`, parent: `cold-cuts-deli`)
3. `خیارشور و ترشیجات` (`pickles-condiments`)
4. `سس و چاشنی` (`sauces`)
5. `نان ساندویچی` (`sandwich-bread`)
6. `چیپس و تنقلات` (`chips-snacks`)
7. `کنسروجات` (`canned-goods`)

Insert brands:
1. `آندره` (`Andre`, `andre`)
2. `۲۰۲` (`202`, `brand-202`)
3. `یک‌و‌یک` (`Yek O Yek`, `yek-o-yek`)
4. `دلپذیر` (`Delpazir`, `delpazir`)
5. `کاله` (`Kalleh`, `kalleh`)

Insert products and variants:
1. `ژامبون بوقلمون ۹۰٪ آندره` (`andre-turkey-ham-90`) with variants:
   - SKU `AND-TURK-250G`: `ساده` (Plain), `۲۵۰ گرم اسلایس` (250g sliced), 250g, base price 1,850,000 Rials (185,000 Toman).
   - SKU `AND-TURK-500G`: `ساده` (Plain), `۵۰۰ گرم اسلایس` (500g sliced), 500g, base price 3,600,000 Rials.
2. `سوسیس فرانکفورتر ۲۰۲` (`202-frankfurter`) with variants:
   - SKU `202-FRANK-500G`: `دودی` (Smoked), `۵۰۰ گرم` (500g), 500g, base price 2,400,000 Rials.
3. `خیارشور ویژه یک‌و‌یک` (`yek-o-yek-special-pickles`) with variants:
   - SKU `YOY-PCK-680G`: `سرکه‌ای ویژه` (Special Vinegar), `شیشه ۶۸۰ گرم` (680g Jar), 680g, base price 950,000 Rials.

Add volume tiers and initial stock ledger entries.

- [x] **Step 4: Run `DevSeedTest` to verify pass**

Run: `cd api && ./mvnw test -Dtest=DevSeedTest`
Expected: PASS.

- [x] **Step 5: Run full API test suite**

Run: `cd api && ./mvnw -q test`
Expected: All tests PASS.

- [x] **Step 6: Commit**

```bash
git add api/src/main/resources/db/dev/V1000__dev_seed.sql api/src/test/java/ir/pws/store/DevSeedTest.java
git commit -m "feat(api): update dev seed catalog to deli and grocery products"
```

---

### Task 2: Update Admin UI Labels and Terminology for Deli Items

**Files:**
- Modify: `admin/src/i18n/fa.json`
- Modify: `admin/src/i18n/en.json`
- Modify: `admin/src/features/products/VariantsTab.tsx`
- Modify: `admin/src/features/products/VariantDialog.tsx`
- Modify: `README.md`
- Test: `admin/src/features/products/VariantsTab.test.tsx`

**Interfaces:**
- Consumes: i18n translation keys under `products.variants`.
- Produces: Context-appropriate labels for deli store: "طعم / مدل" (Flavor / Style) instead of only "طعم" (Flavour).

- [x] **Step 1: Update i18n translation strings**

In `admin/src/i18n/fa.json`:
- `"flavour": "طعم / مدل"`
- `"flavourFa": "طعم / مدل (فارسی)"`
- `"flavourEn": "طعم / مدل (انگلیسی)"`

In `admin/src/i18n/en.json`:
- `"flavour": "Style / Flavor"`
- `"flavourFa": "Style / Flavor (Persian)"`
- `"flavourEn": "Style / Flavor (English)"`

- [x] **Step 2: Update README.md header and description**

Update `README.md` to state:
`# PWS — deli & grocery store (فروشگاه پروتئینی و سوپرمارکتی)` and reflect the deli catalog categories.

- [x] **Step 3: Run admin test suite**

Run: `cd admin && npx vitest run`
Expected: PASS.

- [x] **Step 4: Run admin type check and build**

Run: `cd admin && npx tsc -b && npx vite build`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add admin/src/i18n/fa.json admin/src/i18n/en.json README.md
git commit -m "chore(admin): align UI labels and README with deli and grocery domain"
```
