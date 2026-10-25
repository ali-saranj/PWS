package ir.pws.store.catalog.image;

public record ImageDto(long id, String url, String thumbUrl, int sortOrder, String altFa, String altEn) {

    static ImageDto from(ProductImage i, String mediaBaseUrl) {
        return new ImageDto(i.getId(), mediaBaseUrl + "/" + i.largePath(), mediaBaseUrl + "/" + i.thumbPath(),
                i.getSortOrder(), i.getAltFa(), i.getAltEn());
    }
}
