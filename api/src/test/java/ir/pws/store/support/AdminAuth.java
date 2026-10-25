package ir.pws.store.support;

import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.staff.StaffUserRepository;
import jakarta.servlet.http.Cookie;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Test helper bean (available in every {@link IntegrationTest}; {@code @Autowired AdminAuth adminAuth}).
 *
 * <pre>
 * StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
 * mvc.perform(post("/api/admin/...").with(adminAuth.staff(owner)).contentType(JSON).content(...));
 * </pre>
 *
 * {@link #staff(StaffUser)} adds a valid {@code pws_admin_at} cookie (signed with the injected test clock) and a
 * valid CSRF token, so it works for GET and mutating requests alike. {@link #createStaff(StaffRole)} persists an
 * active staff user with a unique username ({@code staff<n>}), unique mobile and password {@code Password123!}.
 * Tests that need to exercise a missing CSRF token must build the cookie themselves.
 */
public class AdminAuth {

    public static final String PASSWORD = "Password123!";

    private static final AtomicInteger SEQ = new AtomicInteger();

    private final StaffUserRepository staff;
    private final JwtService jwt;
    private final String passwordHash;

    public AdminAuth(StaffUserRepository staff, PasswordEncoder encoder, JwtService jwt) {
        this.staff = staff;
        this.jwt = jwt;
        this.passwordHash = encoder.encode(PASSWORD); // bcrypt(12) is slow; hash once
    }

    public StaffUser createStaff(StaffRole role) {
        int n = SEQ.incrementAndGet();
        return staff.save(new StaffUser(
                "staff" + n, passwordHash, String.format("09120%06d", n), "Staff " + n, role));
    }

    public RequestPostProcessor staff(StaffUser user) {
        Cookie access = new Cookie(AuthCookies.STAFF_ACCESS, jwt.staffAccessToken(user));
        return withCookies(access);
    }

    /**
     * CSRF double-submit only (no login): a random {@code XSRF-TOKEN} cookie plus a matching
     * {@code X-XSRF-TOKEN} header. For unauthenticated POSTs (login/verify/refresh). Never use spring-security-test
     * {@code csrf()}: it swaps the shared CsrfFilter token repository and breaks other tests.
     */
    public RequestPostProcessor csrfOnly() {
        return withCookies();
    }

    /** Adds the given cookies plus a CSRF pair, keeping any cookies already on the request. */
    private RequestPostProcessor withCookies(Cookie... extra) {
        String xsrf = UUID.randomUUID().toString();
        return request -> {
            List<Cookie> all = new ArrayList<>();
            if (request.getCookies() != null) {
                all.addAll(List.of(request.getCookies()));
            }
            all.addAll(List.of(extra));
            all.add(new Cookie("XSRF-TOKEN", xsrf));
            request.setCookies(all.toArray(new Cookie[0]));
            request.addHeader("X-XSRF-TOKEN", xsrf);
            return request;
        };
    }
}
