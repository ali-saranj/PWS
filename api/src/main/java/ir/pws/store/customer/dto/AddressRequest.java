package ir.pws.store.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank @Size(max = 100) String province,
        @NotBlank @Size(max = 100) String city,
        @NotBlank String line,
        @NotBlank @Size(max = 10) String postalCode,
        @NotBlank @Size(max = 100) String recipientName,
        @NotBlank @Size(max = 20) String recipientMobile,
        Boolean isDefault) {}
