package ir.pws.store.catalog.inventory;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.error.FieldError;
import ir.pws.store.common.web.PageResponse;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.staff.StaffUserRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private static final String ENTITY = "INVENTORY";

    private final VariantRepository variants;
    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final StaffUserRepository staff;
    private final StockLedger ledger;
    private final AuditService audit;

    public InventoryService(VariantRepository variants, ProductRepository products, StockMovementRepository movements,
            StaffUserRepository staff, StockLedger ledger, AuditService audit) {
        this.variants = variants;
        this.products = products;
        this.movements = movements;
        this.staff = staff;
        this.ledger = ledger;
        this.audit = audit;
    }

    /** Audit snapshot entry. */
    public record StockSnapshot(long variantId, int stockOnHand) {}

    @Transactional(readOnly = true)
    public PageResponse<InventoryRowDto> list(String q, boolean lowStock, int page, int size) {
        String like = "%";
        if (q != null && !q.isBlank()) {
            like = "%" + q.trim().toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        }
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return PageResponse.of(variants.searchInventory(like, lowStock, pageable));
    }

    @Transactional
    public List<InventoryRowDto> adjust(AdjustmentRequest req) {
        List<AdjustmentRequest.Item> items = req.adjustments();
        if (items == null || items.isEmpty()) {
            throw ApiException.field("adjustments", "REQUIRED");
        }
        Set<Long> seen = new HashSet<>();
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).delta() == 0) {
                throw ApiException.field("adjustments[" + i + "].delta", "INVALID");
            }
            if (!seen.add(items.get(i).variantId())) {
                throw ApiException.field("adjustments[" + i + "].variantId", "DUPLICATE");
            }
        }
        // Lock every target row in ascending id order before touching any, so batches cannot deadlock.
        Map<Long, Variant> locked = variants.lockAllByIdOrdered(seen).stream()
                .collect(Collectors.toMap(Variant::getId, Function.identity()));
        if (locked.size() != seen.size()) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        List<StockSnapshot> before = items.stream().map(it -> snapshot(locked.get(it.variantId()))).toList();
        for (int i = 0; i < items.size(); i++) {
            AdjustmentRequest.Item it = items.get(i);
            String note = it.note() == null || it.note().isBlank() ? null : it.note().trim();
            try {
                ledger.apply(locked.get(it.variantId()), it.delta(), StockMovementReason.MANUAL_ADJUSTMENT, null, note);
            } catch (ApiException e) {
                throw remap(e, i);
            }
        }
        List<StockSnapshot> after = items.stream().map(it -> snapshot(locked.get(it.variantId()))).toList();
        audit.record("STOCK_ADJUSTMENT", ENTITY, null, before, after);
        Map<Long, Product> productById = products.findAllById(
                locked.values().stream().map(Variant::getProductId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        return items.stream().map(it -> row(locked.get(it.variantId()), productById)).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<StockMovementDto> movements(long variantId, int page, int size) {
        if (!variants.existsById(variantId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "id"));
        var result = movements.findByVariantId(variantId, pageable);
        Set<Long> staffIds = result.getContent().stream().map(StockMovement::getStaffUserId)
                .filter(java.util.Objects::nonNull).collect(Collectors.toSet());
        Map<Long, String> names = staffIds.isEmpty() ? Map.of()
                : staff.findAllById(staffIds).stream()
                        .collect(Collectors.toMap(StaffUser::getId, StaffUser::getUsername));
        return PageResponse.of(result.map(m -> new StockMovementDto(m.getId(), m.getDelta(), m.getReason(),
                m.getNote(), m.getStaffUserId() == null ? null : names.get(m.getStaffUserId()), m.getCreatedAt())));
    }

    private static ApiException remap(ApiException e, int index) {
        List<FieldError> errors = e.errors().stream()
                .map(fe -> "delta".equals(fe.field())
                        ? new FieldError("adjustments[" + index + "].delta", fe.code()) : fe)
                .toList();
        return new ApiException(e.code(), errors);
    }

    private static StockSnapshot snapshot(Variant v) {
        return new StockSnapshot(v.getId(), v.getStockOnHand());
    }

    private static InventoryRowDto row(Variant v, Map<Long, Product> productById) {
        Product p = productById.get(v.getProductId());
        return new InventoryRowDto(v.getId(), v.getProductId(), p.getNameFa(), p.getNameEn(), v.getSku(),
                v.getFlavourFa(), v.getFlavourEn(), v.getSizeLabel(), v.getStockOnHand(), v.getLowStockThreshold(),
                v.isActive());
    }
}
