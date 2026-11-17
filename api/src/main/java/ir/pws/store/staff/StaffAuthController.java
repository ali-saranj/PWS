package ir.pws.store.staff;

import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.staff.dto.LoginChallenge;
import ir.pws.store.staff.dto.LoginRequest;
import ir.pws.store.staff.dto.LoginResponse;
import ir.pws.store.staff.dto.StaffMe;
import ir.pws.store.staff.dto.VerifyRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class StaffAuthController {

    private final StaffAuthService auth;
    private final AuthCookies cookies;

    public StaffAuthController(StaffAuthService auth, AuthCookies cookies) {
        this.auth = auth;
        this.cookies = cookies;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        StaffAuthService.LoginResult result = auth.login(request.username(), request.password());
        if (result.isDirect()) {
            StaffAuthService.Session session = result.session();
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookies.staffAccess(session.accessToken()).toString())
                    .header(HttpHeaders.SET_COOKIE, cookies.staffRefresh(session.refreshToken()).toString())
                    .body(LoginResponse.direct(StaffMe.from(session.user(), session.accessToken())));
        }
        return ResponseEntity.ok(LoginResponse.challenge(result.challenge(), result.mobileMasked()));
    }

    @PostMapping("/verify")
    public ResponseEntity<StaffMe> verify(@Valid @RequestBody VerifyRequest request) {
        return withSession(auth.verify(request.challenge(), request.code()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<StaffMe> refresh(
            @CookieValue(name = AuthCookies.STAFF_REFRESH, required = false) String refreshToken) {
        return withSession(auth.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = AuthCookies.STAFF_REFRESH, required = false) String refreshToken) {
        auth.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.clearStaffAccess().toString())
                .header(HttpHeaders.SET_COOKIE, cookies.clearStaffRefresh().toString())
                .build();
    }

    private ResponseEntity<StaffMe> withSession(StaffAuthService.Session session) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.staffAccess(session.accessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, cookies.staffRefresh(session.refreshToken()).toString())
                .body(StaffMe.from(session.user(), session.accessToken()));
    }
}
