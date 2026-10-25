package ir.pws.store.staff;

import ir.pws.store.audit.AuditService;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.MobileNumbers;
import ir.pws.store.staff.dto.CreateStaffRequest;
import ir.pws.store.staff.dto.PasswordRequest;
import ir.pws.store.staff.dto.StaffDto;
import ir.pws.store.staff.dto.UpdateStaffRequest;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StaffAdminService {

    static final int MIN_PASSWORD_LENGTH = 10;
    private static final String ENTITY = "STAFF_USER";

    private final StaffUserRepository staff;
    private final StaffAuthService auth;
    private final AuditService audit;
    private final PasswordEncoder encoder;

    public StaffAdminService(
            StaffUserRepository staff, StaffAuthService auth, AuditService audit, PasswordEncoder encoder) {
        this.staff = staff;
        this.auth = auth;
        this.audit = audit;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<StaffDto> list() {
        return staff.findAll(Sort.by("id")).stream().map(StaffDto::from).toList();
    }

    @Transactional
    public StaffDto create(CreateStaffRequest req) {
        String username = req.username().trim().toLowerCase(Locale.ROOT);
        if (username.isEmpty()) {
            throw ApiException.field("username", "REQUIRED");
        }
        requirePasswordLength(req.password());
        String mobile = MobileNumbers.normalize(req.mobile());
        if (staff.existsByUsernameIgnoreCase(username)) {
            throw ApiException.field("username", "DUPLICATE");
        }
        if (staff.existsByMobile(mobile)) {
            throw ApiException.field("mobile", "DUPLICATE");
        }
        StaffUser saved = staff.saveAndFlush(new StaffUser(
                username, encoder.encode(req.password()), mobile, req.fullName().trim(), req.role()));
        StaffDto dto = StaffDto.from(saved);
        audit.record("STAFF_CREATE", ENTITY, saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public StaffDto update(long id, UpdateStaffRequest req) {
        // Lock the active owners before loading/counting so two concurrent demotions cannot both pass.
        List<StaffUser> activeOwners = staff.lockActiveOwners();
        StaffUser user = staff.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (req.version() != user.getVersion()) {
            throw new ApiException(ErrorCode.CONFLICT);
        }
        String mobile = MobileNumbers.normalize(req.mobile());
        if (staff.existsByMobileAndIdNot(mobile, id)) {
            throw ApiException.field("mobile", "DUPLICATE");
        }
        boolean wasActiveOwner = user.getRole() == StaffRole.OWNER && user.isActive();
        boolean staysActiveOwner = req.role() == StaffRole.OWNER && req.active();
        if (wasActiveOwner && !staysActiveOwner && activeOwners.size() <= 1) {
            throw ApiException.field(req.role() != StaffRole.OWNER ? "role" : "active", "LAST_OWNER");
        }
        StaffDto before = StaffDto.from(user);
        boolean deactivated = user.isActive() && !req.active();
        user.updateProfile(req.fullName().trim(), mobile, req.role(), req.active());
        staff.saveAndFlush(user);
        if (deactivated) {
            auth.revokeAllFor(id);
        }
        StaffDto after = StaffDto.from(user);
        audit.record("STAFF_UPDATE", ENTITY, id, before, after);
        return after;
    }

    @Transactional
    public void resetPassword(long id, PasswordRequest req) {
        requirePasswordLength(req.password());
        StaffUser user = staff.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        user.changePasswordHash(encoder.encode(req.password()));
        staff.saveAndFlush(user);
        auth.revokeAllFor(id);
        audit.record("STAFF_PASSWORD_RESET", ENTITY, id, null, null);
    }

    private static void requirePasswordLength(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw ApiException.field("password", "PASSWORD_TOO_SHORT");
        }
    }
}
