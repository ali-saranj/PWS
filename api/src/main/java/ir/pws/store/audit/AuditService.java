package ir.pws.store.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ir.pws.store.common.security.StaffPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Writes audit rows. Joins the caller's transaction (default propagation) so an audit row is rolled back together
 * with the business change it describes.
 */
@Service
public class AuditService {

    private final AuditEntryRepository entries;
    private final ObjectMapper json;

    public AuditService(AuditEntryRepository entries, ObjectMapper json) {
        this.entries = entries;
        this.json = json;
    }

    /** Records an action by the staff member in the current {@code SecurityContext} (null when there is none). */
    @Transactional
    public void record(String action, String entityType, Long entityId, Object before, Object after) {
        recordFor(currentStaffId(), action, entityType, entityId, before, after);
    }

    /** Records an action for an explicit staff member (login events, where no authentication exists yet). */
    @Transactional
    public void recordFor(Long staffId, String action, String entityType, Long entityId, Object before, Object after) {
        entries.save(new AuditEntry(
                staffId, action, entityType, entityId, toJson(before), toJson(after), currentIp()));
    }

    /** Serialises with the app mapper and defensively drops top-level secret fields. */
    private JsonNode toJson(Object value) {
        if (value == null) {
            return null;
        }
        JsonNode node = json.valueToTree(value);
        if (node instanceof ObjectNode object) {
            object.remove("password");
            object.remove("passwordHash");
        }
        return node;
    }

    private static Long currentStaffId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof StaffPrincipal p ? p.id() : null;
    }

    private static String currentIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest request = attrs.getRequest();
            return request.getRemoteAddr();
        }
        return null;
    }
}
