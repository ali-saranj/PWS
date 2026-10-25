package ir.pws.store.catalog.product;

import ir.pws.store.catalog.variant.VariantRepository;
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

    /** Variant aggregates and thumbnail come from one query each per page (null aggregate = no variants). */
    static ProductSummaryDto from(Product p, String thumbnailUrl, VariantRepository.ProductAggregate agg) {
        return new ProductSummaryDto(p.getId(), p.getNameFa(), p.getNameEn(), p.getSlug(), p.getStatus(),
                p.getBrandId(), p.getCategoryId(), thumbnailUrl, agg == null ? 0 : agg.getVariantCount().intValue(),
                agg == null ? null : agg.getMinPrice(), agg == null ? 0 : agg.getTotalStock(), p.getUpdatedAt());
    }
}
