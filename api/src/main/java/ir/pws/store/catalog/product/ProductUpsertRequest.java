package ir.pws.store.catalog.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductUpsertRequest(
        @NotNull Long brandId,
        @NotNull Long categoryId,
        @NotBlank String slug,
        @NotBlank @Size(max = 200) String nameFa,
        @Size(max = 200) String nameEn,
        String descriptionFa,
        String descriptionEn,
        boolean featured,
        @Size(max = 70) String seoTitleFa,
        @Size(max = 70) String seoTitleEn,
        @Size(max = 160) String seoDescriptionFa,
        @Size(max = 160) String seoDescriptionEn,
        Long version) {}
