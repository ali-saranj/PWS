package ir.pws.store.catalog.variant;

import java.util.List;

public record VariantDto(
        long id,
        long version,
        String sku,
        String flavourFa,
        String flavourEn,
        String sizeLabel,
        Integer weightGrams,
        long basePrice,
        Long compareAtPrice,
        int stockOnHand,
        int lowStockThreshold,
        boolean active,
        int sortOrder,
        List<TierDto> tiers) {

    static VariantDto from(Variant v, List<VolumeTier> tiers) {
        return new VariantDto(v.getId(), v.getVersion(), v.getSku(), v.getFlavourFa(), v.getFlavourEn(),
                v.getSizeLabel(), v.getWeightGrams(), v.getBasePrice(), v.getCompareAtPrice(), v.getStockOnHand(),
                v.getLowStockThreshold(), v.isActive(), v.getSortOrder(),
                tiers.stream().map(t -> new TierDto(t.getMinQty(), t.getUnitPrice())).toList());
    }
}
