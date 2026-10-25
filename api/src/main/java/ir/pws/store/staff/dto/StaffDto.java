package ir.pws.store.staff.dto;

import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;

public record StaffDto(
        long id, String username, String fullName, String mobile, StaffRole role, boolean active, long version) {

    public static StaffDto from(StaffUser u) {
        return new StaffDto(
                u.getId(), u.getUsername(), u.getFullName(), u.getMobile(), u.getRole(), u.isActive(), u.getVersion());
    }
}
