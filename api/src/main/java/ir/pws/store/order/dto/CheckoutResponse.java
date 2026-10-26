package ir.pws.store.order.dto;

public record CheckoutResponse(
        String orderNumber,
        String trackingCode,
        String paymentUrl,
        String authority) {}
