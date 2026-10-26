package ir.pws.store.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CheckoutRequest(
        @NotEmpty List<@Valid CheckoutItemRequest> items,
        @NotNull Long addressId,
        @NotNull Long shippingMethodId,
        String customerNote) {

    public record CheckoutItemRequest(
            @NotNull Long variantId,
            @Min(1) int qty) {}
}
