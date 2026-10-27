# Product Filter Fix Specification

## Overview

Fix catalog product filtering across Spring Boot (`api/`) and Next.js Storefront (`shop/`). Currently, filtering by category sends `NaN` (400 Bad Request / empty results), filtering by in-stock is unimplemented on the API and storefront server, brand filtering is disconnected between Persian names and backend IDs, and price filtering strips Persian numerals.

## Goals

1. **Category Filtering:** Ensure category selection passes valid category IDs or slugs without ever serializing `NaN` to the backend. Support category descendant tree resolution.
2. **In-Stock Filtering:** Implement `inStock` boolean filtering across `PublicCatalogController`, `PublicCatalogService`, and `serverCatalog.ts`. When `inStock=true`, only products with at least one active variant having `stockOnHand > 0` are returned.
3. **Brand Filtering & Dynamic Brands:** Add a public `GET /api/shop/catalog/brands` endpoint returning active brands. Update `FilterSidebar`, `CatalogFilters`, and `ProductsPage` to bind real brand IDs.
4. **Persian Number Handling for Prices:** Convert Persian/Arabic digits to Latin before sanitizing numeric inputs so price ranges entered in Persian script work seamlessly.
5. **Defensive Parameter Sanitization:** Ensure `serverCatalog.ts` and Next.js route components never send `NaN` or invalid parameters to the backend.

## API Contracts

### 1. `GET /api/shop/catalog/products`
Query parameters:
- `categoryId`: (Optional, Long) Numeric category ID (includes descendant categories).
- `categorySlug`: (Optional, String) Category slug (resolved to ID if `categoryId` not provided).
- `brandId`: (Optional, Long) Numeric brand ID.
- `brandSlug`: (Optional, String) Brand slug (resolved to ID if `brandId` not provided).
- `brandIds`: (Optional, List<Long>) List of brand IDs.
- `inStock`: (Optional, Boolean) When `true`, filters to products where at least one active variant has `stockOnHand > 0`.
- `onSale`: (Optional, Boolean) Existing on-sale filter.
- `minPrice`: (Optional, Long in Rials) Minimum base price.
- `maxPrice`: (Optional, Long in Rials) Maximum base price.
- `sort`: (Optional, String) Sort order (`newest`, `price_asc`, `price_desc`, `popular`).
- `page`: (Optional, Integer, default 0).
- `size`: (Optional, Integer, default 20 or 24).

### 2. `GET /api/shop/catalog/brands`
Public endpoint returning all active brands:
```json
[
  {
    "id": 1,
    "nameFa": "کاله",
    "nameEn": "Kalleh",
    "slug": "kalleh"
  }
]
```

## Storefront Contracts

### 1. `serverCatalog.ts`
- `fetchCatalogProducts(params)`: Add `inStock?: boolean`, `categorySlug?: string`, `brandIds?: number[]`. Guard all numeric params against `isNaN`.
- `fetchBrands()`: Call `GET /api/shop/catalog/brands` with revalidate 300s fallback.

### 2. `FilterSidebar.tsx` & `CatalogFilters.tsx`
- `FilterState`:
  ```typescript
  export interface FilterState {
    categoryId?: number | string | null;
    brandId?: number | null;
    brands?: string[];
    inStockOnly: boolean;
    onSaleOnly: boolean;
    minPrice?: number | null;
    maxPrice?: number | null;
  }
  ```
- Price input parses Persian digits (`Digits.toLatin` or `lib/format.ts`).
- Categories bind cleanly by numeric ID or slug.
