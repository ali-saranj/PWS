package ir.pws.store.catalog.dto;

import java.util.List;

public record HomeCatalogResponse(
        List<HomeCategoryDto> categories,
        List<ProductSummaryResponse> specialOffers,
        List<ProductSummaryResponse> popularProducts
) {
    public record HomeCategoryDto(
            long id,
            String title,
            String nameFa,
            String nameEn,
            String slug,
            String icon,
            Long parentId,
            int sortOrder
    ) {}
}
