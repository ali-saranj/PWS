package ir.pws.store.customer;

import ir.pws.store.common.text.Digits;
import ir.pws.store.common.text.MobileNumbers;
import ir.pws.store.customer.dto.AddressDto;
import ir.pws.store.customer.dto.AddressRequest;
import java.time.Clock;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerAddressService {

    private final AddressRepository addressRepository;
    private final Clock clock;

    public CustomerAddressService(AddressRepository addressRepository, Clock clock) {
        this.addressRepository = addressRepository;
        this.clock = clock;
    }

    public List<AddressDto> listAddresses(long customerId) {
        return addressRepository.findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(customerId)
                .stream()
                .map(AddressDto::from)
                .toList();
    }

    @Transactional
    public AddressDto createAddress(long customerId, AddressRequest req) {
        String recipientMobile = MobileNumbers.normalize(req.recipientMobile());
        String postalCode = Digits.toLatin(req.postalCode()).trim();
        boolean isDefault = Boolean.TRUE.equals(req.isDefault());

        if (isDefault) {
            addressRepository.unsetDefaultForCustomer(customerId, clock.instant());
        }

        Address address = new Address(
                customerId,
                req.province().trim(),
                req.city().trim(),
                req.line().trim(),
                postalCode,
                req.recipientName().trim(),
                recipientMobile,
                isDefault);

        return AddressDto.from(addressRepository.save(address));
    }
}
