package ir.pws.store.catalog.dto;

public record SearchSuggestionDto(
        long id,
        String slug,
        String nameFa,
        String thumbnailUrl,
        long priceToman,
        String categoryNameFa
) {}
