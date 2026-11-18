# Tasks

## 1. Refactor SpecialOffersCarousel

- [x] 1.1 Import `ProductCard` in `shop/src/components/home/SpecialOffersCarousel.tsx` and replace inline product card markup with `<ProductCard product={prod} />`.
- [x] 1.2 Clean up redundant inline cart adding state and handlers in `SpecialOffersCarousel.tsx` that are now managed by `ProductCard`.

## 2. Refactor PopularProductsCarousel

- [x] 2.1 Import `ProductCard` in `shop/src/components/home/PopularProductsCarousel.tsx` and replace inline product card markup with `<ProductCard product={prod} />`.
- [x] 2.2 Clean up redundant inline cart adding state and unused local handlers in `PopularProductsCarousel.tsx`.

## 3. Verification & Testing

- [x] 3.1 Run `npm test` in `shop` to verify `HomePage.test.tsx` and `ProductCard.test.tsx` pass.
- [x] 3.2 Run `npm run build` in `shop` to confirm TypeScript type-checking and bundling succeed without errors.
