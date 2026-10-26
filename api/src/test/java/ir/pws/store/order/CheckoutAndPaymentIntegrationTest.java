package ir.pws.store.order;

import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
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
import ir.pws.store.catalog.variant.VolumeTier;
import ir.pws.store.catalog.variant.VolumeTierRepository;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.customer.Address;
import ir.pws.store.customer.AddressRepository;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MvcResult;

class CheckoutAndPaymentIntegrationTest extends IntegrationTest {

    private static final WireMockServer wireMockServer =
            new WireMockServer(WireMockConfiguration.options().dynamicPort());

    static {
        wireMockServer.start();
    }

    @AfterAll
    static void stopWireMock() {
        if (wireMockServer != null) {
            wireMockServer.stop();
        }
    }

    @DynamicPropertySource
    static void zarinpalProperties(DynamicPropertyRegistry registry) {
        registry.add("app.zarinpal.base-url", () -> "http://localhost:" + wireMockServer.port() + "/pg/v4/payment");
    }

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
    private StockReservationRepository stockReservationRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VariantRepository variantRepository;

    @Autowired
    private VolumeTierRepository volumeTierRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ReservationExpiryJob reservationExpiryJob;

    @Autowired
    private ObjectMapper json;

    private Customer customer;
    private Address address;
    private Variant variant;
    private ShippingMethod shippingMethod;
    private Cookie customerAuthCookie;

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();

        customer = customerRepository.save(new Customer("09123456789", "علی", "رضایی"));
        address = addressRepository.save(new Address(
                customer.getId(),
                "تهران",
                "تهران",
                "خیابان ولیعصر، کوچه فیروز، پلاک ۱",
                "1234567890",
                "علی رضایی",
                "09123456789",
                true
        ));

