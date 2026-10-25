package ir.pws.store.staff;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.security.StaffPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    public record MeResponse(long id, String username, String fullName, StaffRole role) {}

    private final StaffUserRepository staff;

    public AdminAuthController(StaffUserRepository staff) {
        this.staff = staff;
    }

    /** Issues the readable XSRF-TOKEN cookie (double-submit CSRF). */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken token) {
        token.getToken(); // forces the deferred token to be generated and written as a cookie
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal StaffPrincipal principal) {
        StaffUser user = staff.findById(principal.id())
                .filter(StaffUser::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        return new MeResponse(user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }
}
