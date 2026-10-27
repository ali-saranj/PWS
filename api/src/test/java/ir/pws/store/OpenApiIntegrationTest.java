package ir.pws.store;

import ir.pws.store.support.IntegrationTest;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OpenApiIntegrationTest extends IntegrationTest {

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
}
