package ir.pws.store.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.notification.LoggingSmsSender;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

class AuditTest extends IntegrationTest {

    @Autowired
    AdminAuth adminAuth;

    @Autowired
    AuditService audit;

    @Autowired
    LoggingSmsSender sms;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    record Named(String name, int price) {}

    private void postJson(String path, Map<String, String> body) throws Exception {
        mvc.perform(post(path)
                        .with(adminAuth.csrfOnly())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andReturn();
    }

    @Test
    void loginSuccess_isAudited() throws Exception {
        StaffUser user = adminAuth.createStaff(StaffRole.OWNER);
        sms.clear();
        var login = mvc.perform(post("/api/admin/auth/login")
                        .with(adminAuth.csrfOnly())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(
                                Map.of("username", user.getUsername(), "password", AdminAuth.PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        String challenge = json.readTree(login.getResponse().getContentAsString())
                .get("challenge")
                .asText();
        List<LoggingSmsSender.SentSms> sent = sms.sent();
        String code = sent.get(sent.size() - 1).tokens().get(0);
        postJson("/api/admin/auth/verify", Map.of("challenge", challenge, "code", code));

        List<Map<String, Object>> rows =
                jdbc.queryForList("select staff_user_id, action, entity_type, entity_id from audit_log");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0))
                .containsEntry("staff_user_id", user.getId())
                .containsEntry("action", "STAFF_LOGIN")
                .containsEntry("entity_type", "STAFF_USER")
                .containsEntry("entity_id", user.getId());
    }

    @Test
    void failedPassword_isAudited() throws Exception {
        StaffUser user = adminAuth.createStaff(StaffRole.OWNER);
        postJson("/api/admin/auth/login", Map.of("username", user.getUsername(), "password", "Wrong-password-1"));
        postJson("/api/admin/auth/login", Map.of("username", "nobody", "password", "Wrong-password-1"));

        List<Map<String, Object>> rows = jdbc.queryForList("select staff_user_id, action from audit_log");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0))
                .containsEntry("staff_user_id", user.getId())
                .containsEntry("action", "STAFF_LOGIN_FAILED");
    }

    @Test
    void list_isOwnerOnly() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);
        mvc.perform(get("/api/admin/audit").with(adminAuth.staff(pm))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/audit")).andExpect(status().isUnauthorized());
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(get("/api/admin/audit").with(adminAuth.staff(owner))).andExpect(status().isOk());
    }

    @Test
    void list_filtersByEntityType_newestFirst() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        audit.recordFor(owner.getId(), "A1", "PRODUCT", 1L, null, null);
        audit.recordFor(owner.getId(), "B1", "CATEGORY", 2L, null, null);
        audit.recordFor(owner.getId(), "A2", "PRODUCT", 1L, null, null);

        mvc.perform(get("/api/admin/audit?entityType=PRODUCT").with(adminAuth.staff(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items[0].action").value("A2"))
                .andExpect(jsonPath("$.items[1].action").value("A1"))
                .andExpect(jsonPath("$.items[0].staffUsername").value(owner.getUsername()));
        mvc.perform(get("/api/admin/audit?staffUserId=" + owner.getId() + "&size=2").with(adminAuth.staff(owner)))
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.items.length()").value(2));
    }

    @Test
    void beforeAndAfter_areJsonObjects() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        audit.recordFor(owner.getId(), "UPDATE", "PRODUCT", 5L, new Named("old", 1), new Named("new", 2));

        mvc.perform(get("/api/admin/audit").with(adminAuth.staff(owner)))
                .andExpect(jsonPath("$.items[0].after.name").value("new"))
                .andExpect(jsonPath("$.items[0].after.price").value(2))
                .andExpect(jsonPath("$.items[0].before.name").value("old"));
    }

    @Test
    void record_stripsTopLevelSecrets() throws Exception {
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        audit.recordFor(
                owner.getId(), "CREATE", "STAFF_USER", 1L, null, Map.of("username", "x", "password", "p", "passwordHash", "h"));

        mvc.perform(get("/api/admin/audit").with(adminAuth.staff(owner)))
                .andExpect(jsonPath("$.items[0].after.username").value("x"))
                .andExpect(jsonPath("$.items[0].after.password").doesNotExist())
                .andExpect(jsonPath("$.items[0].after.passwordHash").doesNotExist());
    }
}
