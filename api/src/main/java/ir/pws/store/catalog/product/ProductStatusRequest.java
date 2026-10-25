package ir.pws.store.catalog.product;

import jakarta.validation.constraints.NotNull;

public record ProductStatusRequest(@NotNull ProductStatus status, Long version) {}
