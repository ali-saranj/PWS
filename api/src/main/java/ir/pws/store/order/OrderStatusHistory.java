package ir.pws.store.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, updatable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30, updatable = false)
    private OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30, updatable = false)
    private OrderStatus toStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 20, updatable = false)
    private ActorType actorType;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected OrderStatusHistory() {}

    public OrderStatusHistory(Long orderId, OrderStatus fromStatus, OrderStatus toStatus,
                              ActorType actorType, Long actorId, String note) {
        this.orderId = orderId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.actorType = actorType;
        this.actorId = actorId;
        this.note = note;
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

    public OrderStatus getFromStatus() {
        return fromStatus;
    }

    public OrderStatus getToStatus() {
        return toStatus;
    }

    public ActorType getActorType() {
        return actorType;
    }

    public Long getActorId() {
        return actorId;
    }

    public String getNote() {
        return note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
