package ir.pws.store.catalog.variant;

import ir.pws.store.common.security.Roles;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize(Roles.CATALOG)
public class VariantController {

    private final VariantService service;

    public VariantController(VariantService service) {
        this.service = service;
    }

    @PostMapping("/products/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public VariantDto create(@PathVariable long productId, @Valid @RequestBody VariantUpsertRequest request) {
        return service.create(productId, request);
    }

    @PutMapping("/variants/{id}")
    public VariantDto update(@PathVariable long id, @Valid @RequestBody VariantUpsertRequest request) {
        return service.update(id, request);
    }

    @PutMapping("/variants/{id}/tiers")
    public VariantDto replaceTiers(@PathVariable long id, @Valid @RequestBody TiersRequest request) {
        return service.replaceTiers(id, request);
    }
}
