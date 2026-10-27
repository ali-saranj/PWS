package ir.pws.store.staff.dto;

import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;

public record StaffMe(long id, String username, String fullName, StaffRole role, String token) {

    public StaffMe(long id, String username, String fullName, StaffRole role) {
        this(id, username, fullName, role, null);
    }

    public static StaffMe from(StaffUser user) {
        return new StaffMe(user.getId(), user.getUsername(), user.getFullName(), user.getRole(), null);
    }

    public static StaffMe from(StaffUser user, String token) {
        return new StaffMe(user.getId(), user.getUsername(), user.getFullName(), user.getRole(), token);
    }
}
