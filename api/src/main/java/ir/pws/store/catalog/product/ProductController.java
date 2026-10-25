package ir.pws.store.catalog.product;

import ir.pws.store.common.security.Roles;
import ir.pws.store.common.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize(Roles.CATALOG)
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<ProductSummaryDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(q, status, categoryId, brandId, page, size);
    }

    @GetMapping("/{id}")
    public ProductDetailDto get(@PathVariable long id) {
        return service.getDetail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDetailDto create(@Valid @RequestBody ProductUpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ProductDetailDto update(@PathVariable long id, @Valid @RequestBody ProductUpsertRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/status")
    public ProductDetailDto changeStatus(@PathVariable long id, @Valid @RequestBody ProductStatusRequest request) {
        return service.changeStatus(id, request);
    }
}
