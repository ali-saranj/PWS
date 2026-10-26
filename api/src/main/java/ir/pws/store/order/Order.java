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
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 32)
    private String orderNumber;

    @Column(name = "tracking_code", nullable = false, unique = true, length = 16)
    private String trackingCode;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(nullable = false, length = 100)
    private String province;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "address_line", nullable = false, columnDefinition = "TEXT")
    private String addressLine;

    @Column(name = "postal_code", nullable = false, length = 10)
    private String postalCode;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(name = "recipient_mobile", nullable = false, length = 11)
    private String recipientMobile;

    @Column(name = "shipping_method_id")
    private Long shippingMethodId;

    @Column(name = "shipping_name", nullable = false, length = 100)
    private String shippingName;

    @Column(name = "shipping_cost", nullable = false)
    private long shippingCost;

    @Column(nullable = false)
    private long subtotal;

    @Column(name = "discount_total", nullable = false)
    private long discountTotal;

    @Column(nullable = false)
    private long total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(name = "courier_notes", columnDefinition = "TEXT")
    private String courierNotes;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "needs_attention", nullable = false)
    private boolean needsAttention;

    @Column(name = "placed_at", nullable = false)
    private Instant placedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Order() {}

    public Order(String orderNumber, String trackingCode, Long customerId,
                 String province, String city, String addressLine, String postalCode,
                 String recipientName, String recipientMobile,
                 Long shippingMethodId, String shippingName, long shippingCost,
                 long subtotal, long discountTotal, long total,
                 OrderStatus status, String courierNotes, String adminNotes,
                 boolean needsAttention, Instant placedAt, Instant paidAt) {
        this.orderNumber = orderNumber;
        this.trackingCode = trackingCode;
        this.customerId = customerId;
        this.province = province;
        this.city = city;
        this.addressLine = addressLine;
        this.postalCode = postalCode;
        this.recipientName = recipientName;
        this.recipientMobile = recipientMobile;
        this.shippingMethodId = shippingMethodId;
        this.shippingName = shippingName;
        this.shippingCost = shippingCost;
        this.subtotal = subtotal;
        this.discountTotal = discountTotal;
        this.total = total;
        this.status = status;
        this.courierNotes = courierNotes;
        this.adminNotes = adminNotes;
        this.needsAttention = needsAttention;
        this.placedAt = placedAt != null ? placedAt : Instant.now();
        this.paidAt = paidAt;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (placedAt == null) {
            placedAt = now;
        }
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

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getTrackingCode() {
        return trackingCode;
    }

    public void setTrackingCode(String trackingCode) {
        this.trackingCode = trackingCode;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientMobile() {
        return recipientMobile;
    }

    public void setRecipientMobile(String recipientMobile) {
        this.recipientMobile = recipientMobile;
    }

    public Long getShippingMethodId() {
        return shippingMethodId;
    }

    public void setShippingMethodId(Long shippingMethodId) {
        this.shippingMethodId = shippingMethodId;
    }

    public String getShippingName() {
        return shippingName;
    }

    public void setShippingName(String shippingName) {
        this.shippingName = shippingName;
    }

    public long getShippingCost() {
        return shippingCost;
    }

    public void setShippingCost(long shippingCost) {
        this.shippingCost = shippingCost;
    }

    public long getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(long subtotal) {
        this.subtotal = subtotal;
    }

    public long getDiscountTotal() {
        return discountTotal;
    }

    public void setDiscountTotal(long discountTotal) {
        this.discountTotal = discountTotal;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getCourierNotes() {
        return courierNotes;
    }

    public void setCourierNotes(String courierNotes) {
        this.courierNotes = courierNotes;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public boolean isNeedsAttention() {
        return needsAttention;
    }

    public void setNeedsAttention(boolean needsAttention) {
        this.needsAttention = needsAttention;
    }

    public Instant getPlacedAt() {
        return placedAt;
    }

    public void setPlacedAt(Instant placedAt) {
        this.placedAt = placedAt;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
