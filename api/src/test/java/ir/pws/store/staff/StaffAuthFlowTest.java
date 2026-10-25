package ir.pws.store.staff;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.notification.LoggingSmsSender;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

class StaffAuthFlowTest extends IntegrationTest {

    private static final String WRONG = "Wrong-password-1";

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    LoggingSmsSender sms;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    @BeforeEach
    void clearSms() {
        sms.clear();
    }

    // ---- helpers ----

    private ResultActions login(String username, String password) throws Exception {
        return mvc.perform(post("/api/admin/auth/login")
                .with(adminAuth.csrfOnly())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("username", username, "password", password))));
    }

    private String challengeFor(StaffUser user) throws Exception {
        MvcResult r = login(user.getUsername(), AdminAuth.PASSWORD).andExpect(status().isOk()).andReturn();
        return json.readTree(r.getResponse().getContentAsString()).get("challenge").asText();
    }

    private String lastCode() {
        List<LoggingSmsSender.SentSms> sent = sms.sent();
        return sent.get(sent.size() - 1).tokens().get(0);
    }

    private ResultActions verify(String challenge, String code) throws Exception {
        return mvc.perform(post("/api/admin/auth/verify")
                .with(adminAuth.csrfOnly())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("challenge", challenge, "code", code))));
    }

    private MvcResult fullLogin(StaffUser user) throws Exception {
        String challenge = challengeFor(user);
        return verify(challenge, lastCode()).andExpect(status().isOk()).andReturn();
    }

    private ResultActions refresh(String refreshToken) throws Exception {
        return mvc.perform(post("/api/admin/auth/refresh")
                .cookie(new Cookie(AuthCookies.STAFF_REFRESH, refreshToken))
                .with(adminAuth.csrfOnly()));
    }

    private static String cookieValue(MvcResult r, String name) {
        Cookie c = r.getResponse().getCookie(name);
        assertThat(c).as("cookie " + name).isNotNull();
        return c.getValue();
    }

    private static String sha256Hex(String s) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
    }

    private JsonNode body(ResultActions a) throws Exception {
        return json.readTree(a.andReturn().getResponse().getContentAsString());
    }

    // ---- tests ----

    @Test
    void fullLogin_setsCookies_andMeWorks() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        MvcResult loggedIn = login(u.getUsername(), AdminAuth.PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mobileMasked").value(containsString("***")))
                .andExpect(jsonPath("$.challenge").isNotEmpty())
                .andReturn();
        String challenge = json.readTree(loggedIn.getResponse().getContentAsString()).get("challenge").asText();
        String code = lastCode();
        MvcResult verified = verify(challenge, code)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(u.getUsername()))
                .andExpect(jsonPath("$.role").value("OWNER"))
                .andExpect(header().stringValues("Set-Cookie", org.hamcrest.Matchers.hasItems(
                        containsString("pws_admin_at="), containsString("pws_admin_rt="))))
                .andReturn();
        List<String> setCookies = verified.getResponse().getHeaders("Set-Cookie");
        String at = setCookies.stream().filter(c -> c.startsWith("pws_admin_at=")).findFirst().orElseThrow();
        String rt = setCookies.stream().filter(c -> c.startsWith("pws_admin_rt=")).findFirst().orElseThrow();
        assertThat(at).contains("HttpOnly").contains("Path=/api/admin").contains("SameSite=Lax");
        assertThat(rt).contains("HttpOnly").contains("Path=/api/admin/auth").contains("SameSite=Lax");
        mvc.perform(get("/api/admin/auth/me")
                        .cookie(new Cookie(AuthCookies.STAFF_ACCESS, cookieValue(verified, AuthCookies.STAFF_ACCESS))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(u.getId()));
    }

    @Test
    void wrongPassword_isGenericUnauthenticated() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        ObjectNode wrongPassword = (ObjectNode) body(login(u.getUsername(), WRONG)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED")));
        ObjectNode unknownUser = (ObjectNode) body(login("nobody-here", WRONG)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED")));
        wrongPassword.remove("requestId");
        unknownUser.remove("requestId");
        assertThat(wrongPassword).isEqualTo(unknownUser);
        assertThat(sms.sent()).isEmpty();
    }

    @Test
    void inactiveStaff_cannotLogin() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        jdbc.update("UPDATE staff_user SET active = false WHERE id = ?", u.getId());
        login(u.getUsername(), AdminAuth.PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        assertThat(sms.sent()).isEmpty();
    }

    @Test
    void fiveFailuresIn15Min_locksFor15Min() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        for (int i = 0; i < 5; i++) {
            login(u.getUsername(), WRONG).andExpect(status().isUnauthorized());
            clock.advance(Duration.ofSeconds(10));
        }
        login(u.getUsername(), AdminAuth.PASSWORD)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
        assertThat(sms.sent()).isEmpty();
        clock.advance(Duration.ofMinutes(15).plusSeconds(1));
        login(u.getUsername(), AdminAuth.PASSWORD).andExpect(status().isOk());
    }

    @Test
    void failuresOutsideWindow_doNotAccumulate() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        for (int i = 0; i < 4; i++) {
            login(u.getUsername(), WRONG).andExpect(status().isUnauthorized());
        }
        clock.advance(Duration.ofMinutes(16));
        for (int i = 0; i < 4; i++) {
            login(u.getUsername(), WRONG).andExpect(status().isUnauthorized());
        }
        login(u.getUsername(), AdminAuth.PASSWORD).andExpect(status().isOk());
    }

    @Test
    void expiredChallenge_isRejected() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String challenge = challengeFor(u);
        String code = lastCode();
        clock.advance(Duration.ofMinutes(6));
        verify(challenge, code).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidChallenge_isRejected() throws Exception {
        verify("not-a-jwt", "12345").andExpect(status().isUnauthorized());
    }

    @Test
    void wrongCode_isOtpInvalid() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String challenge = challengeFor(u);
        String wrong = lastCode().equals("00000") ? "11111" : "00000";
        verify(challenge, wrong)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_INVALID"));
    }

    @Test
    void refresh_rotatesToken() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String rtA = cookieValue(fullLogin(u), AuthCookies.STAFF_REFRESH);
        MvcResult rotated = refresh(rtA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(u.getUsername()))
                .andReturn();
        String rtB = cookieValue(rotated, AuthCookies.STAFF_REFRESH);
        assertThat(rtB).isNotEqualTo(rtA);
        assertThat(rotated.getResponse().getCookie(AuthCookies.STAFF_ACCESS)).isNotNull();
        refresh(rtA).andExpect(status().isUnauthorized());
    }

    @Test
    void reusedRefreshToken_revokesAllSessions() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String rtA = cookieValue(fullLogin(u), AuthCookies.STAFF_REFRESH);
        String rtB = cookieValue(refresh(rtA).andExpect(status().isOk()).andReturn(), AuthCookies.STAFF_REFRESH);
        refresh(rtA).andExpect(status().isUnauthorized());
        refresh(rtB).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_failsForDeactivatedStaff() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String rt = cookieValue(fullLogin(u), AuthCookies.STAFF_REFRESH);
        jdbc.update("UPDATE staff_user SET active = false WHERE id = ?", u.getId());
        refresh(rt).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_withoutCookieOrExpired_is401() throws Exception {
        mvc.perform(post("/api/admin/auth/refresh").with(adminAuth.csrfOnly())).andExpect(status().isUnauthorized());
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String rt = cookieValue(fullLogin(u), AuthCookies.STAFF_REFRESH);
        clock.advance(Duration.ofHours(12).plusSeconds(1));
        refresh(rt).andExpect(status().isUnauthorized());
    }

    @Test
    void logout_revokesRefreshToken_andClearsCookies() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        MvcResult login = fullLogin(u);
        String rt = cookieValue(login, AuthCookies.STAFF_REFRESH);
        // adminAuth.staff() must merge with, not overwrite, the refresh cookie already on the request
        MvcResult out = mvc.perform(post("/api/admin/auth/logout")
                        .cookie(new Cookie(AuthCookies.STAFF_REFRESH, rt))
                        .with(adminAuth.staff(u)))
                .andExpect(status().isNoContent())
                .andReturn();
        List<String> setCookies = out.getResponse().getHeaders("Set-Cookie");
        assertThat(setCookies).anyMatch(c -> c.startsWith("pws_admin_at=") && c.contains("Max-Age=0"));
        assertThat(setCookies).anyMatch(c -> c.startsWith("pws_admin_rt=") && c.contains("Max-Age=0"));
        refresh(rt).andExpect(status().isUnauthorized());
    }

    @Test
    void logout_worksWithoutAccessCookie() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String rt = cookieValue(fullLogin(u), AuthCookies.STAFF_REFRESH);
        mvc.perform(post("/api/admin/auth/logout")
                        .cookie(new Cookie(AuthCookies.STAFF_REFRESH, rt))
                        .with(adminAuth.csrfOnly()))
                .andExpect(status().isNoContent());
        refresh(rt).andExpect(status().isUnauthorized());
    }

    @Test
    void refreshTokenStoredHashed() throws Exception {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        String rt = cookieValue(fullLogin(u), AuthCookies.STAFF_REFRESH);
        List<String> hashes = jdbc.queryForList("SELECT token_hash FROM refresh_token", String.class);
        assertThat(hashes).hasSize(1).doesNotContain(rt).containsExactly(sha256Hex(rt));
    }

    @Test
    void adminAuthStaff_mergesWithExistingRequestCookies() {
        StaffUser u = adminAuth.createStaff(StaffRole.OWNER);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("pws_admin_rt", "keep-me"));
        adminAuth.staff(u).postProcessRequest(request);
        assertThat(request.getCookies())
                .extracting(Cookie::getName)
                .containsExactlyInAnyOrder("pws_admin_rt", AuthCookies.STAFF_ACCESS, "XSRF-TOKEN");
    }
}
