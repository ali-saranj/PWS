package ir.pws.store.catalog.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class ProductApiTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    StaffUser pm;
    long brandId;
    long categoryId;

    @BeforeEach
    void setUp() {
        pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        brandId = jdbc.queryForObject("insert into brand (name_fa, slug) values ('برند', 'b1') returning id", Long.class);
        categoryId = jdbc.queryForObject("insert into category (name_fa, slug) values ('دسته', 'c1') returning id", Long.class);
    }

    private Map<String, Object> body(String slug, String nameFa) {
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("brandId", brandId);
        b.put("categoryId", categoryId);
        b.put("slug", slug);
        b.put("nameFa", nameFa);
        b.put("nameEn", "Whey " + slug);
        b.put("descriptionFa", "<p>متن</p>");
        b.put("featured", false);
        return b;
    }

    private ResultActions send(MockHttpServletRequestBuilder b, Map<String, Object> body) throws Exception {
        return mvc.perform(b.with(adminAuth.staff(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private JsonNode create(Map<String, Object> body) throws Exception {
        String res = send(post("/api/admin/products"), body).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res);
    }

    private JsonNode getProduct(long id) throws Exception {
        return json.readTree(mvc.perform(get("/api/admin/products/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void create_isDraft_andSanitisesDescription() throws Exception {
        Map<String, Object> b = body("whey-1", "وی");
        b.put("descriptionFa", "<p>ok</p><script>alert(1)</script>");
        b.put("descriptionEn", "<h2>Title</h2><img src=x onerror=alert(1)>");
        send(post("/api/admin/products"), b)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.descriptionFa").value("<p>ok</p>"))
                .andExpect(jsonPath("$.descriptionEn").value("<h2>Title</h2>"))
                .andExpect(jsonPath("$.images.length()").value(0))
                .andExpect(jsonPath("$.variants.length()").value(0));
    }

    @Test
    void update_withStaleVersion_isConflict() throws Exception {
        long id = create(body("whey-1", "وی")).get("id").asLong();
        JsonNode a = getProduct(id);
        JsonNode bNode = getProduct(id);
        long version = a.get("version").asLong();
        assertThat(bNode.get("version").asLong()).isEqualTo(version);

        Map<String, Object> reqA = body("whey-1", "نام A");
        reqA.put("version", version);
        send(put("/api/admin/products/" + id), reqA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameFa").value("نام A"))
                .andExpect(jsonPath("$.version").value(version + 1));

        Map<String, Object> reqB = body("whey-1", "نام B");
        reqB.put("version", bNode.get("version").asLong());
        send(put("/api/admin/products/" + id), reqB)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
        assertThat(getProduct(id).get("nameFa").asText()).isEqualTo("نام A");
    }

    @Test
    void update_withoutVersion_isRequiredFieldError() throws Exception {
        long id = create(body("whey-1", "وی")).get("id").asLong();
        send(put("/api/admin/products/" + id), body("whey-1", "وی"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("version"))
                .andExpect(jsonPath("$.errors[0].code").value("REQUIRED"));
    }

    @Test
    void unknownBrandOrCategory_is404() throws Exception {
        Map<String, Object> b = body("whey-1", "وی");
        b.put("brandId", 999999);
        send(post("/api/admin/products"), b).andExpect(status().isNotFound());
        b = body("whey-1", "وی");
        b.put("categoryId", 999999);
        send(post("/api/admin/products"), b).andExpect(status().isNotFound());
    }

    @Test
    void duplicateSlug_isFieldDuplicate() throws Exception {
        create(body("whey-1", "وی"));
        send(post("/api/admin/products"), body("whey-1", "دیگر"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("slug"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
        send(post("/api/admin/products"), body("Bad Slug", "دیگر"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("SLUG_INVALID"));
    }

    @Test
    void list_filtersByStatusCategoryBrand_andSearchesNames() throws Exception {
        long other = jdbc.queryForObject("insert into brand (name_fa, slug) values ('دیگر', 'b2') returning id", Long.class);
        long cat2 = jdbc.queryForObject("insert into category (name_fa, slug) values ('دسته۲', 'c2') returning id", Long.class);
        create(body("whey-gold", "پروتئین وی طلایی"));
        Map<String, Object> second = body("creatine-x", "کراتین");
        second.put("brandId", other);
        second.put("categoryId", cat2);
        long secondId = create(second).get("id").asLong();
        jdbc.update("update product set status = 'ACTIVE' where id = ?", secondId);

        String base = "/api/admin/products";
        assertThat(count(base)).isEqualTo(2);
        assertThat(count(base + "?status=ACTIVE")).isEqualTo(1);
        assertThat(count(base + "?status=DRAFT")).isEqualTo(1);
        assertThat(count(base + "?brandId=" + other)).isEqualTo(1);
        assertThat(count(base + "?categoryId=" + categoryId)).isEqualTo(1);
        assertThat(count(base + "?q=" + "طلایی")).isEqualTo(1);
        assertThat(count(base + "?q=GOLD")).isEqualTo(1);
        assertThat(count(base + "?q=creatine")).isEqualTo(1);
        assertThat(count(base + "?q=%")).isEqualTo(0);
        mvc.perform(get(base).param("q", "کراتین").with(adminAuth.staff(pm)))
                .andExpect(jsonPath("$.items[0].slug").value("creatine-x"))
                .andExpect(jsonPath("$.items[0].variantCount").value(0))
                .andExpect(jsonPath("$.items[0].totalStock").value(0))
                .andExpect(jsonPath("$.items[0].thumbnailUrl").doesNotExist())
                .andExpect(jsonPath("$.items[0].minPrice").doesNotExist());
    }

    private int count(String url) throws Exception {
        var uri = org.springframework.web.util.UriComponentsBuilder.fromUriString(url).build().encode().toUri();
        String res = mvc.perform(get(uri).with(adminAuth.staff(pm))).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("total").asInt();
    }

    @Test
    void list_paginates_andCapsSizeAt100() throws Exception {
        for (int i = 0; i < 25; i++) {
            jdbc.update("""
                    insert into product (brand_id, category_id, slug, name_fa, updated_at)
                    values (?, ?, ?, ?, now() + (? * interval '1 second'))""",
                    brandId, categoryId, "p-" + i, "محصول " + i, i);
        }
        mvc.perform(get("/api/admin/products?page=1&size=10").with(adminAuth.staff(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.total").value(25))
                .andExpect(jsonPath("$.items[0].slug").value("p-14"));
        mvc.perform(get("/api/admin/products?size=500").with(adminAuth.staff(pm)))
                .andExpect(jsonPath("$.size").value(100))
                .andExpect(jsonPath("$.items.length()").value(25))
                .andExpect(jsonPath("$.items[0].slug").value("p-24"));
    }

    @Test
    void deleteCategoryUsedByProduct_isResourceInUse() throws Exception {
        create(body("whey-1", "وی"));
        mvc.perform(delete("/api/admin/categories/" + categoryId).with(adminAuth.staff(pm)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RESOURCE_IN_USE"));
    }

    @Test
    void deleteBrandUsedByProduct_isResourceInUse() throws Exception {
        create(body("whey-1", "وی"));
        mvc.perform(delete("/api/admin/brands/" + brandId).with(adminAuth.staff(pm)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RESOURCE_IN_USE"));
    }

    @Test
    void update_isAuditedWithBeforeAndAfter() throws Exception {
        JsonNode created = create(body("whey-1", "قدیمی"));
        long id = created.get("id").asLong();
        Map<String, Object> req = body("whey-1", "جدید");
        req.put("version", created.get("version").asLong());
        send(put("/api/admin/products/" + id), req).andExpect(status().isOk());

        List<Map<String, Object>> rows = jdbc.queryForList(
                "select action, entity_type, entity_id, before::text b, after::text a from audit_log order by id");
        assertThat(rows).extracting(r -> r.get("action")).containsExactly("PRODUCT_CREATE", "PRODUCT_UPDATE");
        Map<String, Object> update = rows.get(1);
        assertThat(update.get("entity_type")).isEqualTo("PRODUCT");
        assertThat(update.get("entity_id")).isEqualTo(id);
        assertThat(json.readTree((String) update.get("b")).get("nameFa").asText()).isEqualTo("قدیمی");
        assertThat(json.readTree((String) update.get("a")).get("nameFa").asText()).isEqualTo("جدید");
    }

    @Test
    void orderOperator_isForbidden() throws Exception {
        StaffUser op = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/products").with(adminAuth.staff(op))).andExpect(status().isForbidden());
    }
}
