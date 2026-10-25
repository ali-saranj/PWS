package ir.pws.store.catalog.category;

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
@Table(name = "category")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_fa", nullable = false, length = 200)
    private String nameFa;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Category() {}

    public Category(Long parentId, String nameFa, String nameEn, String slug, int sortOrder, boolean active) {
        update(parentId, nameFa, nameEn, slug, sortOrder, active);
    }

    public void update(Long parentId, String nameFa, String nameEn, String slug, int sortOrder, boolean active) {
        this.parentId = parentId;
        this.nameFa = nameFa;
        this.nameEn = nameEn;
        this.slug = slug;
        this.sortOrder = sortOrder;
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

    public Long getParentId() {
        return parentId;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public boolean isActive() {
        return active;
    }
}
