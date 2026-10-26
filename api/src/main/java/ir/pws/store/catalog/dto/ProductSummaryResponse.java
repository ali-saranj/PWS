package ir.pws.store.catalog.dto;

import java.util.List;

public record ProductSummaryResponse(
        long id,
        String slug,
        String nameFa,
        String nameEn,
        long brandId,
        String brandNameFa,
        String brandNameEn,
        long categoryId,
        String categoryNameFa,
        String categoryNameEn,
        String thumbnailUrl,
        long basePriceRials,
        long priceToman,
        Long compareAtPriceRials,
        Long compareAtPriceToman,
        Integer discountPercent,
        boolean inStock,
        long totalStock,
        boolean featured,
        List<String> badges,
        Long defaultVariantId
) {}
