package ir.pws.store.order;

import ir.pws.store.catalog.inventory.StockLedger;
import ir.pws.store.catalog.inventory.StockMovementReason;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.product.ProductStatus;
import ir.pws.store.catalog.variant.TierDto;
import ir.pws.store.catalog.variant.TierPricing;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.catalog.variant.VolumeTier;
import ir.pws.store.catalog.variant.VolumeTierRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.MobileNumbers;
import ir.pws.store.config.AppProperties;
import ir.pws.store.customer.Address;
import ir.pws.store.customer.AddressRepository;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.notification.SmsSender;
import ir.pws.store.notification.SmsTemplate;
import ir.pws.store.order.dto.CheckoutRequest;
import ir.pws.store.order.dto.CheckoutResponse;
import ir.pws.store.order.dto.OrderTrackingResponse;
import ir.pws.store.order.dto.PaymentCallbackResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);
    private static final String TRACKING_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final ShippingMethodRepository shippingMethodRepository;
    private final StockReservationRepository stockReservationRepository;
    private final VariantRepository variantRepository;
    private final VolumeTierRepository volumeTierRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final StockLedger stockLedger;
    private final ZarinpalClient zarinpalClient;
    private final SmsSender smsSender;
    private final AppProperties props;
    private final Clock clock;

    public CheckoutService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatusHistoryRepository statusHistoryRepository,
            PaymentRepository paymentRepository,
            ShippingMethodRepository shippingMethodRepository,
            StockReservationRepository stockReservationRepository,
            VariantRepository variantRepository,
            VolumeTierRepository volumeTierRepository,
            ProductRepository productRepository,
            CustomerRepository customerRepository,
            AddressRepository addressRepository,
            StockLedger stockLedger,
            ZarinpalClient zarinpalClient,
            SmsSender smsSender,
            AppProperties props,
            Clock clock) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.paymentRepository = paymentRepository;
        this.shippingMethodRepository = shippingMethodRepository;
        this.stockReservationRepository = stockReservationRepository;
        this.variantRepository = variantRepository;
        this.volumeTierRepository = volumeTierRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.stockLedger = stockLedger;
        this.zarinpalClient = zarinpalClient;
        this.smsSender = smsSender;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public CheckoutResponse checkout(long customerId, CheckoutRequest req) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        if (customer.isBlocked()) {
            throw new ApiException(ErrorCode.ACCOUNT_BLOCKED);
        }

        Address address = addressRepository.findById(req.addressId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!address.getCustomerId().equals(customerId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        ShippingMethod shippingMethod = shippingMethodRepository.findById(req.shippingMethodId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!shippingMethod.isActive()) {
            throw ApiException.field("shippingMethodId", "SHIPPING_METHOD_INACTIVE");
        }

        // Aggregate requested quantities per variant
        Map<Long, Integer> requestedQuantities = new LinkedHashMap<>();
        for (CheckoutRequest.CheckoutItemRequest item : req.items()) {
            requestedQuantities.merge(item.variantId(), item.qty(), Integer::sum);
        }

        List<Long> orderedVariantIds = new ArrayList<>(requestedQuantities.keySet());
        orderedVariantIds.sort(Long::compareTo);

        // Lock all variants ordered to prevent deadlocks
        List<Variant> variants = variantRepository.lockAllByIdOrdered(orderedVariantIds);
        if (variants.size() != orderedVariantIds.size()) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        Map<Long, Variant> variantMap = variants.stream()
                .collect(Collectors.toMap(Variant::getId, Function.identity()));

        Instant now = clock.instant();

        // Check active and stock availability
        for (Map.Entry<Long, Integer> entry : requestedQuantities.entrySet()) {
            Long variantId = entry.getKey();
            int qty = entry.getValue();
            Variant v = variantMap.get(variantId);
            if (!v.isActive()) {
                throw new ApiException(ErrorCode.OUT_OF_STOCK);
            }
            Product p = productRepository.findById(v.getProductId())
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
            if (p.getStatus() != ProductStatus.ACTIVE) {
                throw new ApiException(ErrorCode.OUT_OF_STOCK);
            }
            int activeReserved = stockReservationRepository.sumActiveReservedQty(variantId, now);
            int availableStock = v.getStockOnHand() - activeReserved;
            if (availableStock < qty) {
                throw new ApiException(ErrorCode.OUT_OF_STOCK);
            }
        }

        // Calculate pricing
        long subtotal = 0;
        long discountTotal = 0;

        record PreparedItem(
                Variant variant,
                Product product,
                int qty,
                long unitPrice,
                long lineTotal) {}

        List<PreparedItem> preparedItems = new ArrayList<>();

        for (CheckoutRequest.CheckoutItemRequest reqItem : req.items()) {
            Variant v = variantMap.get(reqItem.variantId());
            Product p = productRepository.findById(v.getProductId()).orElseThrow();
            List<VolumeTier> tiers = volumeTierRepository.findByVariantIdOrderByMinQtyAsc(v.getId());
            List<TierDto> tierDtos = tiers.stream()
                    .map(t -> new TierDto(t.getMinQty(), t.getUnitPrice()))
                    .toList();

            long unitPrice = TierPricing.unitPrice(v.getBasePrice(), tierDtos, reqItem.qty());
            long lineTotal = unitPrice * reqItem.qty();
            subtotal += lineTotal;
            discountTotal += (v.getBasePrice() - unitPrice) * reqItem.qty();

            preparedItems.add(new PreparedItem(v, p, reqItem.qty(), unitPrice, lineTotal));
        }

        // Calculate shipping
        long shippingCost = (shippingMethod.getFreeOver() != null && subtotal >= shippingMethod.getFreeOver())
                ? 0L
                : shippingMethod.getCost();
        long total = subtotal + shippingCost;

        String orderNumber = generateOrderNumber(now);
        String trackingCode = generateTrackingCode();

        Order order = new Order(
                orderNumber,
                trackingCode,
                customerId,
                address.getProvince(),
                address.getCity(),
                address.getLine(),
                address.getPostalCode(),
                address.getRecipientName(),
                address.getRecipientMobile(),
                shippingMethod.getId(),
                shippingMethod.getNameFa(),
                shippingCost,
                subtotal,
                discountTotal,
                total,
                OrderStatus.PENDING_PAYMENT,
                req.customerNote(),
                null,
                false,
                now,
                null
        );
        order = orderRepository.save(order);

        // Save order items & stock reservations
        Instant expiresAt = now.plus(Duration.ofMinutes(15));
        for (PreparedItem item : preparedItems) {
            String variantLabelFa = buildVariantLabelFa(item.variant());
            String variantLabelEn = buildVariantLabelEn(item.variant());

            OrderItem orderItem = new OrderItem(
                    order.getId(),
                    item.variant().getId(),
                    item.product().getNameFa(),
                    item.product().getNameEn(),
                    variantLabelFa,
                    variantLabelEn,
                    item.variant().getSku(),
                    item.unitPrice(),
                    item.qty(),
                    item.lineTotal()
            );
            orderItemRepository.save(orderItem);

            StockReservation reservation = new StockReservation(
                    item.variant().getId(),
                    customerId,
                    item.qty(),
                    StockReservationStatus.ACTIVE,
                    expiresAt,
                    order.getId()
            );
            stockReservationRepository.save(reservation);
        }

        statusHistoryRepository.save(new OrderStatusHistory(
                order.getId(),
                null,
                OrderStatus.PENDING_PAYMENT,
                ActorType.CUSTOMER,
                customerId,
                "ثبت سفارش"
        ));

        // Call Zarinpal gateway
        String description = "پرداخت سفارش " + order.getOrderNumber();
        String callbackUrl = props.zarinpal().callbackUrl();
        ZarinpalClient.PaymentRequestResult paymentRequest = zarinpalClient.requestPayment(
                total,
                description,
                customer.getMobile(),
                callbackUrl
        );

        Payment payment = new Payment(
                order.getId(),
                "ZARINPAL",
                total,
                paymentRequest.authority(),
                PaymentStatus.INITIATED,
                null,
                null,
                null,
                null
        );
        paymentRepository.save(payment);

        return new CheckoutResponse(
                order.getOrderNumber(),
                order.getTrackingCode(),
                paymentRequest.paymentUrl(),
                paymentRequest.authority()
        );
    }

    @Transactional
    public PaymentCallbackResponse handlePaymentCallback(String authority, String status) {
        Payment payment = paymentRepository.findByAuthority(authority)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        Order order = orderRepository.findById(payment.getOrderId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        // Idempotency: if already paid, return success immediately
        if (payment.getStatus() == PaymentStatus.PAID) {
            return new PaymentCallbackResponse(true, order.getTrackingCode(), order.getOrderNumber(), payment.getRefId());
        }

        if (!"OK".equalsIgnoreCase(status)) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return new PaymentCallbackResponse(false, order.getTrackingCode(), order.getOrderNumber(), null);
        }

        ZarinpalClient.PaymentVerifyResult verifyResult = zarinpalClient.verifyPayment(payment.getAmount(), authority);
        if (!verifyResult.success()) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setRawResponse(verifyResult.message());
            paymentRepository.save(payment);
            return new PaymentCallbackResponse(false, order.getTrackingCode(), order.getOrderNumber(), null);
        }

        // Payment success
        payment.setStatus(PaymentStatus.PAID);
        payment.setRefId(verifyResult.refId());
        payment.setCardPanMasked(verifyResult.cardPanMasked());
        paymentRepository.save(payment);

        OrderStatus fromStatus = order.getStatus();
        order.setStatus(OrderStatus.AWAITING_APPROVAL);
        order.setPaidAt(clock.instant());
        orderRepository.save(order);

        // Transition reservations to CONSUMED
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(order.getId());
        for (StockReservation res : reservations) {
            res.setStatus(StockReservationStatus.CONSUMED);
        }
        stockReservationRepository.saveAll(reservations);

        // Deduct variant stock on hand via StockLedger and record StockMovement
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            Variant v = variantRepository.findById(item.getVariantId()).orElseThrow();
            stockLedger.apply(v, -item.getQty(), StockMovementReason.ORDER_PAID, order.getId(), "سفارش " + order.getOrderNumber());
        }

        statusHistoryRepository.save(new OrderStatusHistory(
                order.getId(),
                fromStatus,
                OrderStatus.AWAITING_APPROVAL,
                ActorType.CUSTOMER,
                order.getCustomerId(),
                "پرداخت موفق"
        ));

        // Enqueue or send order payment SMS
        try {
            smsSender.send(order.getRecipientMobile(), SmsTemplate.ORDER_PAID, List.of(order.getOrderNumber(), order.getTrackingCode()));
        } catch (Exception e) {
            log.warn("Failed to send order paid SMS for order {}", order.getOrderNumber(), e);
        }

        return new PaymentCallbackResponse(true, order.getTrackingCode(), order.getOrderNumber(), verifyResult.refId());
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponse getPublicOrderTracking(String trackingCode) {
        Order order = orderRepository.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderStatusHistory> history = statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());

        List<OrderTrackingResponse.OrderItemTrackDto> itemDtos = items.stream()
                .map(i -> new OrderTrackingResponse.OrderItemTrackDto(
                        i.getProductNameFa(),
                        i.getProductNameEn(),
                        i.getVariantLabelFa(),
                        i.getVariantLabelEn(),
                        i.getQty()
                ))
                .toList();

        List<OrderTrackingResponse.OrderStatusHistoryTrackDto> timeline = history.stream()
                .map(h -> new OrderTrackingResponse.OrderStatusHistoryTrackDto(
                        h.getToStatus(),
                        h.getCreatedAt(),
                        h.getNote()
                ))
                .toList();

        return new OrderTrackingResponse(
                order.getTrackingCode(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getPlacedAt(),
                order.getPaidAt(),
                maskName(order.getRecipientName()),
                MobileNumbers.mask(order.getRecipientMobile()),
                order.getProvince(),
                order.getCity(),
                itemDtos,
                timeline,
                order.getCourierNotes()
        );
    }

    private String generateOrderNumber(Instant now) {
        String datePart = DateTimeFormatter.ofPattern("yyMMdd")
                .withZone(ZoneOffset.UTC)
                .format(now);
        for (int i = 0; i < 10; i++) {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 10000);
            String candidate = "PWS-" + datePart + "-" + randomNum;
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Failed to generate unique order number");
    }

    private String generateTrackingCode() {
        for (int i = 0; i < 10; i++) {
            StringBuilder sb = new StringBuilder("TRK-");
            for (int j = 0; j < 8; j++) {
                sb.append(TRACKING_CHARS.charAt(ThreadLocalRandom.current().nextInt(TRACKING_CHARS.length())));
            }
            String candidate = sb.toString();
            if (!orderRepository.existsByTrackingCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Failed to generate unique tracking code");
    }

    private String buildVariantLabelFa(Variant v) {
        if (v.getFlavourFa() != null && !v.getFlavourFa().isBlank() && v.getSizeLabel() != null && !v.getSizeLabel().isBlank()) {
            return v.getFlavourFa() + " - " + v.getSizeLabel();
        } else if (v.getFlavourFa() != null && !v.getFlavourFa().isBlank()) {
            return v.getFlavourFa();
        } else if (v.getSizeLabel() != null && !v.getSizeLabel().isBlank()) {
            return v.getSizeLabel();
        }
        return v.getSku();
    }

    private String buildVariantLabelEn(Variant v) {
        if (v.getFlavourEn() != null && !v.getFlavourEn().isBlank() && v.getSizeLabel() != null && !v.getSizeLabel().isBlank()) {
            return v.getFlavourEn() + " - " + v.getSizeLabel();
        } else if (v.getFlavourEn() != null && !v.getFlavourEn().isBlank()) {
            return v.getFlavourEn();
        } else if (v.getSizeLabel() != null && !v.getSizeLabel().isBlank()) {
            return v.getSizeLabel();
        }
        return v.getSku();
    }

    private static String maskName(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(' ');
            String part = parts[i];
            if (part.length() <= 1) {
                sb.append(part).append("*");
            } else {
                sb.append(part.charAt(0)).append("***");
            }
        }
        return sb.toString();
    }
}
