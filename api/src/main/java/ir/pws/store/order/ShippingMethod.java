package ir.pws.store.order;

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
@Table(name = "shipping_method")
public class ShippingMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_fa", nullable = false, length = 100)
    private String nameFa;

    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    @Column(name = "description_fa", length = 255)
    private String descriptionFa;

    @Column(name = "description_en", length = 255)
    private String descriptionEn;

    @Column(nullable = false)
    private long cost;

    @Column(name = "free_over")
    private Long freeOver;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ShippingMethod() {}

    public ShippingMethod(String nameFa, String nameEn, String descriptionFa, String descriptionEn,
                          long cost, Long freeOver, boolean active, int sortOrder) {
        this.nameFa = nameFa;
        this.nameEn = nameEn;
        this.descriptionFa = descriptionFa;
        this.descriptionEn = descriptionEn;
        this.cost = cost;
        this.freeOver = freeOver;
        this.active = active;
        this.sortOrder = sortOrder;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
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

    public void setNameFa(String nameFa) {
        this.nameFa = nameFa;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getDescriptionFa() {
        return descriptionFa;
    }

    public void setDescriptionFa(String descriptionFa) {
        this.descriptionFa = descriptionFa;
    }

    public String getDescriptionEn() {
        return descriptionEn;
    }

    public void setDescriptionEn(String descriptionEn) {
        this.descriptionEn = descriptionEn;
    }

    public long getCost() {
        return cost;
    }

    public void setCost(long cost) {
        this.cost = cost;
    }

    public Long getFreeOver() {
        return freeOver;
    }

    public void setFreeOver(Long freeOver) {
        this.freeOver = freeOver;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
