package ir.pws.store.catalog.brand;

public record BrandDto(long id, String nameFa, String nameEn, String slug, String logoUrl, boolean active) {

    static BrandDto from(Brand b, String mediaBaseUrl) {
        String logoUrl = b.getLogoPath() == null ? null : mediaBaseUrl + "/" + b.getLogoPath();
        return new BrandDto(b.getId(), b.getNameFa(), b.getNameEn(), b.getSlug(), logoUrl, b.isActive());
    }
}
