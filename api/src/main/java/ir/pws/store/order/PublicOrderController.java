package ir.pws.store.order;

import ir.pws.store.order.dto.OrderTrackingResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/orders")
public class PublicOrderController {

    private final CheckoutService checkoutService;

    public PublicOrderController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @GetMapping("/track/{trackingCode}")
    public OrderTrackingResponse track(@PathVariable String trackingCode) {
        return checkoutService.getPublicOrderTracking(trackingCode);
    }
}
