package ir.pws.store.common.security;

import ir.pws.store.config.AppProperties;
import java.time.Duration;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/** Builds the staff auth cookies: HttpOnly, SameSite=Lax, host-only, Secure per configuration. */
@Component
public class AuthCookies {

    public static final String STAFF_ACCESS = "pws_admin_at";
    public static final String STAFF_REFRESH = "pws_admin_rt";
    public static final String ACCESS_PATH = "/api/admin";
    public static final String REFRESH_PATH = "/api/admin/auth";
    public static final Duration REFRESH_TTL = Duration.ofHours(12);

    private final boolean secure;

    public AuthCookies(AppProperties props) {
        this.secure = props.cookies().secure();
    }

    public ResponseCookie staffAccess(String token) {
        return build(STAFF_ACCESS, token, ACCESS_PATH, JwtService.STAFF_ACCESS_TTL);
    }

    public ResponseCookie staffRefresh(String token) {
        return build(STAFF_REFRESH, token, REFRESH_PATH, REFRESH_TTL);
    }

    public ResponseCookie clearStaffAccess() {
        return build(STAFF_ACCESS, "", ACCESS_PATH, Duration.ZERO);
    }

    public ResponseCookie clearStaffRefresh() {
        return build(STAFF_REFRESH, "", REFRESH_PATH, Duration.ZERO);
    }

    private ResponseCookie build(String name, String value, String path, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path(path)
                .maxAge(maxAge)
                .build();
    }
}
