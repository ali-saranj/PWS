package ir.pws.store.catalog.brand;

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
@Table(name = "brand")
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_fa", nullable = false, length = 200)
    private String nameFa;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(name = "logo_path", length = 255)
    private String logoPath;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Brand() {}

    public Brand(String nameFa, String nameEn, String slug, boolean active) {
        update(nameFa, nameEn, slug, active);
    }

    public void update(String nameFa, String nameEn, String slug, boolean active) {
        this.nameFa = nameFa;
        this.nameEn = nameEn;
        this.slug = slug;
        this.active = active;
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

    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }

    public Long getId() {
        return id;
    }

    public String getNameFa() {
        return nameFa;
    }

    public String getNameEn() {
        return nameEn;
    }

    public String getSlug() {
        return slug;
    }

    public String getLogoPath() {
        return logoPath;
    }

    public boolean isActive() {
        return active;
    }
}
