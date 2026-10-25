package ir.pws.store.catalog.image;

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
@Table(name = "product_image")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, updatable = false)
    private long productId;

    /** Stem, e.g. {@code products/12/<uuid>}; files are {@code <stem>-1600.webp} and {@code <stem>-400.webp}. */
    @Column(nullable = false, length = 255, updatable = false)
    private String path;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "alt_fa", length = 200)
    private String altFa;

    @Column(name = "alt_en", length = 200)
    private String altEn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductImage() {}

    public ProductImage(long productId, String path, int sortOrder) {
        this.productId = productId;
        this.path = path;
        this.sortOrder = sortOrder;
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

    public void setAlt(String altFa, String altEn) {
        this.altFa = altFa;
        this.altEn = altEn;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public long getProductId() {
        return productId;
    }

    public String getPath() {
        return path;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public String getAltFa() {
        return altFa;
    }

    public String getAltEn() {
        return altEn;
    }

    String largePath() {
        return path + "-1600.webp";
    }

    String thumbPath() {
        return path + "-400.webp";
    }
}
