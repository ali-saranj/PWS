package ir.pws.store.catalog.variant;

import jakarta.validation.constraints.NotNull;

public record TierDto(@NotNull Integer minQty, @NotNull Long unitPrice) {

    public TierDto(int minQty, long unitPrice) {
        this(Integer.valueOf(minQty), Long.valueOf(unitPrice));
    }
}
