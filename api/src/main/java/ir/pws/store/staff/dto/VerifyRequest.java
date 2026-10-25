package ir.pws.store.staff.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyRequest(@NotBlank String challenge, @NotBlank String code) {}
