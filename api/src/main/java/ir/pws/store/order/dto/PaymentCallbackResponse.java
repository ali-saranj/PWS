package ir.pws.store.order.dto;

public record PaymentCallbackResponse(
        boolean success,
        String trackingCode,
        String orderNumber,
        String refId) {}
