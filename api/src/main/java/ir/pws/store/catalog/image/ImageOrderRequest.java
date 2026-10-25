package ir.pws.store.catalog.image;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ImageOrderRequest(@NotNull List<Long> imageIds) {}
