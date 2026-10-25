package ir.pws.store.common.security;

import static org.hamcrest.Matchers.containsStringIgnoringCase;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class StaffSecurityTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JwtService jwt;

    private Cookie accessCookie(String token) {
        return new Cookie(AuthCookies.STAFF_ACCESS, token);
    }

    @Test
    void me_withoutCookie_is401Problem() throws Exception {
        mvc.perform(get("/api/admin/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void me_withValidCookie_returnsStaff() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(get("/api/admin/auth/me").with(adminAuth.staff(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(owner.getId()))
                .andExpect(jsonPath("$.username").value(owner.getUsername()))
                .andExpect(jsonPath("$.fullName").value(owner.getFullName()))
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    void tokenSignedWithOtherKey_isRejected() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        String forged = Jwts.builder()
                .subject(String.valueOf(owner.getId()))
                .audience()
                .add(JwtService.STAFF_AUDIENCE)
                .and()
                .claim("username", owner.getUsername())
                .claim("role", "OWNER")
                .expiration(Date.from(clock.instant().plus(Duration.ofMinutes(10))))
                .signWith(Keys.hmacShaKeyFor(
                        "some-other-secret-key-0123456789abcdefghij".getBytes(StandardCharsets.UTF_8)))
                .compact();
        mvc.perform(get("/api/admin/auth/me").cookie(accessCookie(forged))).andExpect(status().isUnauthorized());
    }

    @Test
    void expiredAccessToken_isRejected() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        String token = jwt.staffAccessToken(owner);
        mvc.perform(get("/api/admin/auth/me").cookie(accessCookie(token))).andExpect(status().isOk());
        clock.advance(Duration.ofMinutes(16));
        mvc.perform(get("/api/admin/auth/me").cookie(accessCookie(token))).andExpect(status().isUnauthorized());
    }

    @Test
    void challengeToken_isNotAcceptedAsAccessToken() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(get("/api/admin/auth/me").cookie(accessCookie(jwt.staffChallenge(owner.getId()))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postWithoutCsrf_is403Forbidden() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(post("/api/admin/auth/logout").cookie(accessCookie(jwt.staffAccessToken(owner))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void csrfEndpoint_setsReadableXsrfCookie() throws Exception {
        mvc.perform(get("/api/admin/auth/csrf"))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andExpect(header().string("Set-Cookie", not(containsStringIgnoringCase("HttpOnly"))));
    }

    @Test
    void unknownApiPath_isDenied() throws Exception {
        mvc.perform(get("/api/store/anything"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void preAuthorizeDenial_isForbiddenProblem() throws Exception {
        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/test-probe/owner-only").with(adminAuth.staff(operator)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(get("/api/admin/test-probe/owner-only").with(adminAuth.staff(owner)))
                .andExpect(status().isOk());
    }

    @Test
    void postWithCsrf_isAllowed() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(post("/api/admin/test-probe/echo").with(adminAuth.staff(owner))).andExpect(status().isOk());
    }
}
