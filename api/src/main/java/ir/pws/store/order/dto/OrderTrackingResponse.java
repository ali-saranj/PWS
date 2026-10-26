package ir.pws.store.order.dto;

import ir.pws.store.order.OrderStatus;
import java.time.Instant;
import java.util.List;

public record OrderTrackingResponse(
        String trackingCode,
        String orderNumber,
        OrderStatus status,
        Instant placedAt,
        Instant paidAt,
        String recipientNameMasked,
        String recipientMobileMasked,
        String province,
        String city,
        List<OrderItemTrackDto> items,
        List<OrderStatusHistoryTrackDto> timeline,
        String courierNotes) {

    public record OrderItemTrackDto(
            String productNameFa,
            String productNameEn,
            String variantLabelFa,
            String variantLabelEn,
            int qty) {}

    public record OrderStatusHistoryTrackDto(
            OrderStatus status,
            Instant timestamp,
            String note) {}
}
