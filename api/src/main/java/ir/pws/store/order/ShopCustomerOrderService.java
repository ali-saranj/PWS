package ir.pws.store.order;

import ir.pws.store.catalog.image.ProductImageService;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.product.ProductStatus;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.JalaliDate;
import ir.pws.store.order.dto.CustomerOrderItemDto;
import ir.pws.store.order.dto.CustomerOrderSummaryDto;
import ir.pws.store.order.dto.ReorderResultDto;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShopCustomerOrderService {

    private static final String DEFAULT_PLACEHOLDER_IMAGE = "/images/products/placeholder-meat.svg";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final VariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ProductImageService productImageService;

    public ShopCustomerOrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            VariantRepository variantRepository,
            ProductRepository productRepository,
            ProductImageService productImageService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
        this.productImageService = productImageService;
    }

    @Transactional(readOnly = true)
    public List<CustomerOrderSummaryDto> listOrdersForCustomer(Long customerId) {
        if (customerId == null) {
            return Collections.emptyList();
        }

        List<Order> orders = orderRepository.findByCustomerIdAndStatusNotOrderByCreatedAtDesc(
                customerId, OrderStatus.PENDING_PAYMENT);

        if (orders.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> orderIds = orders.stream().map(Order::getId).toList();
        List<OrderItem> allItems = orderItemRepository.findByOrderIdIn(orderIds);
        Map<Long, List<OrderItem>> itemsByOrderId = allItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        List<Long> variantIds = allItems.stream().map(OrderItem::getVariantId).distinct().toList();
        Map<Long, Variant> variantsById = variantRepository.findAllById(variantIds).stream()
                .collect(Collectors.toMap(Variant::getId, Function.identity()));

        List<Long> productIds = variantsById.values().stream()
                .map(Variant::getProductId)
                .distinct()
                .toList();
        Map<Long, String> thumbUrls = productImageService.thumbUrls(productIds);

        return orders.stream().map(order -> {
            List<OrderItem> orderItems = itemsByOrderId.getOrDefault(order.getId(), Collections.emptyList());
            List<CustomerOrderItemDto> itemDtos = orderItems.stream().map(item -> {
                Variant variant = variantsById.get(item.getVariantId());
                Long productId = variant != null ? variant.getProductId() : null;
                String imageUrl = productId != null ? thumbUrls.getOrDefault(productId, DEFAULT_PLACEHOLDER_IMAGE) : DEFAULT_PLACEHOLDER_IMAGE;

                long unitPriceRials = item.getUnitPrice();
                long unitPriceToman = unitPriceRials / 10;
                long totalPriceToman = item.getLineTotal() / 10;

                return new CustomerOrderItemDto(
                        item.getVariantId(),
                        productId,
                        item.getProductNameFa(),
                        item.getVariantLabelFa(),
                        item.getSku(),
                        item.getQty(),
                        unitPriceRials,
                        unitPriceToman,
                        totalPriceToman,
                        imageUrl
                );
            }).toList();

            Instant createdAt = order.getCreatedAt() != null ? order.getCreatedAt() : order.getPlacedAt();
            String createdAtJalali = JalaliDate.formatPersian(createdAt);

            String deliveryAddress = formatDeliveryAddress(order.getProvince(), order.getCity(), order.getAddressLine());

            return new CustomerOrderSummaryDto(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getTrackingCode(),
                    order.getStatus(),
                    formatStatusLabelFa(order.getStatus()),
                    order.getTotal(),
                    order.getTotal() / 10,
                    order.getShippingCost(),
                    order.getShippingCost() / 10,
                    deliveryAddress,
                    order.getRecipientName(),
                    order.getRecipientMobile(),
                    order.getCourierNotes(),
                    createdAt,
                    createdAtJalali,
                    itemDtos
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public ReorderResultDto reorder(Long customerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (!Objects.equals(order.getCustomerId(), customerId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        if (items.isEmpty()) {
            return new ReorderResultDto(Collections.emptyList(), Collections.emptyList());
        }

        List<Long> variantIds = items.stream().map(OrderItem::getVariantId).distinct().toList();
        Map<Long, Variant> variantsById = variantRepository.findAllById(variantIds).stream()
                .collect(Collectors.toMap(Variant::getId, Function.identity()));

        List<Long> productIds = variantsById.values().stream()
                .map(Variant::getProductId)
                .distinct()
                .toList();
        Map<Long, Product> productsById = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<Long, String> thumbUrls = productImageService.thumbUrls(productIds);

        List<ReorderResultDto.ReorderItemDto> addedItems = new ArrayList<>();
        List<String> unavailableItems = new ArrayList<>();

        for (OrderItem item : items) {
            String itemTitle = item.getProductNameFa();
            Variant variant = variantsById.get(item.getVariantId());

            if (variant == null) {
                unavailableItems.add(itemTitle);
                continue;
            }

            Product product = productsById.get(variant.getProductId());
            if (product == null || product.getStatus() != ProductStatus.ACTIVE) {
                unavailableItems.add(itemTitle);
                continue;
            }

            if (!variant.isActive() || variant.getStockOnHand() <= 0) {
                unavailableItems.add(itemTitle);
                continue;
            }

            int availableStock = variant.getStockOnHand();
            int requestedQuantity = item.getQty();
            int finalQuantity = Math.min(requestedQuantity, availableStock);

            if (finalQuantity <= 0) {
                unavailableItems.add(itemTitle);
                continue;
            }

            long unitPriceToman = variant.getBasePrice() / 10;
            String imageUrl = thumbUrls.getOrDefault(product.getId(), DEFAULT_PLACEHOLDER_IMAGE);

            addedItems.add(new ReorderResultDto.ReorderItemDto(
                    variant.getId(),
                    product.getId(),
                    itemTitle,
                    item.getVariantLabelFa(),
                    variant.getSku(),
                    unitPriceToman,
                    finalQuantity,
                    availableStock,
                    imageUrl
            ));
        }

        return new ReorderResultDto(addedItems, unavailableItems);
    }

    public static String formatStatusLabelFa(OrderStatus status) {
        if (status == null) {
            return "";
        }
        return switch (status) {
            case PENDING_PAYMENT -> "در انتظار پرداخت";
            case AWAITING_APPROVAL -> "پرداخت شده";
            case APPROVED -> "تایید شده";
            case PREPARING -> "در حال آماده‌سازی";
            case DISPATCHED -> "ارسال با پیک";
            case DELIVERED -> "تحویل داده شده";
            case CANCELLED -> "لغو شده";
        };
    }

    private static String formatDeliveryAddress(String province, String city, String addressLine) {
        StringBuilder sb = new StringBuilder();
        if (province != null && !province.isBlank() && (city == null || !province.equalsIgnoreCase(city.trim()))) {
            sb.append(province.trim()).append("، ");
        }
        if (city != null && !city.isBlank()) {
            sb.append(city.trim()).append("، ");
        }
        if (addressLine != null && !addressLine.isBlank()) {
            sb.append(addressLine.trim());
        }
        return sb.toString();
    }
}
