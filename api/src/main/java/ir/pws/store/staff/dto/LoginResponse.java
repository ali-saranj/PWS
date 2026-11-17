package ir.pws.store.staff.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(String challenge, String mobileMasked, StaffMe staff) {

    public static LoginResponse challenge(String challenge, String mobileMasked) {
        return new LoginResponse(challenge, mobileMasked, null);
    }

    public static LoginResponse direct(StaffMe staff) {
        return new LoginResponse(null, null, staff);
    }
}
