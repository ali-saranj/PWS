package ir.pws.store.customer.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerOtpRequest(@NotBlank String mobile) {}
