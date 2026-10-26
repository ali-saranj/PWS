package ir.pws.store.catalog.dto;

import java.util.List;

public record ProductDetailResponse(
        long id,
        String slug,
        String nameFa,
        String nameEn,
        String descriptionFa,
        String descriptionEn,
        long brandId,
        String brandNameFa,
        String brandNameEn,
        long categoryId,
        String categoryNameFa,
        String categoryNameEn,
        List<CategoryBreadcrumb> breadcrumb,
        List<StorefrontImageDto> images,
        List<StorefrontVariantDto> variants,
        long basePriceRials,
        long priceToman,
        Long compareAtPriceRials,
        Long compareAtPriceToman,
        Integer discountPercent,
        boolean inStock,
        boolean featured,
        List<String> badges
) {
    public record CategoryBreadcrumb(
            long id,
            String nameFa,
            String nameEn,
            String slug
    ) {}

    public record StorefrontImageDto(
            long id,
            String url,
            String thumbUrl,
            int sortOrder,
            String altFa,
            String altEn
    ) {}

    public record StorefrontVariantDto(
            long id,
            String sku,
            String flavourFa,
            String flavourEn,
            String sizeLabel,
            Integer weightGrams,
            long basePriceRials,
            long priceToman,
            Long compareAtPriceRials,
            Long compareAtPriceToman,
            Integer discountPercent,
            int stockOnHand,
            boolean inStock,
            int sortOrder,
            List<VolumeTierDto> tiers
    ) {}

    public record VolumeTierDto(
            int minQty,
            long unitPriceRials,
            long unitPriceToman,
            int discountPercent
    ) {}
}
