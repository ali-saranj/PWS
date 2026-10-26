package ir.pws.store.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ir.pws.store.catalog.brand.Brand;
import ir.pws.store.catalog.brand.BrandRepository;
import ir.pws.store.catalog.category.Category;
import ir.pws.store.catalog.category.CategoryRepository;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.product.ProductStatus;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.support.IntegrationTest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;

class OrderModelIntegrationTest extends IntegrationTest {

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
    private CustomerRepository customerRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VariantRepository variantRepository;

    private Customer customer;
    private Variant variant;
    private ShippingMethod shippingMethod;

    @BeforeEach
    void setUpTestData() {
        customer = customerRepository.save(new Customer("09123456789", "Ali", "Rezai"));

        Brand brand = brandRepository.save(new Brand("برند الف", "Brand A", "brand-a", true));
        Category category = categoryRepository.save(new Category(null, "دسته الف", "Cat A", "cat-a", 0, true));
        Product product = new Product(new Product.ProductContent(
                brand.getId(), category.getId(), "whey-protein", "پروتئین وی", "Whey Protein",
                "desc", "توضیح", false, null, null, null, null
        ));
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        variant = new Variant(product.getId(), new Variant.VariantContent(
                "SKU-WHEY-1", "وانیلی", "Vanilla", "2kg", 2000, 10_000_000L, 12_000_000L, 5, true, 0
        ));
        variant.setStockOnHand(10);
        variant = variantRepository.save(variant);

        shippingMethod = shippingMethodRepository.findAll().stream().findFirst().orElseGet(() ->
                shippingMethodRepository.save(new ShippingMethod(
                        "ارسال اکسپرس با پیک شهری",
                        "Express Courier",
                        "تحویل سریع با پیک شهری",
                        "Fast city courier delivery",
                        450_000L,
                        5_000_000L,
                        true,
                        0
                ))
        );
    }

    @Test
    @DisplayName("Persist order with items, shipping method, status history, and payment")
    void persistOrderGraph() {
        Order order = new Order(
                "PWS-050805-0001",
                "TRK-8K2N9F1X",
                customer.getId(),
                "Tehran",
                "Tehran",
                "Valiasr St, No 12",
                "1234567890",
                "Ali Rezai",
                "09123456789",
                shippingMethod.getId(),
                shippingMethod.getNameFa(),
                shippingMethod.getCost(),
                20_000_000L,
                0L,
                20_450_000L,
                OrderStatus.PENDING_PAYMENT,
                "Leave at door",
                null,
                false,
                Instant.now(),
                null
        );
        Order savedOrder = orderRepository.save(order);
        assertThat(savedOrder.getId()).isNotNull();

        OrderItem item = new OrderItem(
                savedOrder.getId(),
                variant.getId(),
                "پروتئین وی",
                "Whey Protein",
                "وانیلی - 2kg",
                "Vanilla - 2kg",
                variant.getSku(),
                10_000_000L,
                2,
                20_000_000L
        );
        OrderItem savedItem = orderItemRepository.save(item);
        assertThat(savedItem.getId()).isNotNull();

        OrderStatusHistory history = new OrderStatusHistory(
                savedOrder.getId(),
                null,
                OrderStatus.PENDING_PAYMENT,
                ActorType.CUSTOMER,
                customer.getId(),
                "Order created by customer"
        );
        OrderStatusHistory savedHistory = statusHistoryRepository.save(history);
        assertThat(savedHistory.getId()).isNotNull();

        Payment payment = new Payment(
                savedOrder.getId(),
                "ZARINPAL",
                20_450_000L,
                "AUTH-123456789",
                PaymentStatus.INITIATED,
                null,
                null,
                "{\"amount\": 20450000}",
                null
        );
        Payment savedPayment = paymentRepository.save(payment);
        assertThat(savedPayment.getId()).isNotNull();

        // Query checks
        assertThat(orderRepository.findByOrderNumber("PWS-050805-0001")).isPresent();
        assertThat(orderRepository.findByTrackingCode("TRK-8K2N9F1X")).isPresent();
        var customerOrders = orderRepository.findByCustomerIdOrderByPlacedAtDesc(customer.getId(), PageRequest.of(0, 10));
        assertThat(customerOrders.getContent()).hasSize(1);
        assertThat(paymentRepository.findByAuthority("AUTH-123456789")).isPresent();
    }

