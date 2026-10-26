package ir.pws.store.customer;

import ir.pws.store.common.security.CustomerPrincipal;
import ir.pws.store.common.security.Roles;
import ir.pws.store.customer.dto.AddressDto;
import ir.pws.store.customer.dto.AddressRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/customer/addresses")
@PreAuthorize(Roles.CUSTOMER)
public class ShopCustomerAddressController {

    private final CustomerAddressService addressService;

    public ShopCustomerAddressController(CustomerAddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressDto> list(@AuthenticationPrincipal CustomerPrincipal principal) {
        return addressService.listAddresses(principal.customerId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressDto create(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @Valid @RequestBody AddressRequest request) {
        return addressService.createAddress(principal.customerId(), request);
    }
}
