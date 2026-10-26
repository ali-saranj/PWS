package ir.pws.store.order.dto;

import ir.pws.store.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusTransitionRequest(
        @NotNull OrderStatus targetStatus,
        String note,
        String courierNotes
) {}
