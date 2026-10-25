package ir.pws.store.catalog.product;

import java.time.Instant;

public record ProductSummaryDto(
        long id,
        String nameFa,
        String nameEn,
        String slug,
        ProductStatus status,
        long brandId,
        long categoryId,
        String thumbnailUrl,
        int variantCount,
        Long minPrice,
        long totalStock,
        Instant updatedAt) {

    /** Variant/image-derived fields are filled by later tasks. */
    static ProductSummaryDto from(Product p) {
        return new ProductSummaryDto(p.getId(), p.getNameFa(), p.getNameEn(), p.getSlug(), p.getStatus(),
                p.getBrandId(), p.getCategoryId(), null, 0, null, 0, p.getUpdatedAt());
    }
}
