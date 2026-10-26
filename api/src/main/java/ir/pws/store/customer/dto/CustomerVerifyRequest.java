package ir.pws.store.customer.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerVerifyRequest(@NotBlank String mobile, @NotBlank String code) {}
