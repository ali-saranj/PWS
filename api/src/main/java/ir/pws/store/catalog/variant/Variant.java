package ir.pws.store.catalog.variant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import org.hibernate.annotations.OptimisticLock;

@Entity
@Table(name = "variant")
public class Variant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private long version;

    @Column(name = "product_id", nullable = false, updatable = false)
    private long productId;

    @Column(nullable = false, length = 64, unique = true)
    private String sku;

    @Column(name = "flavour_fa", length = 100)
    private String flavourFa;

    @Column(name = "flavour_en", length = 100)
    private String flavourEn;

    @Column(name = "size_label", length = 50)
    private String sizeLabel;

    @Column(name = "weight_grams")
    private Integer weightGrams;

    @Column(name = "base_price", nullable = false)
    private long basePrice;

    @Column(name = "compare_at_price")
    private Long compareAtPrice;

    /** Guarded by the pessimistic lock in StockLedger, so stock changes do not bump the optimistic version. */
    @OptimisticLock(excluded = true)
    @Column(name = "stock_on_hand", nullable = false)
    private int stockOnHand;

    @Column(name = "low_stock_threshold", nullable = false)
    private int lowStockThreshold;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OptimisticLock(excluded = true)
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Variant() {}

    public Variant(long productId, VariantContent c) {
        this.productId = productId;
        update(c);
    }

    /** Editable fields (stock is changed only through the stock ledger). */
    public void update(VariantContent c) {
        this.sku = c.sku();
        this.flavourFa = c.flavourFa();
        this.flavourEn = c.flavourEn();
        this.sizeLabel = c.sizeLabel();
        this.weightGrams = c.weightGrams();
        this.basePrice = c.basePrice();
        this.compareAtPrice = c.compareAtPrice();
        this.lowStockThreshold = c.lowStockThreshold();
        this.active = c.active();
        this.sortOrder = c.sortOrder();
    }

    public record VariantContent(
            String sku,
            String flavourFa,
            String flavourEn,
            String sizeLabel,
            Integer weightGrams,
            long basePrice,
            Long compareAtPrice,
            int lowStockThreshold,
            boolean active,
            int sortOrder) {}

    /** Called by StockLedger only. */
    public void setStockOnHand(int stockOnHand) {
        this.stockOnHand = stockOnHand;
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
    public long getVersion() { return version; }
    public long getProductId() { return productId; }
    public String getSku() { return sku; }
    public String getFlavourFa() { return flavourFa; }
    public String getFlavourEn() { return flavourEn; }
    public String getSizeLabel() { return sizeLabel; }
    public Integer getWeightGrams() { return weightGrams; }
    public long getBasePrice() { return basePrice; }
    public Long getCompareAtPrice() { return compareAtPrice; }
    public int getStockOnHand() { return stockOnHand; }
    public int getLowStockThreshold() { return lowStockThreshold; }
    public boolean isActive() { return active; }
    public int getSortOrder() { return sortOrder; }
}
