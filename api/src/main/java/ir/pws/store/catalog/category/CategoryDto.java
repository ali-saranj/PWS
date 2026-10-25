package ir.pws.store.catalog.category;

public record CategoryDto(
        long id, Long parentId, String nameFa, String nameEn, String slug, int sortOrder, boolean active) {

    static CategoryDto from(Category c) {
        return new CategoryDto(
                c.getId(), c.getParentId(), c.getNameFa(), c.getNameEn(), c.getSlug(), c.getSortOrder(), c.isActive());
    }
}