        Brand brand = brandRepository.save(new Brand("برند الف", "Brand A", "brand-a", true));
        Category category = categoryRepository.save(new Category(null, "دسته الف", "Cat A", "cat-a", 0, true));
        Product product = new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "whey-gold", "پروتئین وی گلد", "Whey Gold",
                "توضیحات", "Description", false, null, null, null, null
        ));
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        variant = new Variant(product.getId(), new Variant.VariantContent(
                "SKU-WHEY-GOLD-1", "شکلاتی", "Chocolate", "2kg", 2000, 10_000_000L, 12_000_000L, 5, true, 0
        ));
        variant.setStockOnHand(10);
        variant = variantRepository.save(variant);

        // Volume tier: buy 2 or more -> 9_500_000 each
        volumeTierRepository.save(new VolumeTier(variant.getId(), 2, 9_500_000L));

        shippingMethod = shippingMethodRepository.findAll().stream().findFirst().orElseGet(() ->
                shippingMethodRepository.save(new ShippingMethod(
                        "ارسال اکسپرس با پیک شهری",
                        "Express Courier",
                        "تحویل سریع با پیک شهری",
                        "Fast city courier delivery",
                        450_000L,
                        25_000_000L,
                        true,
                        0
                ))
        );

        String token = jwtService.customerAccessToken(customer);
        customerAuthCookie = new Cookie(AuthCookies.CUSTOMER_ACCESS, token);
    }

    @Test
    @DisplayName("Complete checkout flow: reserves stock, calculates tier pricing & shipping, calls Zarinpal, returns authority")
    void checkout_createsOrder_reservesStock_andCallsZarinpal() throws Exception {
        wireMockServer.stubFor(WireMock.post(urlEqualTo("/pg/v4/payment/request.json"))
                .willReturn(okJson("""
                        {
                          "data": {
                            "code": 100,
                            "message": "Success",
                            "authority": "A00000000000000000000000000123456789",
                            "fee_type": "Merchant",
                            "fee": 0
                          },
                          "errors": []
                        }
                        """)));

        // Qty 2 -> applies tier price 9_500_000L. Subtotal = 19_000_000L.
        // Subtotal < 25_000_000 free_over -> shipping = 450_000L. Total = 19_450_000L.
        var checkoutPayload = Map.of(
                "items", List.of(Map.of("variantId", variant.getId(), "qty", 2)),
                "addressId", address.getId(),
                "shippingMethodId", shippingMethod.getId(),
                "customerNote", "لطفا قبل از ارسال تماس بگیرید"
        );

        MvcResult result = mvc.perform(post("/api/shop/checkout")
                        .cookie(customerAuthCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(checkoutPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.trackingCode").isNotEmpty())
                .andExpect(jsonPath("$.authority").value("A00000000000000000000000000123456789"))
                .andExpect(jsonPath("$.paymentUrl").isNotEmpty())
                .andReturn();

        String orderNumber = json.readTree(result.getResponse().getContentAsString()).path("orderNumber").asText();
        String trackingCode = json.readTree(result.getResponse().getContentAsString()).path("trackingCode").asText();

        assertThat(orderNumber).startsWith("PWS-");
        assertThat(trackingCode).startsWith("TRK-");

        // Verify Order in DB
        Order order = orderRepository.findByOrderNumber(orderNumber).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        assertThat(order.getCustomerId()).isEqualTo(customer.getId());
        assertThat(order.getSubtotal()).isEqualTo(19_000_000L);
        assertThat(order.getDiscountTotal()).isEqualTo(1_000_000L); // 2 * (10M - 9.5M)
        assertThat(order.getShippingCost()).isEqualTo(450_000L);
        assertThat(order.getTotal()).isEqualTo(19_450_000L);
        assertThat(order.getCourierNotes()).isEqualTo("لطفا قبل از ارسال تماس بگیرید");
        assertThat(order.getProvince()).isEqualTo("تهران");
        assertThat(order.getCity()).isEqualTo("تهران");

        // Verify OrderItem
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        assertThat(items).hasSize(1);
        OrderItem item = items.get(0);
        assertThat(item.getVariantId()).isEqualTo(variant.getId());
        assertThat(item.getQty()).isEqualTo(2);
        assertThat(item.getUnitPrice()).isEqualTo(9_500_000L);
        assertThat(item.getLineTotal()).isEqualTo(19_000_000L);

        // Verify StockReservation
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(order.getId());
        assertThat(reservations).hasSize(1);
        StockReservation reservation = reservations.get(0);
        assertThat(reservation.getVariantId()).isEqualTo(variant.getId());
        assertThat(reservation.getQty()).isEqualTo(2);
        assertThat(reservation.getStatus()).isEqualTo(StockReservationStatus.ACTIVE);
        assertThat(reservation.getExpiresAt()).isAfter(clock.instant());

        // Verify available stock calculation: stockOnHand is 10, but 2 are reserved -> 8 available
        int reservedQty = stockReservationRepository.sumActiveReservedQty(variant.getId(), clock.instant());
        assertThat(reservedQty).isEqualTo(2);

        // Verify Payment record
        Payment payment = paymentRepository.findByAuthority("A00000000000000000000000000123456789").orElseThrow();
        assertThat(payment.getOrderId()).isEqualTo(order.getId());
        assertThat(payment.getGateway()).isEqualTo("ZARINPAL");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.INITIATED);
        assertThat(payment.getAmount()).isEqualTo(19_450_000L);

        // Verify WireMock request payload
        wireMockServer.verify(postRequestedFor(urlEqualTo("/pg/v4/payment/request.json"))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("19450000")))
                .withRequestBody(matchingJsonPath("$.metadata.mobile", equalTo("09123456789"))));
    }

    @Test
    @DisplayName("Payment callback success: verifies with Zarinpal, marks PAID, transitions order to AWAITING_APPROVAL, deducts stock, consumes reservations")
    void paymentCallback_success_deductsStock_marksConsumed_andTransitionsOrderToAwaitingApproval() throws Exception {
        checkout_createsOrder_reservesStock_andCallsZarinpal();

        wireMockServer.stubFor(WireMock.post(urlEqualTo("/pg/v4/payment/verify.json"))
                .willReturn(okJson("""
                        {
                          "data": {
                            "code": 100,
                            "message": "Paid",
                            "card_pan": "502229******1234",
                            "ref_id": 987654321,
                            "fee_type": "Merchant",
                            "fee": 0
                          },
                          "errors": []
                        }
                        """)));

        mvc.perform(get("/api/shop/payments/zarinpal/callback")
                        .param("Authority", "A00000000000000000000000000123456789")
                        .param("Status", "OK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.refId").value("987654321"))
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.trackingCode").isNotEmpty());

        // Verify Payment is PAID
        Payment payment = paymentRepository.findByAuthority("A00000000000000000000000000123456789").orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getRefId()).isEqualTo("987654321");
        assertThat(payment.getCardPanMasked()).isEqualTo("502229******1234");

        // Verify Order status is AWAITING_APPROVAL
        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.AWAITING_APPROVAL);
        assertThat(order.getPaidAt()).isNotNull();

        // Verify StockReservation is CONSUMED
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(order.getId());
        assertThat(reservations).allMatch(r -> r.getStatus() == StockReservationStatus.CONSUMED);

        // Verify Variant stockOnHand was decremented from 10 to 8
        Variant updatedVariant = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockOnHand()).isEqualTo(8);

        // Verify StockMovement SALE / ORDER_PAID entry
        List<StockMovement> movements = stockMovementRepository.findAll();
        assertThat(movements).anySatisfy(m -> {
            assertThat(m.getVariantId()).isEqualTo(variant.getId());
            assertThat(m.getDelta()).isEqualTo(-2);
            assertThat(m.getReason()).isEqualTo(StockMovementReason.ORDER_PAID);
            assertThat(m.getRefId()).isEqualTo(order.getId());
        });

        // Verify OrderStatusHistory
        List<OrderStatusHistory> history = statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        assertThat(history).anySatisfy(h -> {
            assertThat(h.getToStatus()).isEqualTo(OrderStatus.AWAITING_APPROVAL);
            assertThat(h.getActorType()).isEqualTo(ActorType.CUSTOMER);
            assertThat(h.getNote()).contains("پرداخت موفق");
        });
    }

    @Test
    @DisplayName("Duplicate callback call is idempotent and does not deduct stock twice")
    void paymentCallback_duplicateCall_isIdempotent_doesNotDecrementStockTwice() throws Exception {
        paymentCallback_success_deductsStock_marksConsumed_andTransitionsOrderToAwaitingApproval();

        // Second callback call for same authority
        mvc.perform(get("/api/shop/payments/zarinpal/callback")
                        .param("Authority", "A00000000000000000000000000123456789")
                        .param("Status", "OK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.refId").value("987654321"));

        // Stock must still be 8
        Variant updatedVariant = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockOnHand()).isEqualTo(8);

        // Only 1 ORDER_PAID movement for this order
        Payment payment = paymentRepository.findByAuthority("A00000000000000000000000000123456789").orElseThrow();
        long paidMovements = stockMovementRepository.findAll().stream()
                .filter(m -> m.getRefId() != null && m.getRefId().equals(payment.getOrderId()))
                .count();
        assertThat(paidMovements).isEqualTo(1);
    }

    @Test
    @DisplayName("Callback with Status=NOK marks payment FAILED without deducting stock or cancelling order prematurely")
    void paymentCallback_nok_marksPaymentFailed_orderRemainsPending() throws Exception {
        checkout_createsOrder_reservesStock_andCallsZarinpal();

        mvc.perform(get("/api/shop/payments/zarinpal/callback")
                        .param("Authority", "A00000000000000000000000000123456789")
                        .param("Status", "NOK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));

        Payment payment = paymentRepository.findByAuthority("A00000000000000000000000000123456789").orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);

        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);

        Variant v = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(v.getStockOnHand()).isEqualTo(10);
    }

    @Test
    @DisplayName("Public tracking endpoint returns masked, safe order status without authentication")
    void trackOrder_publicEndpoint_returnsSafeDtoWithTimelineAndItems() throws Exception {
        paymentCallback_success_deductsStock_marksConsumed_andTransitionsOrderToAwaitingApproval();

        Order order = orderRepository.findAll().get(0);

        // Anonymous GET (no cookies)
        mvc.perform(get("/api/shop/orders/track/" + order.getTrackingCode()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value(order.getTrackingCode()))
                .andExpect(jsonPath("$.orderNumber").value(order.getOrderNumber()))
                .andExpect(jsonPath("$.status").value("AWAITING_APPROVAL"))
                .andExpect(jsonPath("$.recipientMobileMasked").value("0912***6789"))
                .andExpect(jsonPath("$.recipientNameMasked").isNotEmpty())
                .andExpect(jsonPath("$.province").value("تهران"))
                .andExpect(jsonPath("$.city").value("تهران"))
                .andExpect(jsonPath("$.items[0].productNameFa").value("پروتئین وی گلد"))
                .andExpect(jsonPath("$.items[0].qty").value(2))
                .andExpect(jsonPath("$.timeline").isArray())
                .andExpect(jsonPath("$.courierNotes").value("لطفا قبل از ارسال تماس بگیرید"));
    }

    @Test
    @DisplayName("Checkout rejects with 409 OUT_OF_STOCK when available stock (stockOnHand - reserved) is insufficient")
    void checkout_insufficientStock_throws409OutOfStock() throws Exception {
        // Variant has stockOnHand = 10. Reserve 9 of them.
        stockReservationRepository.save(new StockReservation(
                variant.getId(), customer.getId(), 9,
                StockReservationStatus.ACTIVE, clock.instant().plus(Duration.ofMinutes(15)), null
        ));

        // Attempting to buy 2 will fail because available is 1
        var checkoutPayload = Map.of(
                "items", List.of(Map.of("variantId", variant.getId(), "qty", 2)),
                "addressId", address.getId(),
                "shippingMethodId", shippingMethod.getId()
        );

        mvc.perform(post("/api/shop/checkout")
                        .cookie(customerAuthCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(checkoutPayload)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("OUT_OF_STOCK"));
    }

    @Test
    @DisplayName("Reservation expiry job releases expired reservations and cancels orders older than 30 mins still pending")
    void reservationExpiryJob_expiresOldReservations_andCancelsOrdersOlderThan30Mins() throws Exception {
        checkout_createsOrder_reservesStock_andCallsZarinpal();

        Order order = orderRepository.findAll().get(0);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);

        // Advance 16 minutes (reservations expire after 15 minutes)
        clock.advance(Duration.ofMinutes(16));

        reservationExpiryJob.releaseExpiredReservations();

        // Stock reservation must be EXPIRED
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(order.getId());
        assertThat(reservations).allMatch(r -> r.getStatus() == StockReservationStatus.EXPIRED);

        // Order is only 16 minutes old -> NOT cancelled yet (threshold is 30 mins)
        Order stillPendingOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(stillPendingOrder.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);

        // Advance another 15 minutes (total 31 minutes > 30 minutes)
        clock.advance(Duration.ofMinutes(15));

        reservationExpiryJob.releaseExpiredReservations();

        Order cancelledOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(cancelledOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);

        // History shows cancellation by SYSTEM
        List<OrderStatusHistory> history = statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        assertThat(history).anySatisfy(h -> {
            assertThat(h.getToStatus()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(h.getActorType()).isEqualTo(ActorType.SYSTEM);
        });
    }
}
