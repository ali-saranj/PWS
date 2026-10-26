package ir.pws.store.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.audit.AuditEntry;
import ir.pws.store.audit.AuditEntryRepository;
import ir.pws.store.catalog.brand.Brand;
import ir.pws.store.catalog.brand.BrandRepository;
import ir.pws.store.catalog.category.Category;
import ir.pws.store.catalog.category.CategoryRepository;
import ir.pws.store.catalog.inventory.StockMovement;
import ir.pws.store.catalog.inventory.StockMovementReason;
import ir.pws.store.catalog.inventory.StockMovementRepository;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.product.ProductStatus;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.notification.LoggingSmsSender;
import ir.pws.store.notification.SmsTemplate;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class AdminOrderIntegrationTest extends IntegrationTest {

    @Autowired
    private AdminAuth adminAuth;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ShippingMethodRepository shippingMethodRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VariantRepository variantRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private AuditEntryRepository auditEntryRepository;

    @Autowired
    private LoggingSmsSender smsSender;

    private Customer customer;
    private Variant variant;
    private ShippingMethod shippingMethod;

    @BeforeEach
    void setUpTestData() {
        smsSender.clear();

        customer = customerRepository.save(new Customer("09121112233", "Reza", "Mohammadi"));

        Brand brand = brandRepository.save(new Brand("برند اصلی", "Main Brand", "main-brand", true));
        Category category = categoryRepository.save(new Category(null, "مکمل", "Supplements", "supplements", 0, true));
        Product product = new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "creatine-monohydrate", "کراتین مونوهیدرات", "Creatine Monohydrate",
                "desc", "توضیح", false, null, null, null, null
        ));
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        variant = new Variant(product.getId(), new Variant.VariantContent(
                "SKU-CREATINE-300G", "ساده", "Plain", "300g", 300, 5_000_000L, 6_000_000L, 5, true, 0
        ));
        variant.setStockOnHand(20);
        variant = variantRepository.save(variant);

        shippingMethod = shippingMethodRepository.findAll().stream().findFirst().orElseGet(() ->
                shippingMethodRepository.save(new ShippingMethod(
                        "ارسال اکسپرس پیک",
                        "Express Courier",
                        "تحویل سریع با پیک شهری",
                        "Fast courier delivery",
                        500_000L,
                        10_000_000L,
                        true,
                        0
                ))
        );
    }

    private Order createOrder(String orderNum, String trackCode, OrderStatus status, int itemQty) {
        Order order = new Order(
                orderNum,
                trackCode,
                customer.getId(),
                "تهران",
                "تهران",
                "خیابان آزادی، کوچه پنجم، پلاک ۱۰",
                "1234567890",
                "رضا محمدی",
                "09121112233",
                shippingMethod.getId(),
                shippingMethod.getNameFa(),
                shippingMethod.getCost(),
                variant.getBasePrice() * itemQty,
                0L,
                variant.getBasePrice() * itemQty + shippingMethod.getCost(),
                status,
                null,
                null,
                false,
                Instant.now(),
                status != OrderStatus.PENDING_PAYMENT ? Instant.now() : null
        );
        order = orderRepository.save(order);

        OrderItem item = new OrderItem(
                order.getId(),
                variant.getId(),
                "کراتین مونوهیدرات",
                "Creatine Monohydrate",
                "ساده",
                "Plain",
                variant.getSku(),
                variant.getBasePrice(),
                itemQty,
                variant.getBasePrice() * itemQty
        );
        orderItemRepository.save(item);

        statusHistoryRepository.save(new OrderStatusHistory(
                order.getId(),
                null,
                status,
                ActorType.CUSTOMER,
                customer.getId(),
                "Initial creation"
        ));

        return order;
    }

    @Test
    @DisplayName("List orders with status filter returns filtered page")
    void listOrders_withStatusFilter_returnsFilteredPage() throws Exception {
        Order order1 = createOrder("PWS-1001", "TRK1001", OrderStatus.AWAITING_APPROVAL, 2);
        createOrder("PWS-1002", "TRK1002", OrderStatus.APPROVED, 1);

        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);

        mvc.perform(get("/api/admin/orders")
                        .param("status", "AWAITING_APPROVAL")
                        .with(adminAuth.staff(operator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(order1.getId()))
                .andExpect(jsonPath("$.items[0].orderNumber").value("PWS-1001"))
                .andExpect(jsonPath("$.items[0].trackingCode").value("TRK1001"))
                .andExpect(jsonPath("$.items[0].status").value("AWAITING_APPROVAL"))
                .andExpect(jsonPath("$.items[0].customerMobile").value("09121112233"))
                .andExpect(jsonPath("$.items[0].recipientName").value("رضا محمدی"))
                .andExpect(jsonPath("$.items[0].totalRials").value(order1.getTotal()))
                .andExpect(jsonPath("$.items[0].itemCount").value(2));
    }

    @Test
    @DisplayName("Get order detail returns full details, payment, items, and status timeline")
    void getOrderDetail_returnsFullDetailsAndTimeline() throws Exception {
        Order order = createOrder("PWS-2001", "TRK2001", OrderStatus.AWAITING_APPROVAL, 1);
        paymentRepository.save(new Payment(
                order.getId(),
                "ZARINPAL",
                order.getTotal(),
                "AUTH-2001",
                PaymentStatus.PAID,
                "REF-998877",
                "603799******1234",
                null,
                null
        ));

        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);

        mvc.perform(get("/api/admin/orders/" + order.getId())
                        .with(adminAuth.staff(operator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(order.getId()))
                .andExpect(jsonPath("$.orderNumber").value("PWS-2001"))
                .andExpect(jsonPath("$.trackingCode").value("TRK2001"))
                .andExpect(jsonPath("$.status").value("AWAITING_APPROVAL"))
                .andExpect(jsonPath("$.customer.mobile").value("09121112233"))
                .andExpect(jsonPath("$.customer.firstName").value("Reza"))
                .andExpect(jsonPath("$.deliveryAddress.recipientName").value("رضا محمدی"))
                .andExpect(jsonPath("$.deliveryAddress.recipientMobile").value("09121112233"))
                .andExpect(jsonPath("$.deliveryAddress.addressLine").value("خیابان آزادی، کوچه پنجم، پلاک ۱۰"))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].sku").value(variant.getSku()))
                .andExpect(jsonPath("$.items[0].qty").value(1))
                .andExpect(jsonPath("$.payment.gateway").value("ZARINPAL"))
                .andExpect(jsonPath("$.payment.refId").value("REF-998877"))
                .andExpect(jsonPath("$.payment.cardPanMasked").value("603799******1234"))
                .andExpect(jsonPath("$.statusHistory.length()").value(1))
                .andExpect(jsonPath("$.statusHistory[0].toStatus").value("AWAITING_APPROVAL"));
    }

    @Test
    @DisplayName("Transition AWAITING_APPROVAL -> APPROVED sends SMS and records audit entry")
    void transition_awaitingApprovalToApproved_sendsSmsAndRecordsAudit() throws Exception {
        Order order = createOrder("PWS-3001", "TRK3001", OrderStatus.AWAITING_APPROVAL, 1);
        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);

        Map<String, Object> request = Map.of(
                "targetStatus", "APPROVED",
                "note", "Approved by operator"
        );

        mvc.perform(post("/api/admin/orders/" + order.getId() + "/status")
                        .with(adminAuth.staff(operator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.APPROVED);

        List<OrderStatusHistory> history = statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        assertThat(history).hasSize(2);
        OrderStatusHistory last = history.get(history.size() - 1);
        assertThat(last.getFromStatus()).isEqualTo(OrderStatus.AWAITING_APPROVAL);
        assertThat(last.getToStatus()).isEqualTo(OrderStatus.APPROVED);
        assertThat(last.getActorType()).isEqualTo(ActorType.STAFF);
        assertThat(last.getActorId()).isEqualTo(operator.getId());
        assertThat(last.getNote()).isEqualTo("Approved by operator");

        // Verify SMS sent with ORDER_APPROVED template
        List<LoggingSmsSender.SentSms> sentSms = smsSender.sent();
        assertThat(sentSms).anySatisfy(sms -> {
            assertThat(sms.mobile()).isEqualTo("09121112233");
            assertThat(sms.template()).isEqualTo(SmsTemplate.ORDER_APPROVED);
            assertThat(sms.tokens()).contains("PWS-3001", "TRK3001");
        });

        // Verify audit log
        List<AuditEntry> auditEntries = auditEntryRepository.findAll().stream()
                .filter(a -> "ORDER".equals(a.getEntityType()) && order.getId().equals(a.getEntityId()))
                .toList();
        assertThat(auditEntries).isNotEmpty();
        assertThat(auditEntries.get(0).getStaffUserId()).isEqualTo(operator.getId());
    }

    @Test
    @DisplayName("Transition APPROVED -> PREPARING -> DISPATCHED validates courier note and sends shipped SMS")
    void transition_approvedToPreparingToDispatched_updatesCourierAndSendsSms() throws Exception {
        Order order = createOrder("PWS-4001", "TRK4001", OrderStatus.APPROVED, 1);
        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);

        // APPROVED -> PREPARING
        mvc.perform(post("/api/admin/orders/" + order.getId() + "/status")
                        .with(adminAuth.staff(operator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetStatus", "PREPARING",
                                "note", "In warehouse"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));

        // DISPATCHED without courierNotes must fail with VALIDATION_FAILED
        mvc.perform(post("/api/admin/orders/" + order.getId() + "/status")
                        .with(adminAuth.staff(operator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetStatus", "DISPATCHED",
                                "courierNotes", "   "
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        smsSender.clear();

        // DISPATCHED with courierNotes succeeds
        mvc.perform(post("/api/admin/orders/" + order.getId() + "/status")
                        .with(adminAuth.staff(operator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetStatus", "DISPATCHED",
                                "courierNotes", "تیپاکس: کد رهگیری 123456789",
                                "note", "Handed over to courier"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPATCHED"))
                .andExpect(jsonPath("$.courierNotes").value("تیپاکس: کد رهگیری 123456789"));

        List<LoggingSmsSender.SentSms> sentSms = smsSender.sent();
        assertThat(sentSms).anySatisfy(sms -> {
            assertThat(sms.mobile()).isEqualTo("09121112233");
            assertThat(sms.template()).isEqualTo(SmsTemplate.ORDER_SHIPPED);
            assertThat(sms.tokens()).contains("PWS-4001", "تیپاکس: کد رهگیری 123456789", "TRK4001");
        });
    }

    @Test
    @DisplayName("Transition to CANCELLED restocks variant inventory via StockLedger")
    void transition_toCancelled_restocksVariantInventory() throws Exception {
        Order order = createOrder("PWS-5001", "TRK5001", OrderStatus.AWAITING_APPROVAL, 3);
        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);

        int initialStock = variantRepository.findById(variant.getId()).orElseThrow().getStockOnHand();

        mvc.perform(post("/api/admin/orders/" + order.getId() + "/status")
                        .with(adminAuth.staff(operator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetStatus", "CANCELLED",
                                "note", "Customer requested cancellation"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        Variant refreshed = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(refreshed.getStockOnHand()).isEqualTo(initialStock + 3);

        List<StockMovement> movements = stockMovementRepository.findAll().stream()
                .filter(m -> m.getVariantId() == variant.getId() && m.getReason() == StockMovementReason.ORDER_CANCELLED)
                .toList();
        assertThat(movements).isNotEmpty();
        assertThat(movements.get(0).getDelta()).isEqualTo(3);
        assertThat(movements.get(0).getRefId()).isEqualTo(order.getId());
    }

    @Test
    @DisplayName("Invalid status transition is rejected with 400 INVALID_STATUS_TRANSITION")
    void invalidStatusTransition_rejectedWith400() throws Exception {
        Order order = createOrder("PWS-6001", "TRK6001", OrderStatus.AWAITING_APPROVAL, 1);
        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);

        // AWAITING_APPROVAL -> DELIVERED is not allowed
        mvc.perform(post("/api/admin/orders/" + order.getId() + "/status")
                        .with(adminAuth.staff(operator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetStatus", "DELIVERED"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Non-staff or unauthorised roles rejected with 401/403")
    void nonStaffOrUnauthorisedRoles_rejected() throws Exception {
        StaffUser pm = adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);

        // Unauthenticated -> 401
        mvc.perform(get("/api/admin/orders"))
                .andExpect(status().isUnauthorized());

        // PRODUCT_MANAGER -> 403
        mvc.perform(get("/api/admin/orders")
                        .with(adminAuth.staff(pm)))
                .andExpect(status().isForbidden());

        // ORDER_OPERATOR -> 200
        StaffUser operator = adminAuth.createStaff(StaffRole.ORDER_OPERATOR);
        mvc.perform(get("/api/admin/orders")
                        .with(adminAuth.staff(operator)))
                .andExpect(status().isOk());

        // OWNER -> 200
        StaffUser owner = adminAuth.createStaff(StaffRole.OWNER);
        mvc.perform(get("/api/admin/orders")
                        .with(adminAuth.staff(owner)))
                .andExpect(status().isOk());
    }
}
