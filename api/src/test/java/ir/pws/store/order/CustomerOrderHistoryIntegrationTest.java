package ir.pws.store.order;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ir.pws.store.catalog.brand.Brand;
import ir.pws.store.catalog.brand.BrandRepository;
import ir.pws.store.catalog.category.Category;
import ir.pws.store.catalog.category.CategoryRepository;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.product.ProductStatus;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class CustomerOrderHistoryIntegrationTest extends IntegrationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

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
    private ShippingMethodRepository shippingMethodRepository;

    @Autowired
    private JwtService jwtService;

    private ShippingMethod shippingMethod;

    private Cookie createAuthCookie(Customer customer) {
        String token = jwtService.generateCustomerAccessToken(customer.getId(), customer.getMobile());
        return new Cookie(AuthCookies.CUSTOMER_ACCESS, token);
    }

    @BeforeEach
    void setUpShipping() {
        shippingMethod = shippingMethodRepository.save(new ShippingMethod(
                "ارسال فوری", "Express", "ارسال روزانه", "Daily", 500_000L, null, true, 1
        ));
    }

    @Test
    @DisplayName("Authenticated customer retrieves orders: completed orders present, pending payment excluded, Toman & Jalali calculated")
    void listOrders_authenticated_returnsCustomerOrdersWithDetailsAndExcludesPending() throws Exception {
        Customer customer = customerRepository.save(new Customer("09121112233", "سارا", "رضایی"));

        Brand brand = brandRepository.save(new Brand("آندره", "Andre", "andre", true));
        Category category = categoryRepository.save(new Category(null, "سوسیس و کالباس", "Cold Cuts", "cold-cuts", 0, true));

        Product product = new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "turkey-ham", "ژامبون بوقلمون ۹۰٪ آندره", "Turkey Ham 90%",
                "توضیحات", "Description", false, null, null, null, null
        ));
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        Variant variant = new Variant(product.getId(), new Variant.VariantContent(
                "AND-TURK-250G", "دودی", "Smoked", "۲۵۰ گرم اسلایس", 250, 1_850_000L, 2_000_000L, 5, true, 0
        ));
        variant.setStockOnHand(15);
        variant = variantRepository.save(variant);

        // Placed & Paid order
        Order order = new Order(
                "PWS-050805-0001",
                "TRK-8K2N9F1X",
                customer.getId(),
                "تهران",
                "تهران",
                "خیابان شریعتی، کوچه بهار، پلاک ۴",
                "1234567890",
                "سارا رضایی",
                "09121112233",
                shippingMethod.getId(),
                "ارسال فوری",
                500_000L,
                3_700_000L,
                0L,
                4_200_000L,
                OrderStatus.DISPATCHED,
                "تحویل به لابی برج",
                null,
                false,
                Instant.parse("2026-10-26T14:30:00Z"),
                Instant.parse("2026-10-26T14:35:00Z")
        );
        order = orderRepository.save(order);

        OrderItem item = new OrderItem(
                order.getId(),
                variant.getId(),
                "ژامبون بوقلمون ۹۰٪ آندره",
                "Turkey Ham 90%",
                "۲۵۰ گرم اسلایس",
                "250g sliced",
                "AND-TURK-250G",
                1_850_000L,
                2,
                3_700_000L
        );
        orderItemRepository.save(item);

        // Another order: PENDING_PAYMENT (must be excluded from history)
        Order pendingOrder = new Order(
                "PWS-050805-0002",
                "TRK-PENDING1",
                customer.getId(),
                "تهران",
                "تهران",
                "خیابان آزادی",
                "1234567890",
                "سارا رضایی",
                "09121112233",
                shippingMethod.getId(),
                "ارسال فوری",
                500_000L,
                1_850_000L,
                0L,
                2_350_000L,
                OrderStatus.PENDING_PAYMENT,
                null,
                null,
                false,
                Instant.parse("2026-10-26T15:00:00Z"),
                null
        );
        orderRepository.save(pendingOrder);

        mvc.perform(get("/api/shop/customer/orders")
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(order.getId()))
                .andExpect(jsonPath("$[0].orderNumber").value("PWS-050805-0001"))
                .andExpect(jsonPath("$[0].trackingCode").value("TRK-8K2N9F1X"))
                .andExpect(jsonPath("$[0].status").value("DISPATCHED"))
                .andExpect(jsonPath("$[0].statusLabelFa").value("ارسال با پیک"))
                .andExpect(jsonPath("$[0].totalAmountRials").value(4_200_000L))
                .andExpect(jsonPath("$[0].totalAmountToman").value(420_000L))
                .andExpect(jsonPath("$[0].shippingFeeRials").value(500_000L))
                .andExpect(jsonPath("$[0].shippingFeeToman").value(50_000L))
                .andExpect(jsonPath("$[0].recipientName").value("سارا رضایی"))
                .andExpect(jsonPath("$[0].recipientMobile").value("09121112233"))
                .andExpect(jsonPath("$[0].courierNotes").value("تحویل به لابی برج"))
                .andExpect(jsonPath("$[0].createdAtJalali", notNullValue()))
                .andExpect(jsonPath("$[0].items", hasSize(1)))
                .andExpect(jsonPath("$[0].items[0].variantId").value(variant.getId()))
                .andExpect(jsonPath("$[0].items[0].productId").value(product.getId()))
                .andExpect(jsonPath("$[0].items[0].productTitle").value("ژامبون بوقلمون ۹۰٪ آندره"))
                .andExpect(jsonPath("$[0].items[0].portionLabel").value("۲۵۰ گرم اسلایس"))
                .andExpect(jsonPath("$[0].items[0].sku").value("AND-TURK-250G"))
                .andExpect(jsonPath("$[0].items[0].quantity").value(2))
                .andExpect(jsonPath("$[0].items[0].unitPriceRials").value(1_850_000L))
                .andExpect(jsonPath("$[0].items[0].unitPriceToman").value(185_000L))
                .andExpect(jsonPath("$[0].items[0].totalPriceToman").value(370_000L));
    }

    @Test
    @DisplayName("Unauthenticated request to list orders returns 401")
    void listOrders_unauthenticated_returns401() throws Exception {
        mvc.perform(get("/api/shop/customer/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Order isolation: customer cannot view or re-order other customer's order")
    void orderIsolation_customerCannotAccessOtherCustomerOrder() throws Exception {
        Customer customerA = customerRepository.save(new Customer("09120000001", "کاربر", "یک"));
        Customer customerB = customerRepository.save(new Customer("09120000002", "کاربر", "دو"));

        Order orderB = orderRepository.save(new Order(
                "PWS-050805-0003",
                "TRK-CUSTB-01",
                customerB.getId(),
                "تهران",
                "تهران",
                "خیابان انقلاب",
                "1111111111",
                "کاربر دو",
                "09120000002",
                shippingMethod.getId(),
                "ارسال فوری",
                500_000L,
                1_000_000L,
                0L,
                1_500_000L,
                OrderStatus.DELIVERED,
                null,
                null,
                false,
                Instant.now(),
                Instant.now()
        ));

        // Customer A listings should NOT contain Customer B's order
        mvc.perform(get("/api/shop/customer/orders")
                        .cookie(createAuthCookie(customerA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Customer A trying to re-order Customer B's order should return 404
        mvc.perform(post("/api/shop/customer/orders/" + orderB.getId() + "/reorder")
                        .cookie(createAuthCookie(customerA))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("1-Click Re-order validates current active status and stock")
    void reorder_validatesLivePricingAndAvailability() throws Exception {
        Customer customer = customerRepository.save(new Customer("09123334455", "مریم", "کریمی"));

        Brand brand = brandRepository.save(new Brand("میکائیلیان", "Mikaelian", "mikaelian", true));
        Category category = categoryRepository.save(new Category(null, "سوسیس", "Sausages", "sausages", 0, true));

        // Product 1: Available & price updated
        Product product1 = productRepository.save(new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "cocktail-sausage", "سوسیس کوکتل دودی", "Cocktail",
                "desc", "desc", false, null, null, null, null
        )));
        product1.setStatus(ProductStatus.ACTIVE);
        product1 = productRepository.save(product1);

        Variant variant1 = new Variant(product1.getId(), new Variant.VariantContent(
                "COCKTAIL-500G", "دودی", "Smoked", "۵۰۰ گرم", 500, 2_000_000L, 2_200_000L, 5, true, 0
        ));
        variant1.setStockOnHand(10); // in stock
        variant1 = variantRepository.save(variant1);

        // Product 2: Out of stock
        Product product2 = productRepository.save(new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "dry-salami", "سالامی خشک ممتاز", "Salami",
                "desc", "desc", false, null, null, null, null
        )));
        product2.setStatus(ProductStatus.ACTIVE);
        product2 = productRepository.save(product2);

        Variant variant2 = new Variant(product2.getId(), new Variant.VariantContent(
                "SALAMI-300G", "تند", "Spicy", "۳۰۰ گرم", 300, 1_500_000L, null, 5, true, 0
        ));
        variant2.setStockOnHand(0); // out of stock
        variant2 = variantRepository.save(variant2);

        // Previous order had both items
        Order pastOrder = orderRepository.save(new Order(
                "PWS-050805-0004",
                "TRK-PAST-004",
                customer.getId(),
                "تهران",
                "تهران",
                "خیابان میرداماد",
                "1234567890",
                "مریم کریمی",
                "09123334455",
                shippingMethod.getId(),
                "ارسال فوری",
                500_000L,
                3_000_000L,
                0L,
                3_500_000L,
                OrderStatus.DELIVERED,
                null,
                null,
                false,
                Instant.now(),
                Instant.now()
        ));

        // Past unit price for item 1 was 1_000_000 Rials (100,000 Toman), but live base price is now 2_000_000 Rials (200,000 Toman)
        OrderItem item1 = orderItemRepository.save(new OrderItem(
                pastOrder.getId(),
                variant1.getId(),
                "سوسیس کوکتل دودی",
                "Cocktail",
                "۵۰۰ گرم",
                "500g",
                "COCKTAIL-500G",
                1_000_000L,
                3,
                3_000_000L
        ));

        OrderItem item2 = orderItemRepository.save(new OrderItem(
                pastOrder.getId(),
                variant2.getId(),
                "سالامی خشک ممتاز",
                "Salami",
                "۳۰۰ گرم",
                "300g",
                "SALAMI-300G",
                1_500_000L,
                1,
                1_500_000L
        ));

        mvc.perform(post("/api/shop/customer/orders/" + pastOrder.getId() + "/reorder")
                        .cookie(createAuthCookie(customer))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.addedItems", hasSize(1)))
                .andExpect(jsonPath("$.addedItems[0].variantId").value(variant1.getId()))
                .andExpect(jsonPath("$.addedItems[0].productId").value(product1.getId()))
                .andExpect(jsonPath("$.addedItems[0].title").value("سوسیس کوکتل دودی"))
                .andExpect(jsonPath("$.addedItems[0].portionLabel").value("۵۰۰ گرم"))
                .andExpect(jsonPath("$.addedItems[0].sku").value("COCKTAIL-500G"))
                .andExpect(jsonPath("$.addedItems[0].unitPriceToman").value(200_000L)) // Live price 2_000_000 / 10
                .andExpect(jsonPath("$.addedItems[0].quantity").value(3))
                .andExpect(jsonPath("$.addedItems[0].maxStock").value(10))
                .andExpect(jsonPath("$.unavailableItems", hasSize(1)))
                .andExpect(jsonPath("$.unavailableItems[0]").value("سالامی خشک ممتاز"));
    }

    @Test
    @DisplayName("Unauthenticated request to reorder returns 401")
    void reorder_unauthenticated_returns401() throws Exception {
        mvc.perform(post("/api/shop/customer/orders/999/reorder")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
