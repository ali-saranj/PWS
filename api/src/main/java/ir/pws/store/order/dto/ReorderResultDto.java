package ir.pws.store.order.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ReorderResultDto(
        List<ReorderItemDto> addedItems,
        List<String> unavailableItems
) {
    public record ReorderItemDto(
            Long variantId,
            Long productId,
            String title,
            String portionLabel,
            String sku,
            long unitPriceToman,
            int quantity,
            int maxStock,
            String imageUrl
    ) {
        @JsonProperty("priceToman")
        public long priceToman() {
            return unitPriceToman;
        }
    }
}
