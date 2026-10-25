package ir.pws.store.catalog.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;

class InventoryApiTest extends IntegrationTest {

    @Autowired AdminAuth adminAuth;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;

    StaffUser pm;
    long productId;

    @BeforeEach
    void setUp() {
        pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long brandId = jdbc.queryForObject("insert into brand (name_fa, slug) values ('برند', 'b1') returning id", Long.class);
        long categoryId = jdbc.queryForObject("insert into category (name_fa, slug) values ('دسته', 'c1') returning id", Long.class);
        productId = product(brandId, categoryId, "whey-1", "وی پروتئین", "Whey Gold");
    }

    private long product(long brandId, long categoryId, String slug, String fa, String en) {
        return jdbc.queryForObject("insert into product (brand_id, category_id, slug, name_fa, name_en) values (?, ?, ?, ?, ?) returning id",
                Long.class, brandId, categoryId, slug, fa, en);
    }

    private long variant(long pid, String sku, int stock, int threshold) {
        return jdbc.queryForObject("insert into variant (product_id, sku, base_price, stock_on_hand, low_stock_threshold) values (?, ?, 1000, ?, ?) returning id",
                Long.class, pid, sku, stock, threshold);
    }

    private int stock(long id) {
        return jdbc.queryForObject("select stock_on_hand from variant where id = ?", Integer.class, id);
    }

