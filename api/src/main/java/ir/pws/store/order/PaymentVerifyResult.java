package ir.pws.store.order;

public record PaymentVerifyResult(
        boolean success,
        String refId,
        String cardPanMasked,
        String rawResponse,
        String errorMessage) {

    public static PaymentVerifyResult success(String refId, String cardPanMasked, String rawResponse) {
        return new PaymentVerifyResult(true, refId, cardPanMasked, rawResponse, null);
    }

    public static PaymentVerifyResult failure(String errorMessage, String rawResponse) {
        return new PaymentVerifyResult(false, null, null, rawResponse, errorMessage);
    }
}
