package ir.pws.store.order.dto;

import ir.pws.store.order.OrderStatus;
import java.time.Instant;
import java.util.List;

public record CustomerOrderSummaryDto(
        Long id,
        String orderNumber,
        String trackingCode,
        OrderStatus status,
        String statusLabelFa,
        long totalAmountRials,
        long totalAmountToman,
        long shippingFeeRials,
        long shippingFeeToman,
        String deliveryAddress,
        String recipientName,
        String recipientMobile,
        String courierNotes,
        Instant createdAt,
        String createdAtJalali,
        List<CustomerOrderItemDto> items
) {}
