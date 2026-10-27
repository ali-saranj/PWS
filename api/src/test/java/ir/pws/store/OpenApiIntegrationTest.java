package ir.pws.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.notification.LoggingSmsSender;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Duration;
import java.util.Map;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OpenApiIntegrationTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JwtService jwt;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    LoggingSmsSender sms;

    @Autowired
    ObjectMapper json;

    @BeforeEach
    void clearSms() {
        sms.clear();
    }

    @Test
    void openApiDocs_isAccessiblePublicly() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").value(Matchers.startsWith("3.")))
                .andExpect(jsonPath("$.info.title").value("Protein Web Store (PWS) API"))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth").exists());
    }

    @Test
    void swaggerUi_isAccessiblePublicly() throws Exception {
        mvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }

    @Test
    void bearerRequests_areExemptFromCsrf() throws Exception {
        // Without Bearer or CSRF, POST /api/admin/auth/logout is rejected with 403 Forbidden by CSRF filter
        mvc.perform(post("/api/admin/auth/logout"))
                .andExpect(status().isForbidden());

        // With Bearer token, CSRF is ignored and request reaches endpoint
        mvc.perform(post("/api/admin/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer dummy-token"))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminEndpoint_withBearerToken_authenticatesSuccessfully() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        String token = jwt.staffAccessToken(owner);

        mvc.perform(get("/api/admin/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(owner.getId()))
                .andExpect(jsonPath("$.username").value(owner.getUsername()))
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    void adminEndpoint_withBearerToken_bypassesCsrf() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        String token = jwt.staffAccessToken(owner);
        String body = "{\"nameFa\":\"دسته تست\",\"slug\":\"test-bearer-cat\",\"active\":true}";

        // With cookie auth but no CSRF token, mutating request fails with 403 Forbidden
        mvc.perform(post("/api/admin/categories")
                        .cookie(new Cookie(AuthCookies.STAFF_ACCESS, token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        // With Bearer token, CSRF is bypassed and mutating request succeeds
        mvc.perform(post("/api/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("test-bearer-cat"));
    }

    @Test
    void shopEndpoint_withBearerToken_authenticatesSuccessfully() throws Exception {
        Customer customer = customerRepository.save(new Customer("09129990011"));
        String token = jwt.customerAccessToken(customer);

        mvc.perform(get("/api/shop/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer.getId()))
                .andExpect(jsonPath("$.mobile").value(customer.getMobile()));
    }

    @Test
    void staffVerifyAndRefresh_returnsAccessTokenInResponseBody() throws Exception {
        StaffUser staff = adminAuth.createStaff(StaffRole.OWNER);
        MvcResult loginRes = mvc.perform(post("/api/admin/auth/login")
                        .with(adminAuth.csrfOnly())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", staff.getUsername(), "password", AdminAuth.PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        String challenge = json.readTree(loginRes.getResponse().getContentAsString()).get("challenge").asText();
        String code = sms.sent().get(sms.sent().size() - 1).tokens().get(0);

        // Verify endpoint returns token in body and sets cookies
        MvcResult verifyRes = mvc.perform(post("/api/admin/auth/verify")
                        .with(adminAuth.csrfOnly())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("challenge", challenge, "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String token = json.readTree(verifyRes.getResponse().getContentAsString()).get("token").asText();
        Cookie accessCookie = verifyRes.getResponse().getCookie(AuthCookies.STAFF_ACCESS);
        assertThat(accessCookie).isNotNull();
        assertThat(token).isEqualTo(accessCookie.getValue());

        // Refresh endpoint returns rotated token in body and sets cookies
        Cookie refreshCookie = verifyRes.getResponse().getCookie(AuthCookies.STAFF_REFRESH);
        assertThat(refreshCookie).isNotNull();

        clock.advance(Duration.ofSeconds(1));

        MvcResult refreshRes = mvc.perform(post("/api/admin/auth/refresh")
                        .cookie(refreshCookie)
                        .with(adminAuth.csrfOnly()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String refreshToken = json.readTree(refreshRes.getResponse().getContentAsString()).get("token").asText();
        Cookie refreshedAccessCookie = refreshRes.getResponse().getCookie(AuthCookies.STAFF_ACCESS);
        assertThat(refreshedAccessCookie).isNotNull();
        assertThat(refreshToken).isEqualTo(refreshedAccessCookie.getValue());
        assertThat(refreshToken).isNotEqualTo(token);

        // Verify that /api/admin/auth/me does not expose token (defaults to null)
        mvc.perform(get("/api/admin/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(staff.getUsername()))
                .andExpect(jsonPath("$.token").value(Matchers.nullValue()));
    }

    @Test
    void customerVerifyAndRefresh_returnsAccessTokenInResponseBody() throws Exception {
        mvc.perform(post("/api/shop/auth/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09121234567"))))
                .andExpect(status().isOk());

        String code = sms.sent().get(sms.sent().size() - 1).tokens().get(0);

        // Verify endpoint returns token in body and sets cookies
        MvcResult verifyRes = mvc.perform(post("/api/shop/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("mobile", "09121234567", "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String token = json.readTree(verifyRes.getResponse().getContentAsString()).get("token").asText();
        Cookie accessCookie = verifyRes.getResponse().getCookie(AuthCookies.CUSTOMER_ACCESS);
        assertThat(accessCookie).isNotNull();
        assertThat(token).isEqualTo(accessCookie.getValue());

        // Refresh endpoint returns rotated token in body and sets cookies
        Cookie refreshCookie = verifyRes.getResponse().getCookie(AuthCookies.CUSTOMER_REFRESH);
        assertThat(refreshCookie).isNotNull();

        clock.advance(Duration.ofSeconds(1));

        MvcResult refreshRes = mvc.perform(post("/api/shop/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String refreshToken = json.readTree(refreshRes.getResponse().getContentAsString()).get("token").asText();
        Cookie refreshedAccessCookie = refreshRes.getResponse().getCookie(AuthCookies.CUSTOMER_ACCESS);
        assertThat(refreshedAccessCookie).isNotNull();
        assertThat(refreshToken).isEqualTo(refreshedAccessCookie.getValue());
        assertThat(refreshToken).isNotEqualTo(token);

        // Verify that /api/shop/auth/me does not expose token (defaults to null)
        mvc.perform(get("/api/shop/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mobile").value("09121234567"))
                .andExpect(jsonPath("$.token").value(Matchers.nullValue()));
    }
}
