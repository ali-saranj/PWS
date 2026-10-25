package ir.pws.store.catalog.variant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "volume_tier")
public class VolumeTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variant_id", nullable = false, updatable = false)
    private long variantId;

    @Column(name = "min_qty", nullable = false)
    private int minQty;

    @Column(name = "unit_price", nullable = false)
    private long unitPrice;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected VolumeTier() {}

    public VolumeTier(long variantId, int minQty, long unitPrice) {
        this.variantId = variantId;
        this.minQty = minQty;
        this.unitPrice = unitPrice;
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

    public long getVariantId() { return variantId; }
    public int getMinQty() { return minQty; }
    public long getUnitPrice() { return unitPrice; }
}
