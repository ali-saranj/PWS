package ir.pws.store.catalog.brand;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;

class BrandApiTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    private Map<String, Object> body(String slug) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("nameFa", "اپتیموم نوتریشن");
        body.put("nameEn", "Optimum Nutrition");
        body.put("slug", slug);
        body.put("active", true);
        return body;
    }

    private ResultActions send(StaffUser u, org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder b, Map<String, Object> body)
            throws Exception {
        return mvc.perform(b.with(adminAuth.staff(u))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    @Test
    void brandCrud() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        String res = send(pm, post("/api/admin/brands"), body("on"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("on"))
                .andExpect(jsonPath("$.logoUrl").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long id = json.readTree(res).get("id").asLong();

        Map<String, Object> changed = body("optimum");
        changed.put("active", false);
        send(pm, put("/api/admin/brands/" + id), changed)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("optimum"))
                .andExpect(jsonPath("$.active").value(false));

        jdbc.update("update brand set logo_path = 'brands/1.webp' where id = ?", id);
        mvc.perform(get("/api/admin/brands").with(adminAuth.staff(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].logoUrl").value("/media/brands/1.webp"));

        send(pm, put("/api/admin/brands/999999"), body("x")).andExpect(status().isNotFound());
        send(pm, post("/api/admin/brands"), body("Bad Slug"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("SLUG_INVALID"));

        mvc.perform(delete("/api/admin/brands/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/brands/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isNotFound());

        List<Map<String, Object>> rows = jdbc.queryForList("select action, entity_type from audit_log order by id");
        assertThat(rows).extracting(r -> r.get("action")).containsExactly(
                "BRAND_CREATE", "BRAND_UPDATE", "BRAND_DELETE");
        assertThat(rows).allSatisfy(r -> assertThat(r).containsEntry("entity_type", "BRAND"));
    }

    @Test
    void duplicateBrandSlug() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        send(pm, post("/api/admin/brands"), body("on")).andExpect(status().isCreated());
        send(pm, post("/api/admin/brands"), body("on"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("slug"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
    }

    @Test
    void orderOperator_isForbidden() throws Exception {
        StaffUser op = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/brands").with(adminAuth.staff(op))).andExpect(status().isForbidden());
    }

    @Test
    void seoFields_persistedAndBlankNormalizedToNull() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        Map<String, Object> req = body("andre");
        req.put("seoTitle", "  خرید محصولات آندره  ");
        req.put("seoDescription", "  توضیحات سئو برند  ");
        req.put("seoH1", "  محصولات برند آندره  ");
        req.put("seoContentFa", "  معرفی برند آندره  ");

        String res = send(pm, post("/api/admin/brands"), req)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.seoTitle").value("خرید محصولات آندره"))
                .andExpect(jsonPath("$.seoDescription").value("توضیحات سئو برند"))
                .andExpect(jsonPath("$.seoH1").value("محصولات برند آندره"))
                .andExpect(jsonPath("$.seoContentFa").value("معرفی برند آندره"))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(res).get("id").asLong();

        Map<String, Object> cleared = body("andre");
        cleared.put("seoTitle", "  ");
        cleared.put("seoDescription", "");
        cleared.put("seoH1", " ");
        cleared.put("seoContentFa", "");

        send(pm, put("/api/admin/brands/" + id), cleared)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.seoTitle").doesNotExist())
                .andExpect(jsonPath("$.seoDescription").doesNotExist())
                .andExpect(jsonPath("$.seoH1").doesNotExist())
                .andExpect(jsonPath("$.seoContentFa").doesNotExist());
    }
}
