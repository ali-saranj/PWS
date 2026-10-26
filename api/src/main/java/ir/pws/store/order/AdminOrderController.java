package ir.pws.store.order;

import ir.pws.store.common.security.Roles;
import ir.pws.store.common.web.PageResponse;
import ir.pws.store.order.dto.AdminOrderDetailResponse;
import ir.pws.store.order.dto.AdminOrderSummaryResponse;
import ir.pws.store.order.dto.OrderStatusTransitionRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize(Roles.ORDER)
public class AdminOrderController {

    private final AdminOrderService service;

    public AdminOrderController(AdminOrderService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<AdminOrderSummaryResponse> list(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(status, q, page, size);
    }

    @GetMapping("/{id}")
    public AdminOrderDetailResponse getDetail(@PathVariable long id) {
        return service.getDetail(id);
    }

    @PostMapping("/{id}/status")
    public AdminOrderDetailResponse changeStatus(
            @PathVariable long id,
            @Valid @RequestBody OrderStatusTransitionRequest request) {
        return service.changeStatus(id, request);
    }
}
