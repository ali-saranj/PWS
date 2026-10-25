package ir.pws.store.staff.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordRequest(@NotBlank String password) {}
