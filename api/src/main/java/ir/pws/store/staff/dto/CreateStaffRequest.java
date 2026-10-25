package ir.pws.store.staff.dto;

import ir.pws.store.staff.StaffRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank String password,
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank String mobile,
        @NotNull StaffRole role) {}
