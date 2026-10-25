package ir.pws.store.catalog.inventory;

import java.time.Instant;

public record StockMovementDto(
        long id, int delta, StockMovementReason reason, String note, String staffUsername, Instant createdAt) {}
