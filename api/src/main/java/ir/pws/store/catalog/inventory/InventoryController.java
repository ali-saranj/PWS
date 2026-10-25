package ir.pws.store.catalog.inventory;

import ir.pws.store.common.security.Roles;
import ir.pws.store.common.web.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize(Roles.CATALOG)
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping("/inventory")
    public PageResponse<InventoryRowDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(q, Boolean.TRUE.equals(lowStock), page, size);
    }

    @PostMapping("/inventory/adjustments")
    public List<InventoryRowDto> adjust(@Valid @RequestBody AdjustmentRequest request) {
        return service.adjust(request);
    }

    @GetMapping("/variants/{id}/movements")
    public PageResponse<StockMovementDto> movements(
            @PathVariable long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.movements(id, page, size);
    }
}
