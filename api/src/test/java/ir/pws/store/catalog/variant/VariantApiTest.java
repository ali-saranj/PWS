package ir.pws.store.catalog.variant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.catalog.inventory.StockLedger;
import ir.pws.store.catalog.inventory.StockMovementReason;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.util.LinkedHashMap;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

class VariantApiTest extends IntegrationTest {

    @Autowired AdminAuth adminAuth;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;
    @Autowired StockLedger ledger;
    @Autowired VariantRepository variantRepository;
    @Autowired TransactionTemplate tx;
    @Autowired VariantService variantService;

    StaffUser pm;
    long productId;

    @BeforeEach
    void setUp() {
        pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long brandId = jdbc.queryForObject("insert into brand (name_fa, slug) values ('برند', 'b1') returning id", Long.class);
        long categoryId = jdbc.queryForObject("insert into category (name_fa, slug) values ('دسته', 'c1') returning id", Long.class);
        productId = newProduct(brandId, categoryId, "whey-1");
    }

    private long newProduct(long brandId, long categoryId, String slug) {
        return jdbc.queryForObject("insert into product (brand_id, category_id, slug, name_fa) values (?, ?, ?, 'وی') returning id",
                Long.class, brandId, categoryId, slug);
    }

    private Map<String, Object> variantBody(String sku, long base) {
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("sku", sku);
        b.put("flavourFa", "شکلات");
        b.put("flavourEn", "Chocolate");
        b.put("sizeLabel", "2kg");
        b.put("weightGrams", 2000);
        b.put("basePrice", base);
        return b;
    }

