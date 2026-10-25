package ir.pws.store.staff.dto;

import ir.pws.store.staff.StaffRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateStaffRequest(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank String mobile,
        @NotNull StaffRole role,
        @NotNull Boolean active,
        @NotNull Long version) {}
