package ir.pws.store.catalog.variant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** {@code version} is required on update only; {@code initialStock} is used on create only. */
public record VariantUpsertRequest(
        @NotBlank @Size(max = 64) String sku,
        @Size(max = 100) String flavourFa,
        @Size(max = 100) String flavourEn,
        @Size(max = 50) String sizeLabel,
        @Positive Integer weightGrams,
        @NotNull @Positive Long basePrice,
        @Positive Long compareAtPrice,
        @PositiveOrZero Integer lowStockThreshold,
        Boolean active,
        Integer sortOrder,
        @PositiveOrZero Integer initialStock,
        Long version) {}
