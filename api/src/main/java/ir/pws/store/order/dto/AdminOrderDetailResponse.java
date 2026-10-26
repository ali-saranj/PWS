package ir.pws.store.order.dto;

import ir.pws.store.customer.dto.CustomerDto;
import ir.pws.store.order.ActorType;
import ir.pws.store.order.OrderStatus;
import ir.pws.store.order.PaymentStatus;
import java.time.Instant;
import java.util.List;

public record AdminOrderDetailResponse(
        Long id,
        String orderNumber,
        String trackingCode,
        OrderStatus status,
        CustomerDto customer,
        DeliveryAddressDto deliveryAddress,
        List<AdminOrderItemResponse> items,
        long subtotalRials,
        long shippingCostRials,
        long discountTotalRials,
        long totalRials,
        PaymentDetailDto payment,
        String courierNotes,
        String adminNotes,
        boolean needsAttention,
        Instant placedAt,
        Instant paidAt,
        Instant createdAt,
        Instant updatedAt,
        List<OrderStatusHistoryDto> statusHistory
) {

    public record DeliveryAddressDto(
            String province,
            String city,
            String addressLine,
            String postalCode,
            String recipientName,
            String recipientMobile
    ) {}

    public record AdminOrderItemResponse(
            Long id,
            Long variantId,
            String productNameFa,
            String productNameEn,
            String variantLabelFa,
            String variantLabelEn,
            String sku,
            long unitPrice,
            int qty,
            long lineTotal
    ) {}

    public record PaymentDetailDto(
            String gateway,
            String refId,
            String cardPanMasked,
            PaymentStatus status,
            Long amount
    ) {}

    public record OrderStatusHistoryDto(
            Long id,
            OrderStatus fromStatus,
            OrderStatus toStatus,
            ActorType actorType,
            Long actorId,
            String note,
            Instant createdAt
    ) {}
}
