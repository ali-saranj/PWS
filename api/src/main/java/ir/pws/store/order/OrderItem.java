package ir.pws.store.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "order_item")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, updatable = false)
    private Long orderId;

    @Column(name = "variant_id", nullable = false, updatable = false)
    private Long variantId;

    @Column(name = "product_name_fa", nullable = false, length = 200)
    private String productNameFa;

    @Column(name = "product_name_en", length = 200)
    private String productNameEn;

    @Column(name = "variant_label_fa", nullable = false, length = 100)
    private String variantLabelFa;

    @Column(name = "variant_label_en", length = 100)
    private String variantLabelEn;

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(name = "unit_price", nullable = false)
    private long unitPrice;

    @Column(nullable = false)
    private int qty;

    @Column(name = "line_total", nullable = false)
    private long lineTotal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected OrderItem() {}

    public OrderItem(Long orderId, Long variantId,
                     String productNameFa, String productNameEn,
                     String variantLabelFa, String variantLabelEn,
                     String sku, long unitPrice, int qty, long lineTotal) {
        this.orderId = orderId;
        this.variantId = variantId;
        this.productNameFa = productNameFa;
        this.productNameEn = productNameEn;
        this.variantLabelFa = variantLabelFa;
        this.variantLabelEn = variantLabelEn;
        this.sku = sku;
        this.unitPrice = unitPrice;
        this.qty = qty;
        this.lineTotal = lineTotal;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public String getProductNameFa() {
        return productNameFa;
    }

    public void setProductNameFa(String productNameFa) {
        this.productNameFa = productNameFa;
    }

    public String getProductNameEn() {
        return productNameEn;
    }

    public void setProductNameEn(String productNameEn) {
        this.productNameEn = productNameEn;
    }

    public String getVariantLabelFa() {
        return variantLabelFa;
    }

    public void setVariantLabelFa(String variantLabelFa) {
        this.variantLabelFa = variantLabelFa;
    }

    public String getVariantLabelEn() {
        return variantLabelEn;
    }

    public void setVariantLabelEn(String variantLabelEn) {
        this.variantLabelEn = variantLabelEn;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public long getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(long unitPrice) {
        this.unitPrice = unitPrice;
    }

    public int getQty() {
        return qty;
    }

    public void setQty(int qty) {
        this.qty = qty;
    }

    public long getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(long lineTotal) {
        this.lineTotal = lineTotal;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
