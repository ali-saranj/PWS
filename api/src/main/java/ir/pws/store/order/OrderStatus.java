package ir.pws.store.order;

public enum OrderStatus {
    PENDING_PAYMENT,
    AWAITING_APPROVAL,
    APPROVED,
    PREPARING,
    DISPATCHED,
    DELIVERED,
    CANCELLED
}
