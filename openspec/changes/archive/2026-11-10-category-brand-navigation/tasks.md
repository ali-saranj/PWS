# Tasks

## 1. Category Navigation to Products Screen

- [x] 1.1 Update `CategoriesPage` (`shop/src/app/categories/page.tsx`) so category and subcategory cards navigate to `/products?categoryId={id}`, and update `CategoriesPage.test.tsx` to verify links.
- [x] 1.2 Update homepage category entry points (`CategoryCircles.tsx`, `PromoTiles.tsx`, `HeroBanner.tsx`) to navigate to `/products?categoryId={id}` (and `/products` for All), and update unit tests.
- [x] 1.3 Update `shop/src/app/category/[slug]/page.tsx` to issue an HTTP 308 redirect to `/products?categorySlug={slug}`, and update `CategoryPage.test.tsx` to assert redirection.

## 2. Brand Navigation to Products Screen

- [x] 2.1 Update `BrandsDirectory` (`shop/src/app/brands/BrandsDirectory.tsx`) so brand cards navigate to `/products?brandId={id}`, and update `BrandsDirectory.test.tsx` to verify links.
- [x] 2.2 Make brand badges on `ProductCard` (`shop/src/components/ProductCard.tsx`) clickable links to `/products?brandId={id}`, and update `ProductCard.test.tsx`.
- [x] 2.3 Update `shop/src/app/brands/[slug]/page.tsx` to issue an HTTP 308 redirect to `/products?brandSlug={slug}`, and update `BrandShowcase.test.tsx` to assert redirection.

## 3. Verification and Integration

- [x] 3.1 Verify pre-selection and filtering behavior in `ProductsPage` and `FilterSidebar` for both `categoryId` and `brandId` query parameters.
- [x] 3.2 Run full storefront test suite (`npm test` in `shop`) and production build (`npm run build` in `shop`) to verify all tests, type-checks, and builds pass.