    private ResultActions send(MockHttpServletRequestBuilder b, Object body) throws Exception {
        return mvc.perform(b.with(adminAuth.staff(pm)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private JsonNode createVariant(long pid, Map<String, Object> body) throws Exception {
        return json.readTree(send(post("/api/admin/products/" + pid + "/variants"), body)
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode createVariant(String sku, long base) throws Exception {
        return createVariant(productId, variantBody(sku, base));
    }

    private JsonNode product(long id) throws Exception {
        return json.readTree(mvc.perform(get("/api/admin/products/" + id).with(adminAuth.staff(pm)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private Map<String, Object> statusBody(String status, long version) {
        return Map.of("status", status, "version", version);
    }

    private JsonNode list(String q) throws Exception {
        return json.readTree(mvc.perform(get("/api/admin/products").param("q", q).with(adminAuth.staff(pm)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    @Test
    void create_withInitialStock_writesInitialMovement() throws Exception {
        Map<String, Object> b = variantBody("whey-1", 2_000_000);
        b.put("initialStock", 25);
        send(post("/api/admin/products/" + productId + "/variants"), b)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stockOnHand").value(25))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.tiers.length()").value(0));
        List<Map<String, Object>> rows = jdbc.queryForList("select delta, reason, staff_user_id from stock_movement");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("delta")).isEqualTo(25);
        assertThat(rows.get(0).get("reason")).isEqualTo("INITIAL");
        assertThat(rows.get(0).get("staff_user_id")).isEqualTo(pm.getId());
        assertThat(jdbc.queryForObject("select count(*) from audit_log where action = 'VARIANT_CREATE' and entity_type = 'VARIANT'", Long.class)).isEqualTo(1);
    }

    @Test
    void create_withoutInitialStock_writesNoMovement() throws Exception {
        createVariant("A-1", 1_000_000);
        assertThat(jdbc.queryForObject("select count(*) from stock_movement", Long.class)).isZero();
    }

    @Test
    void create_unknownProduct_is404() throws Exception {
        send(post("/api/admin/products/999999/variants"), variantBody("A-1", 1_000_000)).andExpect(status().isNotFound());
    }

    @Test
    void skuIsUppercasedAndUnique() throws Exception {
        send(post("/api/admin/products/" + productId + "/variants"), variantBody(" whey-1 ", 1_000_000))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.sku").value("WHEY-1"));
        send(post("/api/admin/products/" + productId + "/variants"), variantBody("WHEY-1", 1_000_000))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("sku"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
    }

    @Test
    void compareAtPrice_mustExceedBasePrice() throws Exception {
        Map<String, Object> b = variantBody("A-1", 1_000_000);
        b.put("compareAtPrice", 1_000_000);
        send(post("/api/admin/products/" + productId + "/variants"), b)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("compareAtPrice"))
                .andExpect(jsonPath("$.errors[0].code").value("INVALID"));
        b.put("compareAtPrice", 1_200_000);
        send(post("/api/admin/products/" + productId + "/variants"), b).andExpect(status().isCreated());
    }

    @Test
    void update_staleVersion_isConflict() throws Exception {
        JsonNode v = createVariant("A-1", 1_000_000);
        long id = v.get("id").asLong();
        Map<String, Object> req = variantBody("A-1", 1_100_000);
        req.put("version", 0);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isOk())
                .andExpect(jsonPath("$.basePrice").value(1_100_000)).andExpect(jsonPath("$.version").value(1));
        req.put("basePrice", 1_300_000);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
        assertThat(jdbc.queryForObject("select base_price from variant where id = ?", Long.class, id)).isEqualTo(1_100_000);
        req.remove("version");
        send(put("/api/admin/variants/" + id), req).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("version"));
    }

    @Test
    void update_doesNotChangeStock() throws Exception {
        Map<String, Object> b = variantBody("A-1", 1_000_000);
        b.put("initialStock", 10);
        long id = createVariant(productId, b).get("id").asLong();
        Map<String, Object> req = variantBody("A-1", 1_000_000);
        req.put("version", 0);
        req.put("initialStock", 99);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isOk())
                .andExpect(jsonPath("$.stockOnHand").value(10));
        assertThat(jdbc.queryForObject("select count(*) from stock_movement", Long.class)).isEqualTo(1);
    }

    @Test
    void update_canDeactivate_andIsAudited() throws Exception {
        long id = createVariant("A-1", 1_000_000).get("id").asLong();
        Map<String, Object> req = variantBody("A-1", 1_000_000);
        req.put("version", 0);
        req.put("active", false);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        assertThat(jdbc.queryForList("select action from audit_log order by id", String.class))
                .containsExactly("VARIANT_CREATE", "VARIANT_UPDATE");
    }

    @Test
    void replaceTiers_validatesAndPersists() throws Exception {
        long id = createVariant("A-1", 2_000_000).get("id").asLong();
        send(put("/api/admin/variants/" + id + "/tiers"), Map.of("tiers", List.of(
                Map.of("minQty", 50, "unitPrice", 1_700_000), Map.of("minQty", 10, "unitPrice", 1_850_000))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tiers.length()").value(2))
                .andExpect(jsonPath("$.tiers[0].minQty").value(10))
                .andExpect(jsonPath("$.tiers[1].unitPrice").value(1_700_000));
        // replace-all
        send(put("/api/admin/variants/" + id + "/tiers"), Map.of("tiers", List.of(Map.of("minQty", 5, "unitPrice", 1_900_000))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tiers.length()").value(1));
        assertThat(jdbc.queryForObject("select count(*) from volume_tier", Long.class)).isEqualTo(1);
        send(put("/api/admin/variants/" + id + "/tiers"), Map.of("tiers", List.of()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tiers.length()").value(0));
        assertThat(jdbc.queryForList("select action from audit_log order by id", String.class))
                .containsExactly("VARIANT_CREATE", "VARIANT_TIERS_UPDATE", "VARIANT_TIERS_UPDATE", "VARIANT_TIERS_UPDATE");
        send(put("/api/admin/variants/999999/tiers"), Map.of("tiers", List.of())).andExpect(status().isNotFound());
    }

    @Test
    void tiersInvalid_returnsIndexedFieldErrors() throws Exception {
        long id = createVariant("A-1", 2_000_000).get("id").asLong();
        send(put("/api/admin/variants/" + id + "/tiers"), Map.of("tiers", List.of(
                Map.of("minQty", 10, "unitPrice", 1_800_000),
                Map.of("minQty", 1, "unitPrice", 1_700_000),
                Map.of("minQty", 50, "unitPrice", 2_100_000))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("tiers[1].minQty"))
                .andExpect(jsonPath("$.errors[0].code").value("TIER_INVALID"))
                .andExpect(jsonPath("$.errors[1].field").value("tiers[2].unitPrice"));
        assertThat(jdbc.queryForObject("select count(*) from volume_tier", Long.class)).isZero();
    }

    @Test
    void basePriceChange_invalidatingTiers_isRejected() throws Exception {
        long id = createVariant("A-1", 2_000_000).get("id").asLong();
        send(put("/api/admin/variants/" + id + "/tiers"), Map.of("tiers", List.of(Map.of("minQty", 10, "unitPrice", 1_800_000))))
                .andExpect(status().isOk());
        Map<String, Object> req = variantBody("A-1", 1_500_000);
        req.put("version", 0);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("basePrice"))
                .andExpect(jsonPath("$.errors[0].code").value("TIER_INVALID"));
        req.put("basePrice", 2_500_000);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isOk());
    }

    @Test
    void publishWithoutActiveVariant_isNotPublishable() throws Exception {
        send(post("/api/admin/products/" + productId + "/status"), statusBody("ACTIVE", 0))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PRODUCT_NOT_PUBLISHABLE"));
        long id = createVariant("A-1", 1_000_000).get("id").asLong();
        Map<String, Object> req = variantBody("A-1", 1_000_000);
        req.put("version", 0);
        req.put("active", false);
        send(put("/api/admin/variants/" + id), req).andExpect(status().isOk());
        send(post("/api/admin/products/" + productId + "/status"), statusBody("ACTIVE", 0))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PRODUCT_NOT_PUBLISHABLE"));
    }

    @Test
    void publishWithActiveVariant_succeeds() throws Exception {
        createVariant("A-1", 1_000_000);
        send(post("/api/admin/products/" + productId + "/status"), statusBody("ACTIVE", 0))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.version").value(1)).andExpect(jsonPath("$.variants.length()").value(1));
        send(post("/api/admin/products/" + productId + "/status"), statusBody("ARCHIVED", 1))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ARCHIVED"));
        assertThat(jdbc.queryForList("select action from audit_log where entity_type = 'PRODUCT' order by id", String.class))
                .containsExactly("PRODUCT_STATUS_CHANGE", "PRODUCT_STATUS_CHANGE");
    }

    @Test
    void status_staleOrMissingVersion_andUnknownProduct() throws Exception {
        send(post("/api/admin/products/" + productId + "/status"), statusBody("ARCHIVED", 7)).andExpect(status().isConflict());
        send(post("/api/admin/products/" + productId + "/status"), Map.of("status", "ARCHIVED"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("version"));
        send(post("/api/admin/products/999999/status"), statusBody("ARCHIVED", 0)).andExpect(status().isNotFound());
    }

    @Test
    void productDetail_includesVariantsAndTiers() throws Exception {
        long id = createVariant("A-1", 2_000_000).get("id").asLong();
        send(put("/api/admin/variants/" + id + "/tiers"), Map.of("tiers", List.of(Map.of("minQty", 10, "unitPrice", 1_850_000))))
                .andExpect(status().isOk());
        JsonNode p = product(productId);
        assertThat(p.get("variants")).hasSize(1);
        assertThat(p.get("variants").get(0).get("sku").asText()).isEqualTo("A-1");
        assertThat(p.get("variants").get(0).get("tiers").get(0).get("minQty").asInt()).isEqualTo(10);
    }

    @Test
    void summary_showsVariantCountMinPriceTotalStock() throws Exception {
        long other = newProduct(
                jdbc.queryForObject("select id from brand limit 1", Long.class),
                jdbc.queryForObject("select id from category limit 1", Long.class), "empty-1");
        Map<String, Object> a = variantBody("A-1", 2_000_000);
        a.put("initialStock", 10);
        createVariant(productId, a);
        Map<String, Object> b = variantBody("A-2", 1_500_000);
        b.put("initialStock", 5);
        createVariant(productId, b);
        // inactive variant: counts for count/stock but not for minPrice
        Map<String, Object> c = variantBody("A-3", 900_000);
        c.put("initialStock", 7);
        c.put("active", false);
        createVariant(productId, c);

        JsonNode items = json.readTree(mvc.perform(get("/api/admin/products").with(adminAuth.staff(pm)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("items");
        assertThat(items).hasSize(2);
        for (JsonNode item : items) {
            if (item.get("id").asLong() == productId) {
                assertThat(item.get("variantCount").asInt()).isEqualTo(3);
                assertThat(item.get("minPrice").asLong()).isEqualTo(1_500_000);
                assertThat(item.get("totalStock").asLong()).isEqualTo(22);
            } else {
                assertThat(item.get("id").asLong()).isEqualTo(other);
                assertThat(item.get("variantCount").asInt()).isZero();
                assertThat(item.get("minPrice").isNull()).isTrue();
                assertThat(item.get("totalStock").asLong()).isZero();
            }
        }
    }

    @Test
    void productSearch_matchesVariantSku_withoutDuplicates() throws Exception {
        createVariant("WHEY-CHOC", 1_000_000);
        createVariant("WHEY-VAN", 1_000_000);
        for (String q : List.of("whey-ch", "CHOC", "whey-")) {
            JsonNode res = list(q);
            assertThat(res.get("total").asInt()).as(q).isEqualTo(1);
            assertThat(res.get("items")).hasSize(1);
        }
        assertThat(list("nope-sku").get("total").asInt()).isZero();
        assertThat(list("_").get("total").asInt()).isZero();
    }

    @Test
    void stockLedger_appliesDelta_rejectsNegative_andRecordsMovements() throws Exception {
        long id = createVariant("A-1", 1_000_000).get("id").asLong();
        tx.executeWithoutResult(s -> {
            Variant v = variantRepository.findById(id).orElseThrow();
            ledger.apply(v, 8, StockMovementReason.MANUAL_ADJUSTMENT, null, "restock");
            assertThat(v.getStockOnHand()).isEqualTo(8);
        });
        assertThatThrownBy(() -> tx.executeWithoutResult(s -> {
            Variant v = variantRepository.findById(id).orElseThrow();
            ledger.apply(v, -9, StockMovementReason.MANUAL_ADJUSTMENT, null, null);
        })).isInstanceOfSatisfying(ApiException.class,
                e -> assertThat(e.errors().get(0).code()).isEqualTo("STOCK_NEGATIVE"));
        assertThat(jdbc.queryForObject("select stock_on_hand from variant where id = ?", Integer.class, id)).isEqualTo(8);
        List<Map<String, Object>> rows = jdbc.queryForList("select delta, reason, staff_user_id, note from stock_movement");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("staff_user_id")).isNull(); // no authenticated staff outside a request
        assertThat(rows.get(0).get("note")).isEqualTo("restock");
        // stock changes do not bump the optimistic version
        assertThat(jdbc.queryForObject("select version from variant where id = ?", Long.class, id)).isZero();
    }

    @Test
    void ledgerOverflow_isInvalidDeltaField() throws Exception {
        long id = createVariant("A-1", 1_000_000).get("id").asLong();
        tx.executeWithoutResult(s -> ledger.apply(variantRepository.findById(id).orElseThrow(), 8,
                StockMovementReason.MANUAL_ADJUSTMENT, null, null));
        assertThatThrownBy(() -> tx.executeWithoutResult(s -> ledger.apply(variantRepository.findById(id).orElseThrow(),
                Integer.MAX_VALUE, StockMovementReason.MANUAL_ADJUSTMENT, null, null)))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.errors().get(0).field()).isEqualTo("delta");
                    assertThat(e.errors().get(0).code()).isEqualTo("INVALID");
                });
        assertThat(jdbc.queryForObject("select stock_on_hand from variant where id = ?", Integer.class, id)).isEqualTo(8);
    }

    @Test
    void tiers_nullElement_is400() throws Exception {
        long id = createVariant("A-1", 2_000_000).get("id").asLong();
        mvc.perform(put("/api/admin/variants/" + id + "/tiers").with(adminAuth.staff(pm))
                .contentType(MediaType.APPLICATION_JSON).content("{\"tiers\":[null]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        mvc.perform(put("/api/admin/variants/" + id + "/tiers").with(adminAuth.staff(pm))
                .contentType(MediaType.APPLICATION_JSON).content("{\"tiers\":[{\"minQty\":null,\"unitPrice\":5}]}"))
                .andExpect(status().isBadRequest());
    }

    /** Admin PUT racing a ledger apply(-1): the ledger transaction holds the row lock while the PUT starts. */
    @Test
    void adminUpdate_concurrentWithLedgerApply_doesNotLoseStock() throws Exception {
        Map<String, Object> b = variantBody("A-1", 1_000_000);
        b.put("initialStock", 10);
        long id = createVariant(productId, b).get("id").asLong();
        Map<String, Object> req = variantBody("A-1", 1_100_000);
        req.put("version", 0);
        VariantUpsertRequest put = json.convertValue(req, VariantUpsertRequest.class);

        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            Future<?> admin;
            CountDownLatch adminStarted = new CountDownLatch(1);
            admin = tx.execute(s -> {
                ledger.apply(variantRepository.findById(id).orElseThrow(), -1, StockMovementReason.ORDER_PAID, 1L, null);
                Future<?> f = pool.submit(() -> {
                    adminStarted.countDown();
                    return variantService.update(id, put);
                });
                try {
                    adminStarted.await();
                    Thread.sleep(500); // let the PUT reach the row while we still hold the lock
                } catch (InterruptedException e) {
                    throw new IllegalStateException(e);
                }
                return f;
            });
            admin.get(10, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("select stock_on_hand from variant where id = ?", Integer.class, id)).isEqualTo(9);
        assertThat(jdbc.queryForObject("select version from variant where id = ?", Long.class, id)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select base_price from variant where id = ?", Long.class, id)).isEqualTo(1_100_000);
        assertThat(jdbc.queryForObject("select count(*) from stock_movement where reason = 'ORDER_PAID'", Long.class)).isEqualTo(1);
    }

    @Test
    void tiersPut_concurrentWithBasePriceChange_neverBreaksInvariant() throws Exception {
        long id = createVariant("A-1", 2_000_000).get("id").asLong();
        Map<String, Object> req = variantBody("A-1", 1_800_000);
        req.put("version", 0);
        VariantUpsertRequest put = json.convertValue(req, VariantUpsertRequest.class);
        TiersRequest tiers = new TiersRequest(List.of(new TierDto(10, 1_900_000)));

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch ready = new CountDownLatch(2);
            CountDownLatch go = new CountDownLatch(1);
            Future<Object> a = pool.submit(() -> {
                ready.countDown();
                go.await();
                return variantService.replaceTiers(id, tiers);
            });
            Future<Object> b = pool.submit(() -> {
                ready.countDown();
                go.await();
                return variantService.update(id, put);
            });
            ready.await();
            go.countDown();
            int failures = 0;
            for (Future<Object> f : List.of(a, b)) {
                try {
                    f.get(15, TimeUnit.SECONDS);
                } catch (java.util.concurrent.ExecutionException e) {
                    assertThat(e.getCause()).isInstanceOf(ApiException.class);
                    assertThat(((ApiException) e.getCause()).errors().get(0).code()).isEqualTo("TIER_INVALID");
                    failures++;
                }
            }
            assertThat(failures).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("""
                select count(*) from volume_tier t join variant v on v.id = t.variant_id
                where t.unit_price >= v.base_price""", Long.class)).isZero();
    }

    @Test
    void orderOperator_isForbidden() throws Exception {
        StaffUser op = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(post("/api/admin/products/" + productId + "/variants").with(adminAuth.staff(op))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(variantBody("A-1", 1))))
                .andExpect(status().isForbidden());
    }
}
