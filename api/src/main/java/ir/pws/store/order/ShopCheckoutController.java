package ir.pws.store.order;

import ir.pws.store.common.security.CustomerPrincipal;
import ir.pws.store.common.security.Roles;
import ir.pws.store.order.dto.CheckoutRequest;
import ir.pws.store.order.dto.CheckoutResponse;
import ir.pws.store.order.dto.PaymentCallbackResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop")
public class ShopCheckoutController {

    private final CheckoutService checkoutService;

    public ShopCheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/checkout")
    @PreAuthorize(Roles.CUSTOMER)
    public CheckoutResponse checkout(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @Valid @RequestBody CheckoutRequest request) {
        return checkoutService.checkout(principal.customerId(), request);
    }

    @GetMapping("/payments/callback")
    public PaymentCallbackResponse handleCallback(
            @RequestParam(value = "token", required = false) String token,
            @RequestParam(value = "Authority", required = false) String authority,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "Status", required = false) String uppercaseStatus,
            @RequestParam(value = "responseCode", required = false) Integer responseCode) {
        String authorityOrToken = token != null && !token.isBlank() ? token : authority;
        String resolvedStatus = status != null && !status.isBlank() ? status : uppercaseStatus;
        return checkoutService.handlePaymentCallback(authorityOrToken, resolvedStatus, responseCode);
    }

    @PostMapping("/payments/callback")
    public PaymentCallbackResponse handleCallbackPost(
            @RequestParam(value = "token", required = false) String token,
            @RequestParam(value = "Authority", required = false) String authority,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "Status", required = false) String uppercaseStatus,
            @RequestParam(value = "responseCode", required = false) Integer responseCode) {
        String authorityOrToken = token != null && !token.isBlank() ? token : authority;
        String resolvedStatus = status != null && !status.isBlank() ? status : uppercaseStatus;
        return checkoutService.handlePaymentCallback(authorityOrToken, resolvedStatus, responseCode);
    }

    @GetMapping("/payments/zarinpal/callback")
    public PaymentCallbackResponse handleZarinpalCallbackGet(
            @RequestParam("Authority") String authority,
            @RequestParam("Status") String status) {
        return checkoutService.handlePaymentCallback(authority, status);
    }

    @PostMapping("/payments/zarinpal/callback")
    public PaymentCallbackResponse handleZarinpalCallbackPost(
            @RequestParam("Authority") String authority,
            @RequestParam("Status") String status) {
        return checkoutService.handlePaymentCallback(authority, status);
    }
}
