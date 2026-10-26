package ir.pws.store.order;

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
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(nullable = false, length = 20)
    private String gateway;

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false, unique = true, length = 64)
    private String authority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.INITIATED;

    @Column(name = "ref_id", length = 64)
    private String refId;

    @Column(name = "card_pan_masked", length = 32)
    private String cardPanMasked;

    @Column(name = "raw_request", columnDefinition = "TEXT")
    private String rawRequest;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Payment() {}

    public Payment(Long orderId, String gateway, long amount, String authority,
                   PaymentStatus status, String refId, String cardPanMasked,
                   String rawRequest, String rawResponse) {
        this.orderId = orderId;
        this.gateway = gateway;
        this.amount = amount;
        this.authority = authority;
        this.status = status;
        this.refId = refId;
        this.cardPanMasked = cardPanMasked;
        this.rawRequest = rawRequest;
        this.rawResponse = rawResponse;
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

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public long getAmount() {
        return amount;
    }

    public void setAmount(long amount) {
        this.amount = amount;
    }

    public String getAuthority() {
        return authority;
    }

    public void setAuthority(String authority) {
        this.authority = authority;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getRefId() {
        return refId;
    }

    public void setRefId(String refId) {
        this.refId = refId;
    }

    public String getCardPanMasked() {
        return cardPanMasked;
    }

    public void setCardPanMasked(String cardPanMasked) {
        this.cardPanMasked = cardPanMasked;
    }

    public String getRawRequest() {
        return rawRequest;
    }

    public void setRawRequest(String rawRequest) {
        this.rawRequest = rawRequest;
    }

    public String getRawResponse() {
        return rawResponse;
    }

    public void setRawResponse(String rawResponse) {
        this.rawResponse = rawResponse;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
