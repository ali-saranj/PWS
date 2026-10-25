package ir.pws.store.catalog.inventory;

public record InventoryRowDto(
        long variantId,
        long productId,
        String productNameFa,
        String productNameEn,
        String sku,
        String flavourFa,
        String flavourEn,
        String sizeLabel,
        int stockOnHand,
        int lowStockThreshold,
        boolean active) {}