    private ResultActions adjust(Object body) throws Exception {
        return mvc.perform(post("/api/admin/inventory/adjustments").with(adminAuth.staff(pm))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    private Map<String, Object> adj(long variantId, int delta) {
        return Map.of("variantId", variantId, "delta", delta);
    }

    @Test
    void adjust_updatesStock_andRecordsMovementWithStaff() throws Exception {
        long id = variant(productId, "A-1", 5, 2);
        adjust(Map.of("adjustments", List.of(Map.of("variantId", id, "delta", 7, "note", "restock"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].variantId").value(id))
                .andExpect(jsonPath("$[0].stockOnHand").value(12))
                .andExpect(jsonPath("$[0].productNameFa").value("وی پروتئین"))
                .andExpect(jsonPath("$[0].productNameEn").value("Whey Gold"));
        assertThat(stock(id)).isEqualTo(12);
        Map<String, Object> row = jdbc.queryForMap("select delta, reason, note, staff_user_id from stock_movement");
        assertThat(row.get("delta")).isEqualTo(7);
        assertThat(row.get("reason")).isEqualTo("MANUAL_ADJUSTMENT");
        assertThat(row.get("note")).isEqualTo("restock");
        assertThat(row.get("staff_user_id")).isEqualTo(pm.getId());
        assertThat(jdbc.queryForObject("select count(*) from audit_log where action = 'STOCK_ADJUSTMENT' and entity_type = 'INVENTORY' and entity_id is null", Long.class)).isEqualTo(1);

        mvc.perform(get("/api/admin/variants/" + id + "/movements").with(adminAuth.staff(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].delta").value(7))
                .andExpect(jsonPath("$.items[0].reason").value("MANUAL_ADJUSTMENT"))
                .andExpect(jsonPath("$.items[0].staffUsername").value(pm.getUsername()));
        mvc.perform(get("/api/admin/variants/999999/movements").with(adminAuth.staff(pm)))
                .andExpect(status().isNotFound());
    }

    @Test
    void batchIsAllOrNothing() throws Exception {
        long a = variant(productId, "A-1", 5, 2);
        long b = variant(productId, "A-2", 1, 2);
        adjust(Map.of("adjustments", List.of(adj(a, 3), adj(b, -2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("adjustments[1].delta"))
                .andExpect(jsonPath("$.errors[0].code").value("STOCK_NEGATIVE"));
        assertThat(stock(a)).isEqualTo(5);
        assertThat(stock(b)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from stock_movement", Long.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from audit_log where action = 'STOCK_ADJUSTMENT'", Long.class)).isZero();
    }

    @Test
    void invalidBatches_areRejected() throws Exception {
        long a = variant(productId, "A-1", 5, 2);
        adjust(Map.of("adjustments", List.of())).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("adjustments"))
                .andExpect(jsonPath("$.errors[0].code").value("REQUIRED"));
        adjust(Map.of("adjustments", List.of(adj(a, 0)))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("adjustments[0].delta"));
        adjust(Map.of("adjustments", List.of(adj(a, 1), adj(a, 2)))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("adjustments[1].variantId"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
        adjust(Map.of("adjustments", List.of(adj(a, 1), adj(999999, 1)))).andExpect(status().isNotFound());
        adjust(Map.of("adjustments", List.of(Map.of("variantId", a, "delta", 1, "note", "x".repeat(501)))))
                .andExpect(status().isBadRequest());
        assertThat(stock(a)).isEqualTo(5);
    }

    @Test
    void persianDigitsAreNotAccepted_asJsonNumbers() throws Exception {
        long id = variant(productId, "A-1", 5, 2);
        mvc.perform(post("/api/admin/inventory/adjustments").with(adminAuth.staff(pm))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"adjustments\":[{\"variantId\":" + id + ",\"delta\":\"۵\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        assertThat(stock(id)).isEqualTo(5);
    }

    @Test
    void lowStockFilter() throws Exception {
        variant(productId, "LOW-1", 2, 5);
        variant(productId, "EDGE-1", 5, 5);
        variant(productId, "OK-1", 6, 5);
        JsonNode all = list("");
        assertThat(all.get("total").asInt()).isEqualTo(3);
        assertThat(all.get("items").get(0).get("sku").asText()).isEqualTo("LOW-1"); // stock ascending
        JsonNode low = json.readTree(mvc.perform(get("/api/admin/inventory").param("lowStock", "true")
                .with(adminAuth.staff(pm))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(low.get("total").asInt()).isEqualTo(2);
        assertThat(low.get("items").get(1).get("sku").asText()).isEqualTo("EDGE-1");
    }

    @Test
    void searchBySkuAndName() throws Exception {
        variant(productId, "WHEY-CHOC", 1, 0);
        long other = product(jdbc.queryForObject("select id from brand", Long.class),
                jdbc.queryForObject("select id from category", Long.class), "bcaa", "بی سی ای ای", "BCAA Pro");
        variant(other, "BC-1", 1, 0);
        assertThat(list("whey-ch").get("total").asInt()).isEqualTo(1);
        assertThat(list("WHEY GOLD").get("total").asInt()).isEqualTo(1);
        assertThat(list("gold").get("total").asInt()).isEqualTo(1);
        assertThat(list("وی").get("total").asInt()).isEqualTo(1);
        assertThat(list("bcaa pro").get("total").asInt()).isEqualTo(1);
        assertThat(list("pro").get("items").get(0).get("sku").asText()).isEqualTo("BC-1");
        assertThat(list("%").get("total").asInt()).isZero();
        assertThat(list("_").get("total").asInt()).isZero();
    }

    @Test
    void orderOperator_isForbidden() throws Exception {
        StaffUser op = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/inventory").with(adminAuth.staff(op))).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/inventory/adjustments").with(adminAuth.staff(op))
                .contentType(MediaType.APPLICATION_JSON).content("{\"adjustments\":[]}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/variants/1/movements").with(adminAuth.staff(op))).andExpect(status().isForbidden());
    }

    @Test
    void concurrentAdjustments_doNotLoseUpdates() throws Exception {
        long id = variant(productId, "A-1", 10, 2);
        List<Integer> first = fire(10, id);
        assertThat(first).containsOnly(200);
        assertThat(stock(id)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from stock_movement where variant_id = ?", Long.class, id)).isEqualTo(10);

        jdbc.update("update variant set stock_on_hand = 1 where id = ?", id);
        List<Integer> second = fire(2, id);
        assertThat(second).containsExactlyInAnyOrder(200, 400);
        assertThat(stock(id)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from stock_movement where variant_id = ?", Long.class, id)).isEqualTo(11);
    }

    private List<Integer> fire(int n, long id) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        try {
            CountDownLatch gate = new CountDownLatch(1);
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> {
                    gate.await();
                    return adjust(Map.of("adjustments", List.of(adj(id, -1)))).andReturn().getResponse().getStatus();
                }));
            }
            gate.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> f : futures) {
                statuses.add(f.get(30, TimeUnit.SECONDS));
            }
            return statuses;
        } finally {
            pool.shutdownNow();
        }
    }

    private JsonNode list(String q) throws Exception {
        return json.readTree(mvc.perform(get("/api/admin/inventory").param("q", q).with(adminAuth.staff(pm)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
}
