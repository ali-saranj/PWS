package ir.pws.store.catalog.brand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandRequest(
        @NotBlank @Size(max = 200) String nameFa,
        @Size(max = 200) String nameEn,
        @NotBlank String slug,
        boolean active,
        @Size(max = 160) String seoTitle,
        @Size(max = 320) String seoDescription,
        @Size(max = 200) String seoH1,
        @Size(max = 4000) String seoContentFa) {}
