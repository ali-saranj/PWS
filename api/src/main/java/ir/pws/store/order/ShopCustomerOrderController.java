package ir.pws.store.order;

import ir.pws.store.common.security.CustomerPrincipal;
import ir.pws.store.common.security.Roles;
import ir.pws.store.order.dto.CustomerOrderSummaryDto;
import ir.pws.store.order.dto.ReorderResultDto;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/customer/orders")
@PreAuthorize(Roles.CUSTOMER)
public class ShopCustomerOrderController {

    private final ShopCustomerOrderService orderService;

    public ShopCustomerOrderController(ShopCustomerOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<CustomerOrderSummaryDto> listOrders(
            @AuthenticationPrincipal CustomerPrincipal principal) {
        return orderService.listOrdersForCustomer(principal.customerId());
    }

    @PostMapping("/{id}/reorder")
    public ReorderResultDto reorder(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PathVariable("id") Long id) {
        return orderService.reorder(principal.customerId(), id);
    }
}
