package ir.pws.store.catalog.product;

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
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private long version;

    @Column(name = "brand_id", nullable = false)
    private long brandId;

    @Column(name = "category_id", nullable = false)
    private long categoryId;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(name = "name_fa", nullable = false, length = 200)
    private String nameFa;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(name = "description_fa")
    private String descriptionFa;

    @Column(name = "description_en")
    private String descriptionEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status = ProductStatus.DRAFT;

    @Column(nullable = false)
    private boolean featured;

    @Column(name = "seo_title_fa", length = 70)
    private String seoTitleFa;

    @Column(name = "seo_title_en", length = 70)
    private String seoTitleEn;

    @Column(name = "seo_description_fa", length = 160)
    private String seoDescriptionFa;

    @Column(name = "seo_description_en", length = 160)
    private String seoDescriptionEn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {}

    public Product(ProductContent c) {
        update(c);
    }

    /** Editable fields (status is not editable here). */
    public void update(ProductContent c) {
        this.brandId = c.brandId();
        this.categoryId = c.categoryId();
        this.slug = c.slug();
        this.nameFa = c.nameFa();
        this.nameEn = c.nameEn();
        this.descriptionFa = c.descriptionFa();
        this.descriptionEn = c.descriptionEn();
        this.featured = c.featured();
        this.seoTitleFa = c.seoTitleFa();
        this.seoTitleEn = c.seoTitleEn();
        this.seoDescriptionFa = c.seoDescriptionFa();
        this.seoDescriptionEn = c.seoDescriptionEn();
    }

    /** Normalised, sanitised values ready to be stored. */
    public record ProductContent(
            long brandId,
            long categoryId,
            String slug,
            String nameFa,
            String nameEn,
            String descriptionFa,
            String descriptionEn,
            boolean featured,
            String seoTitleFa,
            String seoTitleEn,
            String seoDescriptionFa,
            String seoDescriptionEn) {}

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
    public long getBrandId() { return brandId; }
    public long getCategoryId() { return categoryId; }
    public String getSlug() { return slug; }
    public String getNameFa() { return nameFa; }
    public String getNameEn() { return nameEn; }
    public String getDescriptionFa() { return descriptionFa; }
    public String getDescriptionEn() { return descriptionEn; }
    public ProductStatus getStatus() { return status; }
    public boolean isFeatured() { return featured; }
    public String getSeoTitleFa() { return seoTitleFa; }
    public String getSeoTitleEn() { return seoTitleEn; }
    public String getSeoDescriptionFa() { return seoDescriptionFa; }
    public String getSeoDescriptionEn() { return seoDescriptionEn; }
    public Instant getUpdatedAt() { return updatedAt; }
}
