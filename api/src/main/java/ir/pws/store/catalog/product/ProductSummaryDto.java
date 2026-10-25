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

    /** Thumbnail is filled by a later task; variant aggregates come from one query per page (null = no variants). */
    static ProductSummaryDto from(Product p, VariantRepository.ProductAggregate agg) {
        return new ProductSummaryDto(p.getId(), p.getNameFa(), p.getNameEn(), p.getSlug(), p.getStatus(),
                p.getBrandId(), p.getCategoryId(), null, agg == null ? 0 : agg.getVariantCount().intValue(),
                agg == null ? null : agg.getMinPrice(), agg == null ? 0 : agg.getTotalStock(), p.getUpdatedAt());
    }
}
