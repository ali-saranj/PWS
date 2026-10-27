package ir.pws.store;

import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

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
}
