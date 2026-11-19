package ir.pws.store.order;

public interface PaymentGateway {

    String gatewayName();

    PaymentInitiateResult initiatePayment(long amountRials, String description, String mobile, String callbackUrl);

    PaymentVerifyResult verifyPayment(long amountRials, String authorityOrToken);
}
