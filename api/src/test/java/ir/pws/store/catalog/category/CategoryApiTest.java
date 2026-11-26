package ir.pws.store.catalog.category;

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

class CategoryApiTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    private Map<String, Object> body(Long parentId, String slug, int sortOrder) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("parentId", parentId);
        body.put("nameFa", "پروتئین");
        body.put("nameEn", "Protein");
        body.put("slug", slug);
        body.put("sortOrder", sortOrder);
        body.put("active", true);
        return body;
    }

    private ResultActions create(StaffUser u, Map<String, Object> body) throws Exception {
        return mvc.perform(post("/api/admin/categories")
                .with(adminAuth.staff(u))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private ResultActions update(StaffUser u, long id, Map<String, Object> body) throws Exception {
        return mvc.perform(put("/api/admin/categories/" + id)
                .with(adminAuth.staff(u))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private long createId(StaffUser u, Long parentId, String slug, int sortOrder) throws Exception {
        String res = create(u, body(parentId, slug, sortOrder))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return json.readTree(res).get("id").asLong();
    }

    @Test
    void createAndList() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long parent = createId(pm, null, "supplements", 2);
        create(pm, body(parent, "whey", 1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.parentId").value(parent))
                .andExpect(jsonPath("$.nameFa").value("پروتئین"))
                .andExpect(jsonPath("$.slug").value("whey"));
        mvc.perform(get("/api/admin/categories").with(adminAuth.staff(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].slug").value("whey"))
                .andExpect(jsonPath("$[1].slug").value("supplements"))
                .andExpect(jsonPath("$[1].parentId").doesNotExist());
    }

    @Test
    void invalidSlug_isFieldSlugInvalid() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        create(pm, body(null, "Bad Slug", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("slug"))
                .andExpect(jsonPath("$.errors[0].code").value("SLUG_INVALID"));
    }

    @Test
    void duplicateSlug_isFieldDuplicate() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        createId(pm, null, "whey", 0);
        create(pm, body(null, "whey", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("slug"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
        long other = createId(pm, null, "creatine", 0);
        update(pm, other, body(null, "whey", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
        update(pm, other, body(null, "creatine", 5)).andExpect(status().isOk());
    }

    @Test
    void parentMustExist() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        create(pm, body(999999L, "whey", 0)).andExpect(status().isNotFound());
        long id = createId(pm, null, "creatine", 0);
        update(pm, id, body(999999L, "creatine", 0)).andExpect(status().isNotFound());
        update(pm, 999999L, body(null, "x", 0)).andExpect(status().isNotFound());
    }

    @Test
    void cannotSetParentToSelfOrDescendant() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long a = createId(pm, null, "a", 0);
        long b = createId(pm, a, "b", 0);
        long c = createId(pm, b, "c", 0);
        update(pm, a, body(a, "a", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("parentId"))
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_CYCLE"));
        update(pm, a, body(c, "a", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("CATEGORY_CYCLE"));
        // moving a leaf under the root is fine
        update(pm, c, body(a, "c", 0)).andExpect(status().isOk());
    }

    @Test
    void deleteCategoryWithChildren_isResourceInUse() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long parent = createId(pm, null, "supplements", 0);
        createId(pm, parent, "whey", 0);
        mvc.perform(delete("/api/admin/categories/" + parent).with(adminAuth.staff(pm)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RESOURCE_IN_USE"));
    }

    @Test
    void deleteLeaf_works() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long id = createId(pm, null, "whey", 0);
        mvc.perform(delete("/api/admin/categories/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("select count(*) from category", Integer.class))
                .isZero();
        mvc.perform(delete("/api/admin/categories/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isNotFound());
    }

    @Test
    void mutations_areAudited() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long id = createId(pm, null, "whey", 0);
        update(pm, id, body(null, "whey", 3)).andExpect(status().isOk());
        mvc.perform(delete("/api/admin/categories/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isNoContent());
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select staff_user_id, action, entity_type, entity_id from audit_log order by id");
        assertThat(rows).extracting(r -> r.get("action")).containsExactly(
                "CATEGORY_CREATE", "CATEGORY_UPDATE", "CATEGORY_DELETE");
        assertThat(rows).allSatisfy(r -> assertThat(r)
                .containsEntry("entity_type", "CATEGORY")
                .containsEntry("entity_id", id)
                .containsEntry("staff_user_id", pm.getId()));
    }

    @Test
    void orderOperator_isForbidden() throws Exception {
        StaffUser op = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/categories").with(adminAuth.staff(op))).andExpect(status().isForbidden());
        create(op, body(null, "whey", 0)).andExpect(status().isForbidden());
    }

    @Test
    void missingNameFa_isRequired() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        Map<String, Object> body = body(null, "whey", 0);
        body.remove("nameFa");
        create(pm, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("nameFa"));
    }

    @Test
    void seoFields_persistedAndBlankNormalizedToNull() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        Map<String, Object> req = body(null, "sausages", 1);
        req.put("seoTitle", "  خرید سوسیس و کالباس  ");
        req.put("seoDescription", "  توضیحات سئو دسته  ");
        req.put("seoH1", "  سوسیس و کالباس تازه  ");
        req.put("seoContentFa", "  متن معرفی دسته‌بندی  ");

        String res = create(pm, req)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.seoTitle").value("خرید سوسیس و کالباس"))
                .andExpect(jsonPath("$.seoDescription").value("توضیحات سئو دسته"))
                .andExpect(jsonPath("$.seoH1").value("سوسیس و کالباس تازه"))
                .andExpect(jsonPath("$.seoContentFa").value("متن معرفی دسته‌بندی"))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(res).get("id").asLong();

        Map<String, Object> cleared = body(null, "sausages", 1);
        cleared.put("seoTitle", "   ");
        cleared.put("seoDescription", "");
        cleared.put("seoH1", "   ");
        cleared.put("seoContentFa", "");

        update(pm, id, cleared)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.seoTitle").doesNotExist())
                .andExpect(jsonPath("$.seoDescription").doesNotExist())
                .andExpect(jsonPath("$.seoH1").doesNotExist())
                .andExpect(jsonPath("$.seoContentFa").doesNotExist());
    }
}
