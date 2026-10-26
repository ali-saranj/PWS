package ir.pws.store.catalog.image;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

class ProductImageApiTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    @Value("${app.media.dir}")
    String mediaDir;

    StaffUser pm;
    long productId;

    @BeforeEach
    void setUp() {
        pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        long brandId = jdbc.queryForObject("insert into brand (name_fa, slug) values ('برند', 'b1') returning id", Long.class);
        long categoryId = jdbc.queryForObject("insert into category (name_fa, slug) values ('دسته', 'c1') returning id", Long.class);
        productId = jdbc.queryForObject(
                "insert into product (brand_id, category_id, slug, name_fa) values (?, ?, 'p1', 'محصول') returning id",
                Long.class, brandId, categoryId);
    }

    private ResultActions upload(String url, byte[] bytes, String filename) throws Exception {
        return mvc.perform(multipart(url).file(new MockMultipartFile("file", filename, "image/jpeg", bytes))
                .with(adminAuth.staff(pm)));
    }

    private JsonNode uploadOk(byte[] bytes) throws Exception {
        return json.readTree(upload("/api/admin/products/" + productId + "/images", bytes, "evil/../name.jpg")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private Path file(String relPath) {
        return Path.of(mediaDir).resolve(relPath);
    }

    private String relOf(String url) {
        return url.substring("/media/".length());
    }

    @Test
    void upload_thenDetailListsImage_andFileIsServed() throws Exception {
        JsonNode img = uploadOk(TestImages.jpeg(2400, 1600));
        assertThat(img.get("sortOrder").asInt()).isEqualTo(0);
        assertThat(img.get("url").asText()).matches("/media/products/" + productId + "/[0-9a-f-]{36}-1600\\.webp");
        assertThat(img.get("thumbUrl").asText()).endsWith("-400.webp");
        assertThat(img.get("url").asText()).doesNotContain("name.jpg");

        mvc.perform(get("/api/admin/products/" + productId).with(adminAuth.staff(pm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images.length()").value(1))
                .andExpect(jsonPath("$.images[0].id").value(img.get("id").asLong()))
                .andExpect(jsonPath("$.images[0].thumbUrl").value(img.get("thumbUrl").asText()));

        mvc.perform(get("/api/admin/products").with(adminAuth.staff(pm)))
                .andExpect(jsonPath("$.items[0].thumbnailUrl").value(img.get("thumbUrl").asText()));

        // public, unauthenticated
        mvc.perform(get(img.get("thumbUrl").asText()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"));
        byte[] served = mvc.perform(get(img.get("url").asText())).andReturn().getResponse().getContentAsByteArray();
        assertThat(TestImages.width(served)).isEqualTo(1600);
    }

    @Test
    void secondUpload_isAppendedLast() throws Exception {
        uploadOk(TestImages.png(300, 200));
        JsonNode second = uploadOk(TestImages.png(300, 200));
        assertThat(second.get("sortOrder").asInt()).isEqualTo(1);
    }

    @Test
    void invalidFile_isImageInvalid_andNothingStored() throws Exception {
        upload("/api/admin/products/" + productId + "/images", TestImages.fakeJpg(), "fake.jpg")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("file"))
                .andExpect(jsonPath("$.errors[0].code").value("IMAGE_INVALID"));
        assertThat(jdbc.queryForObject("select count(*) from product_image", Long.class)).isZero();
    }

    @Test
    void unknownProduct_isNotFound() throws Exception {
        upload("/api/admin/products/999999/images", TestImages.png(10, 10), "a.png").andExpect(status().isNotFound());
    }

    @Test
    void orderOperator_isForbidden() throws Exception {
        StaffUser op = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(multipart("/api/admin/products/" + productId + "/images")
                .file(new MockMultipartFile("file", "a.png", "image/png", TestImages.png(10, 10)))
                .with(adminAuth.staff(op))).andExpect(status().isForbidden());
    }

    @Test
    void over5MB_isFileTooLarge() throws Exception {
        upload("/api/admin/products/" + productId + "/images", new byte[5 * 1024 * 1024 + 1], "big.jpg")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("file"))
                .andExpect(jsonPath("$.errors[0].code").value("FILE_TOO_LARGE"));
    }

    @Test
    void reorder_requiresExactIdSet() throws Exception {
        long a = uploadOk(TestImages.png(300, 200)).get("id").asLong();
        long b = uploadOk(TestImages.png(300, 200)).get("id").asLong();
        long c = uploadOk(TestImages.png(300, 200)).get("id").asLong();
        String url = "/api/admin/products/" + productId + "/images/order";

        for (List<Long> bad : List.of(List.of(a, b), List.of(a, b, c, 999L), List.of(a, a, b), List.of(a, b, 999L))) {
            order(url, bad).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
        order(url, List.of(c, a, b)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(c))
                .andExpect(jsonPath("$[0].sortOrder").value(0))
                .andExpect(jsonPath("$[1].id").value(a))
                .andExpect(jsonPath("$[2].id").value(b));
        mvc.perform(get("/api/admin/products/" + productId).with(adminAuth.staff(pm)))
                .andExpect(jsonPath("$.images[0].id").value(c));
    }

    private ResultActions order(String url, List<Long> ids) throws Exception {
        return mvc.perform(put(url).with(adminAuth.staff(pm)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("imageIds", ids))));
    }

    @Test
    void updateAlt_changesTextOnly() throws Exception {
        long id = uploadOk(TestImages.png(300, 200)).get("id").asLong();
        mvc.perform(put("/api/admin/images/" + id).with(adminAuth.staff(pm)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("altFa", "متن", "altEn", "text"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.altFa").value("متن"))
                .andExpect(jsonPath("$.altEn").value("text"));
        mvc.perform(put("/api/admin/images/999999").with(adminAuth.staff(pm)).contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isNotFound());
    }

    @Test
    void delete_removesFiles() throws Exception {
        JsonNode img = uploadOk(TestImages.png(300, 200));
        Path large = file(relOf(img.get("url").asText()));
        Path thumb = file(relOf(img.get("thumbUrl").asText()));
        assertThat(large).exists();
        assertThat(thumb).exists();

        mvc.perform(delete("/api/admin/images/" + img.get("id").asLong()).with(adminAuth.staff(pm)))
                .andExpect(status().isNoContent());
        assertThat(large).doesNotExist();
        assertThat(thumb).doesNotExist();
        assertThat(jdbc.queryForObject("select count(*) from product_image", Long.class)).isZero();
        mvc.perform(delete("/api/admin/images/" + img.get("id").asLong()).with(adminAuth.staff(pm)))
                .andExpect(status().isNotFound());
    }

    @Test
    void brandLogo_upload() throws Exception {
        long brandId = jdbc.queryForObject("select id from brand limit 1", Long.class);
        String url = "/api/admin/brands/" + brandId + "/logo";
        JsonNode first = json.readTree(upload(url, TestImages.png(800, 600), "logo.png")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoUrl").value(org.hamcrest.Matchers.matchesPattern(
                        "/media/brands/" + brandId + "/[0-9a-f-]{36}-400\\.webp")))
                .andReturn().getResponse().getContentAsString());
        Path firstFile = file(relOf(first.get("logoUrl").asText()));
        assertThat(firstFile).exists();
        assertThat(TestImages.width(Files.readAllBytes(firstFile))).isEqualTo(400);

        JsonNode second = json.readTree(upload(url, TestImages.png(800, 600), "logo.png")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(firstFile).doesNotExist();
        assertThat(file(relOf(second.get("logoUrl").asText()))).exists();

        upload(url, TestImages.notImage(), "x.png").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("IMAGE_INVALID"));
        upload("/api/admin/brands/999999/logo", TestImages.png(10, 10), "x.png").andExpect(status().isNotFound());
    }

    @Test
    void uploads_areAudited() throws Exception {
        JsonNode a = uploadOk(TestImages.png(300, 200));
        long aId = a.get("id").asLong();
        long bId = uploadOk(TestImages.png(300, 200)).get("id").asLong();
        order("/api/admin/products/" + productId + "/images/order", List.of(bId, aId)).andExpect(status().isOk());
        mvc.perform(put("/api/admin/images/" + aId).with(adminAuth.staff(pm)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"altFa\":\"x\"}")).andExpect(status().isOk());
        mvc.perform(delete("/api/admin/images/" + bId).with(adminAuth.staff(pm))).andExpect(status().isNoContent());
        long brandId = jdbc.queryForObject("select id from brand limit 1", Long.class);
        upload("/api/admin/brands/" + brandId + "/logo", TestImages.png(100, 100), "l.png").andExpect(status().isOk());

        for (String action : List.of("PRODUCT_IMAGE_UPLOAD", "PRODUCT_IMAGES_REORDER", "PRODUCT_IMAGE_UPDATE",
                "PRODUCT_IMAGE_DELETE", "BRAND_LOGO_UPLOAD")) {
            assertThat(jdbc.queryForObject("select count(*) from audit_log where action = ?", Long.class, action))
                    .as(action).isPositive();
        }
        assertThat(jdbc.queryForObject("select count(*) from audit_log where action = 'PRODUCT_IMAGE_UPLOAD'",
                Long.class)).isEqualTo(2);
    }

    @Test
    void rolledBackUpload_leavesNoFiles() throws Exception {
        // A product that disappears between check and insert is not reachable via HTTP, so exercise the
        // transaction-bound writer directly.
        var storage = new LocalMediaStorage(new ir.pws.store.config.AppProperties(null, null, null,
                new ir.pws.store.config.AppProperties.Media(mediaDir, "/media", true), null, null, null));
        var tx = new org.springframework.transaction.support.TransactionTemplate(
                new org.springframework.jdbc.support.JdbcTransactionManager(jdbc.getDataSource()));
        String rel = "products/" + productId + "/rollback-test-400.webp";
        tx.executeWithoutResult(status -> {
            MediaTransactions.saveFiles(storage, Map.of(rel, new byte[] {1, 2, 3}));
            assertThat(file(rel)).exists();
            status.setRollbackOnly();
        });
        assertThat(file(rel)).doesNotExist();
    }

    @Test
    void missingFilePart_isRequiredFieldError() throws Exception {
        long brandId = jdbc.queryForObject("select id from brand limit 1", Long.class);
        for (String url : List.of("/api/admin/products/" + productId + "/images",
                "/api/admin/brands/" + brandId + "/logo")) {
            mvc.perform(multipart(url).file(new MockMultipartFile("other", "a.png", "image/png", new byte[] {1}))
                    .with(adminAuth.staff(pm)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("file"))
                    .andExpect(jsonPath("$.errors[0].code").value("REQUIRED"));
        }
    }

    @Test
    void storage_rejectsPathEscape() {
        var storage = new LocalMediaStorage(new ir.pws.store.config.AppProperties(null, null, null,
                new ir.pws.store.config.AppProperties.Media(mediaDir, "/media", true), null, null, null));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> storage.save("../escape.webp", new byte[] {1}))
                .isInstanceOf(IllegalArgumentException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> storage.delete("products/../../escape.webp"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
