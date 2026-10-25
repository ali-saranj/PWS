package ir.pws.store.catalog.brand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandRequest(
        @NotBlank @Size(max = 200) String nameFa,
        @Size(max = 200) String nameEn,
        @NotBlank String slug,
        boolean active) {}
