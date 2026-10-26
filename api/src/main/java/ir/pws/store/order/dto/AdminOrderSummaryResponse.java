package ir.pws.store.order.dto;

import ir.pws.store.order.OrderStatus;
import java.time.Instant;

public record AdminOrderSummaryResponse(
        Long id,
        String orderNumber,
        String trackingCode,
        String customerMobile,
        String recipientName,
        long totalRials,
        OrderStatus status,
        Instant placedAt,
        boolean needsAttention,
        int itemCount
) {}