    @Test
    @DisplayName("Validate unique constraints on order_number, tracking_code, and payment authority")
    void validateUniqueConstraints() {
        Order order1 = new Order(
                "PWS-050805-0001",
                "TRK-UNIQUE-1",
                customer.getId(),
                "Tehran",
                "Tehran",
                "Address 1",
                "1234567890",
                "Ali Rezai",
                "09123456789",
                shippingMethod.getId(),
                shippingMethod.getNameFa(),
                0L,
                10_000_000L,
                0L,
                10_000_000L,
                OrderStatus.PENDING_PAYMENT,
                null,
                null,
                false,
                Instant.now(),
                null
        );
        orderRepository.saveAndFlush(order1);

        // Duplicate order_number
        Order dupOrderNumber = new Order(
                "PWS-050805-0001",
                "TRK-UNIQUE-2",
                customer.getId(),
                "Tehran",
                "Tehran",
                "Address 2",
                "1234567890",
                "Ali Rezai",
                "09123456789",
                shippingMethod.getId(),
                shippingMethod.getNameFa(),
                0L,
                10_000_000L,
                0L,
                10_000_000L,
                OrderStatus.PENDING_PAYMENT,
                null,
                null,
                false,
                Instant.now(),
                null
        );
        assertThatThrownBy(() -> orderRepository.saveAndFlush(dupOrderNumber))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Duplicate tracking_code
        Order dupTrackingCode = new Order(
                "PWS-050805-0002",
                "TRK-UNIQUE-1",
                customer.getId(),
                "Tehran",
                "Tehran",
                "Address 3",
                "1234567890",
                "Ali Rezai",
                "09123456789",
                shippingMethod.getId(),
                shippingMethod.getNameFa(),
                0L,
                10_000_000L,
                0L,
                10_000_000L,
                OrderStatus.PENDING_PAYMENT,
                null,
                null,
                false,
                Instant.now(),
                null
        );
        assertThatThrownBy(() -> orderRepository.saveAndFlush(dupTrackingCode))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Duplicate payment authority
        Payment p1 = new Payment(
                order1.getId(),
                "ZARINPAL",
                10_000_000L,
                "AUTH-DUP-TEST",
                PaymentStatus.INITIATED,
                null,
                null,
                null,
                null
        );
        paymentRepository.saveAndFlush(p1);

        Payment p2 = new Payment(
                order1.getId(),
                "ZARINPAL",
                10_000_000L,
                "AUTH-DUP-TEST",
                PaymentStatus.INITIATED,
                null,
                null,
                null,
                null
        );
        assertThatThrownBy(() -> paymentRepository.saveAndFlush(p2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Test StockReservation queries and available stock calculation")
    void stockReservationCalculations() {
        Instant now = Instant.now();

        // 1. Active reservation (qty: 3, expires in 15 mins)
        StockReservation r1 = new StockReservation(
                variant.getId(),
                customer.getId(),
                3,
                StockReservationStatus.ACTIVE,
                now.plus(15, ChronoUnit.MINUTES),
                null
        );
        stockReservationRepository.save(r1);

        // 2. Another active reservation (qty: 2, expires in 5 mins)
        StockReservation r2 = new StockReservation(
                variant.getId(),
                customer.getId(),
                2,
                StockReservationStatus.ACTIVE,
                now.plus(5, ChronoUnit.MINUTES),
                null
        );
        stockReservationRepository.save(r2);

        // 3. Expired reservation (expires in the past, qty: 4)
        StockReservation rExpired = new StockReservation(
                variant.getId(),
                customer.getId(),
                4,
                StockReservationStatus.ACTIVE,
                now.minus(1, ChronoUnit.MINUTES),
                null
        );
        stockReservationRepository.save(rExpired);

        // 4. Consumed reservation (status: CONSUMED, qty: 5)
        StockReservation rConsumed = new StockReservation(
                variant.getId(),
                customer.getId(),
                5,
                StockReservationStatus.CONSUMED,
                now.plus(10, ChronoUnit.MINUTES),
                null
        );
        stockReservationRepository.save(rConsumed);

        // 5. Released reservation (status: RELEASED, qty: 1)
        StockReservation rReleased = new StockReservation(
                variant.getId(),
                customer.getId(),
                1,
                StockReservationStatus.RELEASED,
                now.plus(10, ChronoUnit.MINUTES),
                null
        );
        stockReservationRepository.save(rReleased);

        int activeReserved = stockReservationRepository.sumActiveReservedQty(variant.getId(), now);
        // Only r1 (3) + r2 (2) = 5 should be counted!
        assertThat(activeReserved).isEqualTo(5);

        // Variant stock_on_hand is 10, so available = 10 - 5 = 5
        int stockOnHand = variant.getStockOnHand();
        int availableStock = stockOnHand - activeReserved;
        assertThat(availableStock).isEqualTo(5);
    }
}
