package ir.pws.store.catalog.product;

import ir.pws.store.catalog.image.ImageDto;
import ir.pws.store.catalog.variant.VariantDto;
import java.util.List;

public record ProductDetailDto(
        long id,
        long version,
        long brandId,
        long categoryId,
        String slug,
        String nameFa,
        String nameEn,
        String descriptionFa,
        String descriptionEn,
        ProductStatus status,
        boolean featured,
        String seoTitleFa,
        String seoTitleEn,
        String seoDescriptionFa,
        String seoDescriptionEn,
        List<ImageDto> images,
        List<VariantDto> variants) {

    static ProductDetailDto from(Product p, List<ImageDto> images, List<VariantDto> variants) {
        return new ProductDetailDto(p.getId(), p.getVersion(), p.getBrandId(), p.getCategoryId(), p.getSlug(),
                p.getNameFa(), p.getNameEn(), p.getDescriptionFa(), p.getDescriptionEn(), p.getStatus(),
                p.isFeatured(), p.getSeoTitleFa(), p.getSeoTitleEn(), p.getSeoDescriptionFa(),
                p.getSeoDescriptionEn(), images, variants);
    }
}
