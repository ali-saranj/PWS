package ir.pws.store.catalog.inventory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "stock_movement")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variant_id", nullable = false, updatable = false)
    private long variantId;

    @Column(nullable = false, updatable = false)
    private int delta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private StockMovementReason reason;

    @Column(name = "ref_id", updatable = false)
    private Long refId;

    @Column(name = "staff_user_id", updatable = false)
    private Long staffUserId;

    @Column(length = 500, updatable = false)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StockMovement() {}

    public StockMovement(long variantId, int delta, StockMovementReason reason, Long refId, Long staffUserId,
            String note) {
        this.variantId = variantId;
        this.delta = delta;
        this.reason = reason;
        this.refId = refId;
        this.staffUserId = staffUserId;
        this.note = note;
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

    public Long getId() { return id; }
    public long getVariantId() { return variantId; }
    public int getDelta() { return delta; }
    public StockMovementReason getReason() { return reason; }
    public Long getRefId() { return refId; }
    public Long getStaffUserId() { return staffUserId; }
    public String getNote() { return note; }
    public Instant getCreatedAt() { return createdAt; }
}
