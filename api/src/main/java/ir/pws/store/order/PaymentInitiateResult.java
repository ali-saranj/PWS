package ir.pws.store.order;

public record PaymentInitiateResult(
        String trackingToken,
        String paymentUrl) {}
