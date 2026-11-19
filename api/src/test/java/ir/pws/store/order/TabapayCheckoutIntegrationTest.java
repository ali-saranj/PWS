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

class TabapayCheckoutIntegrationTest extends IntegrationTest {

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
    static void tabapayProperties(DynamicPropertyRegistry registry) {
        registry.add("app.payment.active-gateway", () -> "TABAPAY");
        registry.add("app.tabapay.base-url", () -> "http://localhost:" + wireMockServer.port() + "/v1");
        registry.add("app.tabapay.merchant-id", () -> "tabapay-merchant-uuid-1234");
        registry.add("app.tabapay.sandbox", () -> "true");
        registry.add("app.tabapay.callback-url", () -> "http://localhost:8080/api/shop/payments/callback");
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
    private ObjectMapper json;

    private Customer customer;
    private Address address;
    private Variant variant;
    private ShippingMethod shippingMethod;
    private Cookie customerAuthCookie;

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();

        customer = customerRepository.save(new Customer("09129998877", "حسین", "محمدی"));
        address = addressRepository.save(new Address(
                customer.getId(),
                "اصفهان",
                "اصفهان",
                "خیابان چهارباغ، بن‌بست سوم، پلاک ۴",
                "8145678901",
                "حسین محمدی",
                "09129998877",
                true
        ));

        Brand brand = brandRepository.save(new Brand("برند ب", "Brand B", "brand-b", true));
        Category category = categoryRepository.save(new Category(null, "دسته ب", "Cat B", "cat-b", 0, true));
        Product product = new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "taba-sample", "کالای تستی تاباپی", "Tabapay Sample",
                "توضیحات", "Description", false, null, null, null, null
        ));
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        variant = new Variant(product.getId(), new Variant.VariantContent(
                "SKU-TABA-1", "ساده", "Standard", "1kg", 1000, 5_000_000L, 6_000_000L, 5, true, 0
        ));
        variant.setStockOnHand(10);
        variant = variantRepository.save(variant);

        volumeTierRepository.save(new VolumeTier(variant.getId(), 2, 4_500_000L));

        shippingMethod = shippingMethodRepository.findAll().stream().findFirst().orElseGet(() ->
                shippingMethodRepository.save(new ShippingMethod(
                        "ارسال استاندارد",
                        "Standard Shipping",
                        "تحویل پیشتاز",
                        "Express shipping",
                        200_000L,
                        20_000_000L,
                        true,
                        0
                ))
        );

        String token = jwtService.customerAccessToken(customer);
        customerAuthCookie = new Cookie(AuthCookies.CUSTOMER_ACCESS, token);
    }

    @Test
    @DisplayName("Complete checkout with active TabaPay gateway creates order and payment with TABAPAY gateway")
    void checkout_createsOrder_andInitiatesWithTabapay() throws Exception {
        wireMockServer.stubFor(WireMock.post(urlEqualTo("/v1/create"))
                .willReturn(okJson("""
                        {
                          "responseCode": 1,
                          "status": "success",
                          "token": "taba-token-uuid-001",
                          "url": "https://api.tabapay.ir/sandbox/pay/taba-token-uuid-001"
                        }
                        """)));

        var checkoutPayload = Map.of(
                "items", List.of(Map.of("variantId", variant.getId(), "qty", 2)),
                "addressId", address.getId(),
                "shippingMethodId", shippingMethod.getId(),
                "customerNote", "لطفا بسته بندی محکم باشد"
        );

        MvcResult result = mvc.perform(post("/api/shop/checkout")
                        .cookie(customerAuthCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(checkoutPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.trackingCode").isNotEmpty())
                .andExpect(jsonPath("$.authority").value("taba-token-uuid-001"))
                .andExpect(jsonPath("$.paymentUrl").value("https://api.tabapay.ir/sandbox/pay/taba-token-uuid-001"))
                .andReturn();

        String orderNumber = json.readTree(result.getResponse().getContentAsString()).path("orderNumber").asText();
        Order order = orderRepository.findByOrderNumber(orderNumber).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);

        Payment payment = paymentRepository.findByAuthority("taba-token-uuid-001").orElseThrow();
        assertThat(payment.getGateway()).isEqualTo("TABAPAY");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.INITIATED);
        assertThat(payment.getAmount()).isEqualTo(9_200_000L); // 2 * 4.5M + 200k shipping

        wireMockServer.verify(postRequestedFor(urlEqualTo("/v1/create"))
                .withHeader("Authorization", equalTo("Bearer tabapay-merchant-uuid-1234"))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("9200000")))
                .withRequestBody(matchingJsonPath("$.callbackURL", equalTo("http://localhost:8080/api/shop/payments/callback")))
                .withRequestBody(matchingJsonPath("$.mobile", equalTo("09129998877"))));
    }

    @Test
    @DisplayName("TabaPay payment callback success: verifies with TabaPay, marks PAID, deducts stock, consumes reservations")
    void paymentCallback_tabapaySuccess() throws Exception {
        checkout_createsOrder_andInitiatesWithTabapay();

        wireMockServer.stubFor(WireMock.post(urlEqualTo("/v1/verify"))
                .willReturn(okJson("""
                        {
                          "responseCode": 1,
                          "status": "success",
                          "message": "تراکنش باموفقیت تایید شد",
                          "token": "taba-token-uuid-001",
                          "shaparakRefNumber": "SHAPARAK-998877",
                          "trackingCode": 1042,
                          "amount": 9200000,
                          "cardNumber": "6037-99**-****-1234"
                        }
                        """)));

        mvc.perform(get("/api/shop/payments/callback")
                        .param("token", "taba-token-uuid-001")
                        .param("status", "success")
                        .param("responseCode", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.refId").value("SHAPARAK-998877"))
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.trackingCode").isNotEmpty());

        // Verify Payment is PAID
        Payment payment = paymentRepository.findByAuthority("taba-token-uuid-001").orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getRefId()).isEqualTo("SHAPARAK-998877");
        assertThat(payment.getCardPanMasked()).isEqualTo("6037-99**-****-1234");

        // Verify Order is AWAITING_APPROVAL
        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.AWAITING_APPROVAL);

        // Verify StockReservation is CONSUMED
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(order.getId());
        assertThat(reservations).allMatch(r -> r.getStatus() == StockReservationStatus.CONSUMED);

        // Verify stockOnHand was decremented from 10 to 8
        Variant updatedVariant = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(updatedVariant.getStockOnHand()).isEqualTo(8);

        // Verify StockMovement
        List<StockMovement> movements = stockMovementRepository.findAll();
        assertThat(movements).anySatisfy(m -> {
            assertThat(m.getVariantId()).isEqualTo(variant.getId());
            assertThat(m.getDelta()).isEqualTo(-2);
            assertThat(m.getReason()).isEqualTo(StockMovementReason.ORDER_PAID);
        });

        // Test idempotency: calling callback again does not deduct stock twice
        mvc.perform(get("/api/shop/payments/callback")
                        .param("token", "taba-token-uuid-001")
                        .param("status", "success")
                        .param("responseCode", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Variant variantAfterDuplicate = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(variantAfterDuplicate.getStockOnHand()).isEqualTo(8);
    }

    @Test
    @DisplayName("TabaPay payment callback error: marks payment FAILED without deducting stock")
    void paymentCallback_tabapayError_marksPaymentFailed() throws Exception {
        checkout_createsOrder_andInitiatesWithTabapay();

        mvc.perform(get("/api/shop/payments/callback")
                        .param("token", "taba-token-uuid-001")
                        .param("status", "error")
                        .param("responseCode", "-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));

        Payment payment = paymentRepository.findByAuthority("taba-token-uuid-001").orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);

        Order order = orderRepository.findById(payment.getOrderId()).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);

        Variant currentVariant = variantRepository.findById(variant.getId()).orElseThrow();
        assertThat(currentVariant.getStockOnHand()).isEqualTo(10);
    }
}
