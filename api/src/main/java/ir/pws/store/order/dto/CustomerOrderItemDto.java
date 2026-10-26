package ir.pws.store.order.dto;

public record CustomerOrderItemDto(
        Long variantId,
        Long productId,
        String productTitle,
        String portionLabel,
        String sku,
        int quantity,
        long unitPriceRials,
        long unitPriceToman,
        long totalPriceToman,
        String imageUrl
) {}
