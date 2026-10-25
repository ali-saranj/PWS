package ir.pws.store.catalog.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        Long parentId,
        @NotBlank @Size(max = 200) String nameFa,
        @Size(max = 200) String nameEn,
        @NotBlank String slug,
        int sortOrder,
        boolean active) {}
