package ir.pws.store.customer.dto;

import ir.pws.store.customer.Address;
import java.time.Instant;

public record AddressDto(
        Long id,
        Long customerId,
        String province,
        String city,
        String line,
        String postalCode,
        String recipientName,
        String recipientMobile,
        boolean isDefault,
        Instant createdAt) {

    public static AddressDto from(Address a) {
        return new AddressDto(
                a.getId(),
                a.getCustomerId(),
                a.getProvince(),
                a.getCity(),
                a.getLine(),
                a.getPostalCode(),
                a.getRecipientName(),
                a.getRecipientMobile(),
                a.isDefault(),
                a.getCreatedAt());
    }
}
