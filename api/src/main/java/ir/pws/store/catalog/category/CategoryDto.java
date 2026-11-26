package ir.pws.store.catalog.category;

public record CategoryDto(
        long id,
        Long parentId,
        String nameFa,
        String nameEn,
        String slug,
        int sortOrder,
        boolean active,
        String seoTitle,
        String seoDescription,
        String seoH1,
        String seoContentFa) {

    static CategoryDto from(Category c) {
        return new CategoryDto(
                c.getId(),
                c.getParentId(),
                c.getNameFa(),
                c.getNameEn(),
                c.getSlug(),
                c.getSortOrder(),
                c.isActive(),
                c.getSeoTitle(),
                c.getSeoDescription(),
                c.getSeoH1(),
                c.getSeoContentFa());
    }
}
