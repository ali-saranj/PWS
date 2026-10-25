package ir.pws.store.catalog.variant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TiersRequest(@NotNull List<@NotNull @Valid TierDto> tiers) {}
