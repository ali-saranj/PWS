package ir.pws.store.audit;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "audit_log")
public class AuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_user_id")
    private Long staffUserId;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before", columnDefinition = "jsonb")
    private JsonNode before;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after", columnDefinition = "jsonb")
    private JsonNode after;

    @Column(length = 45)
    private String ip;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AuditEntry() {}

    public AuditEntry(
            Long staffUserId,
            String action,
            String entityType,
            Long entityId,
            JsonNode before,
            JsonNode after,
            String ip) {
        this.staffUserId = staffUserId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.before = before;
        this.after = after;
        this.ip = ip;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getStaffUserId() {
        return staffUserId;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public JsonNode getBefore() {
        return before;
    }

    public JsonNode getAfter() {
        return after;
    }

    public String getIp() {
        return ip;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
