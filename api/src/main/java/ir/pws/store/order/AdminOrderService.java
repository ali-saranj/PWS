package ir.pws.store.order;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.inventory.StockLedger;
import ir.pws.store.catalog.inventory.StockMovementReason;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.security.StaffPrincipal;
import ir.pws.store.common.web.PageResponse;
import ir.pws.store.customer.Customer;
import ir.pws.store.customer.CustomerRepository;
import ir.pws.store.customer.dto.CustomerDto;
import ir.pws.store.notification.SmsSender;
import ir.pws.store.notification.SmsTemplate;
import ir.pws.store.order.dto.AdminOrderDetailResponse;
import ir.pws.store.order.dto.AdminOrderSummaryResponse;
import ir.pws.store.order.dto.OrderStatusTransitionRequest;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOrderService {

    private static final Logger log = LoggerFactory.getLogger(AdminOrderService.class);
    private static final String ENTITY = "ORDER";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final VariantRepository variantRepository;
    private final StockLedger stockLedger;
    private final AuditService audit;
    private final SmsSender smsSender;

    public AdminOrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatusHistoryRepository statusHistoryRepository,
            PaymentRepository paymentRepository,
            CustomerRepository customerRepository,
            VariantRepository variantRepository,
            StockLedger stockLedger,
            AuditService audit,
            SmsSender smsSender) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.variantRepository = variantRepository;
        this.stockLedger = stockLedger;
        this.audit = audit;
        this.smsSender = smsSender;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminOrderSummaryResponse> list(OrderStatus status, String q, int page, int size) {
        var pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "placedAt")
        );

        Specification<Order> spec = filter(status, q);
        Page<Order> result = orderRepository.findAll(spec, pageable);

        List<Order> content = result.getContent();
        if (content.isEmpty()) {
            return PageResponse.of(result, List.of());
        }

        List<Long> customerIds = content.stream().map(Order::getCustomerId).distinct().toList();
        Map<Long, Customer> customers = customerRepository.findAllById(customerIds).stream()
                .collect(Collectors.toMap(Customer::getId, Function.identity()));

        List<Long> orderIds = content.stream().map(Order::getId).toList();
        List<OrderItem> allItems = orderItemRepository.findByOrderIdIn(orderIds);
        Map<Long, List<OrderItem>> itemsByOrderId = allItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        List<AdminOrderSummaryResponse> dtos = content.stream().map(order -> {
            Customer cust = customers.get(order.getCustomerId());
            String customerMobile = cust != null ? cust.getMobile() : order.getRecipientMobile();
            List<OrderItem> items = itemsByOrderId.getOrDefault(order.getId(), List.of());
            int itemCount = items.stream().mapToInt(OrderItem::getQty).sum();

            return new AdminOrderSummaryResponse(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getTrackingCode(),
                    customerMobile,
                    order.getRecipientName(),
                    order.getTotal(),
                    order.getStatus(),
                    order.getPlacedAt(),
                    order.isNeedsAttention(),
                    itemCount
            );
        }).toList();

        return PageResponse.of(result, dtos);
    }

    @Transactional(readOnly = true)
    public AdminOrderDetailResponse getDetail(long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        CustomerDto customerDto = customerRepository.findById(order.getCustomerId())
                .map(CustomerDto::from)
                .orElse(null);

        AdminOrderDetailResponse.DeliveryAddressDto addressDto = new AdminOrderDetailResponse.DeliveryAddressDto(
                order.getProvince(),
                order.getCity(),
                order.getAddressLine(),
                order.getPostalCode(),
                order.getRecipientName(),
                order.getRecipientMobile()
        );

        List<AdminOrderDetailResponse.AdminOrderItemResponse> itemDtos = orderItemRepository.findByOrderId(order.getId())
                .stream()
                .map(i -> new AdminOrderDetailResponse.AdminOrderItemResponse(
                        i.getId(),
                        i.getVariantId(),
                        i.getProductNameFa(),
                        i.getProductNameEn(),
                        i.getVariantLabelFa(),
                        i.getVariantLabelEn(),
                        i.getSku(),
                        i.getUnitPrice(),
                        i.getQty(),
                        i.getLineTotal()
                ))
                .toList();

        List<Payment> payments = paymentRepository.findByOrderId(order.getId());
        AdminOrderDetailResponse.PaymentDetailDto paymentDto = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .findFirst()
                .or(() -> payments.stream().max(Comparator.comparing(Payment::getId)))
                .map(p -> new AdminOrderDetailResponse.PaymentDetailDto(
                        p.getGateway(),
                        p.getRefId(),
                        p.getCardPanMasked(),
                        p.getStatus(),
                        p.getAmount()
                ))
                .orElse(null);

        List<AdminOrderDetailResponse.OrderStatusHistoryDto> historyDtos = statusHistoryRepository
                .findByOrderIdOrderByCreatedAtAsc(order.getId())
                .stream()
                .map(h -> new AdminOrderDetailResponse.OrderStatusHistoryDto(
                        h.getId(),
                        h.getFromStatus(),
                        h.getToStatus(),
                        h.getActorType(),
                        h.getActorId(),
                        h.getNote(),
                        h.getCreatedAt()
                ))
                .toList();

        return new AdminOrderDetailResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getTrackingCode(),
                order.getStatus(),
                customerDto,
                addressDto,
                itemDtos,
                order.getSubtotal(),
                order.getShippingCost(),
                order.getDiscountTotal(),
                order.getTotal(),
                paymentDto,
                order.getCourierNotes(),
                order.getAdminNotes(),
                order.isNeedsAttention(),
                order.getPlacedAt(),
                order.getPaidAt(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                historyDtos
        );
    }

    @Transactional
    public AdminOrderDetailResponse changeStatus(long id, OrderStatusTransitionRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus targetStatus = request.targetStatus();

        if (!isValidTransition(currentStatus, targetStatus)) {
            throw new ApiException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        if (targetStatus == OrderStatus.DISPATCHED) {
            if (request.courierNotes() == null || request.courierNotes().isBlank()) {
                throw ApiException.field("courierNotes", "REQUIRED");
            }
            order.setCourierNotes(request.courierNotes().trim());
        }

        if (targetStatus == OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                Variant v = variantRepository.findById(item.getVariantId())
                        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
                stockLedger.apply(v, item.getQty(), StockMovementReason.ORDER_CANCELLED, order.getId(),
                        "لغو سفارش " + order.getOrderNumber());
            }
        }

        AdminOrderDetailResponse before = getDetail(order.getId());

        order.setStatus(targetStatus);
        orderRepository.save(order);

        Long staffId = currentStaffId();
        statusHistoryRepository.save(new OrderStatusHistory(
                order.getId(),
                currentStatus,
                targetStatus,
                ActorType.STAFF,
                staffId,
                request.note()
        ));

        // Multi-stage SMS notifications
        if (targetStatus == OrderStatus.APPROVED) {
            try {
                smsSender.send(order.getRecipientMobile(), SmsTemplate.ORDER_APPROVED,
                        List.of(order.getOrderNumber(), order.getTrackingCode()));
            } catch (Exception e) {
                log.warn("Failed to send order approved SMS for order {}", order.getOrderNumber(), e);
            }
        } else if (targetStatus == OrderStatus.DISPATCHED) {
            try {
                String courier = order.getCourierNotes() != null ? order.getCourierNotes() : "";
                smsSender.send(order.getRecipientMobile(), SmsTemplate.ORDER_SHIPPED,
                        List.of(order.getOrderNumber(), courier, order.getTrackingCode()));
            } catch (Exception e) {
                log.warn("Failed to send order shipped SMS for order {}", order.getOrderNumber(), e);
            }
        }

        AdminOrderDetailResponse after = getDetail(order.getId());
        audit.record("ORDER_STATUS_TRANSITION", ENTITY, order.getId(), before, after);

        return after;
    }

    private boolean isValidTransition(OrderStatus current, OrderStatus target) {
        if (current == null || target == null) {
            return false;
        }
        return switch (current) {
            case AWAITING_APPROVAL -> target == OrderStatus.APPROVED || target == OrderStatus.CANCELLED;
            case APPROVED -> target == OrderStatus.PREPARING || target == OrderStatus.CANCELLED;
            case PREPARING -> target == OrderStatus.DISPATCHED || target == OrderStatus.CANCELLED;
            case DISPATCHED -> target == OrderStatus.DELIVERED || target == OrderStatus.CANCELLED;
            default -> false;
        };
    }

    private Specification<Order> filter(OrderStatus status, String q) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (q != null && !q.isBlank()) {
                String term = q.trim().toLowerCase();
                String like = "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";

                Subquery<Long> customerSubquery = query.subquery(Long.class);
                Root<Customer> c = customerSubquery.from(Customer.class);
                customerSubquery.select(c.get("id")).where(cb.like(cb.lower(c.get("mobile")), like, '\\'));

                ps.add(cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), like, '\\'),
                        cb.like(cb.lower(root.get("trackingCode")), like, '\\'),
                        cb.like(cb.lower(root.get("recipientMobile")), like, '\\'),
                        cb.like(cb.lower(root.get("recipientName")), like, '\\'),
                        cb.in(root.get("customerId")).value(customerSubquery)
                ));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
    }

    private static Long currentStaffId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof StaffPrincipal p ? p.id() : null;
    }
}
