package ir.pws.store.staff;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

class StaffAdminTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    @Autowired
    StaffUserRepository staff;

    @Autowired
    StaffAuthService authService;

    @Autowired
    PasswordEncoder encoder;

    private Map<String, Object> newStaff(String username) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("username", username);
        body.put("password", "Str0ng-password!");
        body.put("fullName", "New Person");
        body.put("mobile", "09351234567");
        body.put("role", "PRODUCT_MANAGER");
        return body;
    }

    private ResultActions create(StaffUser actor, Map<String, Object> body) throws Exception {
        return mvc.perform(post("/api/admin/staff")
                .with(adminAuth.staff(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private ResultActions update(StaffUser actor, long id, Map<String, Object> body) throws Exception {
        return mvc.perform(put("/api/admin/staff/" + id)
                .with(adminAuth.staff(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private Map<String, Object> updateBody(StaffUser u, String role, boolean active) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fullName", u.getFullName());
        body.put("mobile", u.getMobile());
        body.put("role", role);
        body.put("active", active);
        body.put("version", u.getVersion());
        return body;
    }

    private StaffUser reload(StaffUser u) {
        return staff.findById(u.getId()).orElseThrow();
    }

    @Test
    void create_returnsStaff_andAudits() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        create(owner, newStaff("Sara.M"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("sara.m"))
                .andExpect(jsonPath("$.fullName").value("New Person"))
                .andExpect(jsonPath("$.mobile").value("09351234567"))
                .andExpect(jsonPath("$.role").value("PRODUCT_MANAGER"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.version").value(0));

        StaffUser created = staff.findByUsername("sara.m").orElseThrow();
        assertThat(encoder.matches("Str0ng-password!", created.getPasswordHash())).isTrue();
        List<Map<String, Object>> rows =
                jdbc.queryForList("select staff_user_id, action, entity_type, entity_id, ip from audit_log");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0))
                .containsEntry("staff_user_id", owner.getId())
                .containsEntry("action", "STAFF_CREATE")
                .containsEntry("entity_type", "STAFF_USER")
                .containsEntry("entity_id", created.getId())
                .containsEntry("ip", "127.0.0.1");
        String audited = jdbc.queryForObject("select after::text from audit_log", String.class);
        assertThat(audited).doesNotContain("Str0ng").doesNotContain("assword");
    }

    @Test
    void duplicateUsername_isFieldDuplicate() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        create(owner, newStaff("sara")).andExpect(status().isCreated());
        Map<String, Object> again = newStaff("  SARA ");
        again.put("mobile", "09351111111");
        create(owner, again)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("username"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
    }

    @Test
    void duplicateMobile_isFieldDuplicate() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        create(owner, newStaff("sara")).andExpect(status().isCreated());
        create(owner, newStaff("other"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("mobile"))
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE"));
    }

    @Test
    void shortPassword_isFieldPasswordTooShort() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        Map<String, Object> body = newStaff("sara");
        body.put("password", "short-9ch");
        create(owner, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"))
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_TOO_SHORT"));
        body.put("password", "exactly-10");
        create(owner, body).andExpect(status().isCreated());
    }

    @Test
    void overLongPassword_isFieldPasswordTooLong() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        String tooLong = "ک".repeat(37); // 2 bytes each in UTF-8 = 74 bytes
        Map<String, Object> body = newStaff("sara");
        body.put("password", tooLong);
        create(owner, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"))
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_TOO_LONG"));
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        mvc.perform(post("/api/admin/staff/" + pm.getId() + "/password")
                        .with(adminAuth.staff(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("password", tooLong))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_TOO_LONG"));
        body.put("password", "x".repeat(72));
        create(owner, body).andExpect(status().isCreated());
    }

    @Test
    void persianDigitMobile_isNormalised() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        Map<String, Object> body = newStaff("sara");
        body.put("mobile", "۰۹۱۲۳۴۵۶۷۸۹");
        create(owner, body).andExpect(status().isCreated()).andExpect(jsonPath("$.mobile").value("09123456789"));
        Map<String, Object> bad = newStaff("bad");
        bad.put("mobile", "123");
        create(owner, bad)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("mobile"))
                .andExpect(jsonPath("$.errors[0].code").value("MOBILE_INVALID"));
    }

    @Test
    void update_changesFields_andAudits() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        Map<String, Object> body = updateBody(pm, "ORDER_OPERATOR", true);
        body.put("fullName", "Renamed");
        body.put("mobile", "+989351112233");
        update(owner, pm.getId(), body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Renamed"))
                .andExpect(jsonPath("$.mobile").value("09351112233"))
                .andExpect(jsonPath("$.role").value("ORDER_OPERATOR"))
                .andExpect(jsonPath("$.version").value(1));
        assertThat(jdbc.queryForObject(
                        "select count(*) from audit_log where action = 'STAFF_UPDATE' and entity_id = ?",
                        Integer.class,
                        pm.getId()))
                .isEqualTo(1);
        update(owner, 999999L, body).andExpect(status().isNotFound());
    }

    @Test
    void staleVersion_isConflict() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        Map<String, Object> body = updateBody(pm, "PRODUCT_MANAGER", true);
        body.put("fullName", "First");
        update(owner, pm.getId(), body).andExpect(status().isOk());
        body.put("fullName", "Second"); // still carries version 0
        update(owner, pm.getId(), body)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
        assertThat(reload(pm).getFullName()).isEqualTo("First");
    }

    @Test
    void cannotDemoteOrDeactivateLastActiveOwner() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        update(owner, owner.getId(), updateBody(owner, "PRODUCT_MANAGER", true))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("role"))
                .andExpect(jsonPath("$.errors[0].code").value("LAST_OWNER"));
        update(owner, owner.getId(), updateBody(owner, "OWNER", false))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("active"))
                .andExpect(jsonPath("$.errors[0].code").value("LAST_OWNER"));
        assertThat(reload(owner).getRole()).isEqualTo(StaffRole.OWNER);
        assertThat(reload(owner).isActive()).isTrue();

        // with a second active owner the first may step down
        StaffUser second = adminAuth.createStaff(StaffRole.OWNER);
        update(second, owner.getId(), updateBody(owner, "PRODUCT_MANAGER", true)).andExpect(status().isOk());
        // an inactive owner does not count: the remaining one is now last
        update(second, second.getId(), updateBody(second, "OWNER", false))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("LAST_OWNER"));
    }

    @Test
    void deactivating_revokesRefreshTokens() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        insertRefreshToken(pm, "tok-deactivate");
        update(owner, pm.getId(), updateBody(pm, "PRODUCT_MANAGER", false))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
        assertThat(jdbc.queryForObject(
                        "select count(*) from refresh_token where subject_id = ? and revoked_at is null",
                        Integer.class,
                        pm.getId()))
                .isZero();
    }

    @Test
    void passwordReset_revokesRefreshTokens() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        insertRefreshToken(pm, "tok-reset");
        mvc.perform(post("/api/admin/staff/" + pm.getId() + "/password")
                        .with(adminAuth.staff(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Another-pass-77\"}"))
                .andExpect(status().isNoContent());
        assertThat(encoder.matches("Another-pass-77", reload(pm).getPasswordHash())).isTrue();
        assertThat(jdbc.queryForObject(
                        "select count(*) from refresh_token where subject_id = ? and revoked_at is null",
                        Integer.class,
                        pm.getId()))
                .isZero();
        assertThat(jdbc.queryForObject(
                        "select count(*) from audit_log where action = 'STAFF_PASSWORD_RESET'", Integer.class))
                .isEqualTo(1);
        mvc.perform(post("/api/admin/staff/" + pm.getId() + "/password")
                        .with(adminAuth.staff(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_TOO_SHORT"));
    }

    @Test
    void productManager_isForbidden() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        mvc.perform(get("/api/admin/staff").with(adminAuth.staff(pm))).andExpect(status().isForbidden());
        create(pm, newStaff("sara")).andExpect(status().isForbidden());
        update(pm, pm.getId(), updateBody(pm, "OWNER", true)).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/staff/" + pm.getId() + "/password")
                        .with(adminAuth.staff(pm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Another-pass-77\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/staff")).andExpect(status().isUnauthorized());
    }

    @Test
    void list_returnsAllStaff() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/staff").with(adminAuth.staff(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].username").value(owner.getUsername()));
    }

    @Test
    void responsesNeverContainPasswordHash() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        String listBody = mvc.perform(get("/api/admin/staff").with(adminAuth.staff(owner)))
                .andReturn().getResponse().getContentAsString();
        String createBody = create(owner, newStaff("sara"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String updateRes = update(owner, owner.getId(), updateBody(owner, "OWNER", true))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        for (String body : List.of(listBody, createBody, updateRes)) {
            assertThat(body).doesNotContain("passwordHash").doesNotContain("password").doesNotContain("$2");
        }
    }

    private void insertRefreshToken(StaffUser u, String hash) {
        jdbc.update(
                "insert into refresh_token (subject_type, subject_id, token_hash, expires_at) values ('STAFF', ?, ?, ?)",
                u.getId(),
                hash,
                java.sql.Timestamp.from(Instant.parse("2027-01-01T00:00:00Z")));
    }
}
