package ir.pws.store.common.security;

import ir.pws.store.staff.StaffRole;

/** Authentication principal for staff; its authority is {@code ROLE_<role>}. */
public record StaffPrincipal(long id, String username, StaffRole role) {}
