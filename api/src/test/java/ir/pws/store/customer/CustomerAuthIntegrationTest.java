package ir.pws.store.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.notification.LoggingSmsSender;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;

class CustomerAuthIntegrationTest extends IntegrationTest {

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

    private String lastCode() {
        List<LoggingSmsSender.SentSms> sent = sms.sent();
        assertThat(sent).isNotEmpty();
        return sent.get(sent.size() - 1).tokens().get(0);
    }

    private Cookie cookie(MvcResult r, String name) {
        Cookie c = r.getResponse().getCookie(name);
        assertThat(c).as("cookie " + name).isNotNull();
        return c;
    }

    @Test
    void requestOtp_andVerify_succeeds_andSetsCookies() throws Exception {
        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09121234567"))))
                .andExpect(status().isOk());

        String code = lastCode();

        MvcResult verifyResult = mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09121234567", "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.mobile").value("09121234567"))
                .andReturn();

        Cookie accessCookie = cookie(verifyResult, AuthCookies.CUSTOMER_ACCESS);
        Cookie refreshCookie = cookie(verifyResult, AuthCookies.CUSTOMER_REFRESH);
        assertThat(accessCookie.getPath()).isEqualTo("/api/shop");
        assertThat(accessCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getPath()).isEqualTo("/api/shop/auth");
        assertThat(refreshCookie.isHttpOnly()).isTrue();

        mvc.perform(get("/api/shop/auth/me").cookie(accessCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mobile").value("09121234567"));
    }

    @Test
    void blockedCustomer_returns403_accountBlocked() throws Exception {
        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09129998877"))))
                .andExpect(status().isOk());

        String code = lastCode();

        MvcResult verifyResult = mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09129998877", "code", code))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie accessCookie = cookie(verifyResult, AuthCookies.CUSTOMER_ACCESS);

        jdbc.update("UPDATE customer SET blocked = true WHERE mobile = ?", "09129998877");

        mvc.perform(get("/api/shop/auth/me").cookie(accessCookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_BLOCKED"));

        // Also OTP login attempt while blocked must be rejected
        sms.clear();
        clock.advance(java.time.Duration.ofMinutes(3)); // advance clock past OTP rate limit

        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09129998877"))))
                .andExpect(status().isOk());

        String newCode = lastCode();

        mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09129998877", "code", newCode))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_BLOCKED"));
    }

    @Test
    void addressCreation_andDefaultSwitching() throws Exception {
        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09121112233"))))
                .andExpect(status().isOk());

        MvcResult verifyResult = mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09121112233", "code", lastCode()))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie accessCookie = cookie(verifyResult, AuthCookies.CUSTOMER_ACCESS);

        // Create Address 1 as default
        mvc.perform(post("/api/shop/customer/addresses")
                        .cookie(accessCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "province", "Tehran",
                                "city", "Tehran",
                                "line", "Valiasr St, No 10",
                                "postalCode", "1234567890",
                                "recipientName", "Ali Reza",
                                "recipientMobile", "09121112233",
                                "isDefault", true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault").value(true))
                .andExpect(jsonPath("$.province").value("Tehran"));

        // Create Address 2 as default (should unset Address 1 as default)
        mvc.perform(post("/api/shop/customer/addresses")
                        .cookie(accessCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "province", "Isfahan",
                                "city", "Isfahan",
                                "line", "Chaharbagh Abbasi St",
                                "postalCode", "9876543210",
                                "recipientName", "Ali Reza",
                                "recipientMobile", "09121112233",
                                "isDefault", true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault").value(true))
                .andExpect(jsonPath("$.province").value("Isfahan"));

        // List addresses: Address 2 should be first (isDefault=true), Address 1 should be second (isDefault=false)
        mvc.perform(get("/api/shop/customer/addresses").cookie(accessCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].province").value("Isfahan"))
                .andExpect(jsonPath("$[0].isDefault").value(true))
                .andExpect(jsonPath("$[1].province").value("Tehran"))
                .andExpect(jsonPath("$[1].isDefault").value(false));
    }

    @Test
    void logout_clearsCookies() throws Exception {
        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09123334455"))))
                .andExpect(status().isOk());

        MvcResult verifyResult = mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09123334455", "code", lastCode()))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = cookie(verifyResult, AuthCookies.CUSTOMER_REFRESH);

        MvcResult logoutResult = mvc.perform(post("/api/shop/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isNoContent())
                .andReturn();

        Cookie clearedAccess = logoutResult.getResponse().getCookie(AuthCookies.CUSTOMER_ACCESS);
        Cookie clearedRefresh = logoutResult.getResponse().getCookie(AuthCookies.CUSTOMER_REFRESH);
        assertThat(clearedAccess).isNotNull();
        assertThat(clearedAccess.getMaxAge()).isZero();
        assertThat(clearedRefresh).isNotNull();
        assertThat(clearedRefresh.getMaxAge()).isZero();

        // Refresh with logged-out refresh token must fail
        mvc.perform(post("/api/shop/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedAccess_returns401() throws Exception {
        mvc.perform(get("/api/shop/auth/me"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/shop/customer/addresses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshToken_rotatesSession() throws Exception {
        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09124445566"))))
                .andExpect(status().isOk());

        MvcResult verifyResult = mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09124445566", "code", lastCode()))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie1 = cookie(verifyResult, AuthCookies.CUSTOMER_REFRESH);

        MvcResult refreshResult = mvc.perform(post("/api/shop/auth/refresh")
                        .cookie(refreshCookie1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mobile").value("09124445566"))
                .andReturn();

        Cookie accessCookie2 = cookie(refreshResult, AuthCookies.CUSTOMER_ACCESS);
        Cookie refreshCookie2 = cookie(refreshResult, AuthCookies.CUSTOMER_REFRESH);
        assertThat(refreshCookie2.getValue()).isNotEqualTo(refreshCookie1.getValue());

        mvc.perform(get("/api/shop/auth/me").cookie(accessCookie2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mobile").value("09124445566"));

        // Reusing refreshCookie1 must fail and trigger reuse detection (revoking all sessions)
        mvc.perform(post("/api/shop/auth/refresh").cookie(refreshCookie1))
                .andExpect(status().isUnauthorized());

        // Now refreshCookie2 was also revoked by reuse detection
        mvc.perform(post("/api/shop/auth/refresh").cookie(refreshCookie2))
                .andExpect(status().isUnauthorized());
    }
}
