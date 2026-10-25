package ir.pws.store.catalog.variant;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.inventory.StockLedger;
import ir.pws.store.catalog.inventory.StockMovementReason;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.variant.Variant.VariantContent;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.error.FieldError;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VariantService {

    private static final String ENTITY = "VARIANT";
    private static final int DEFAULT_LOW_STOCK = 5;

    private final VariantRepository variants;
    private final VolumeTierRepository tiers;
    private final ProductRepository products;
    private final StockLedger ledger;
    private final AuditService audit;

    public VariantService(VariantRepository variants, VolumeTierRepository tiers, ProductRepository products,
            StockLedger ledger, AuditService audit) {
        this.variants = variants;
        this.tiers = tiers;
        this.products = products;
        this.ledger = ledger;
        this.audit = audit;
    }

    /** All variants of a product (with tiers), fetched with two queries. */
    @Transactional(readOnly = true)
    public List<VariantDto> listForProduct(long productId) {
        List<Variant> list = variants.findByProductIdOrderBySortOrderAscIdAsc(productId);
        if (list.isEmpty()) {
            return List.of();
        }
        Map<Long, List<VolumeTier>> byVariant = tiers
                .findByVariantIdInOrderByMinQtyAsc(list.stream().map(Variant::getId).toList()).stream()
                .collect(Collectors.groupingBy(VolumeTier::getVariantId));
        return list.stream().map(v -> VariantDto.from(v, byVariant.getOrDefault(v.getId(), List.of()))).toList();
    }

    @Transactional
    public VariantDto create(long productId, VariantUpsertRequest req) {
        if (!products.existsById(productId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        VariantContent content = content(req, null, List.of());
        Variant saved = variants.saveAndFlush(new Variant(productId, content));
        int initial = req.initialStock() == null ? 0 : req.initialStock();
        if (initial > 0) {
            ledger.apply(saved, initial, StockMovementReason.INITIAL, null, null);
        }
        VariantDto dto = dto(saved);
        audit.record("VARIANT_CREATE", ENTITY, saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public VariantDto update(long id, VariantUpsertRequest req) {
        Variant variant = find(id);
        if (req.version() == null) {
            throw ApiException.field("version", "REQUIRED");
        }
        if (req.version() != variant.getVersion()) {
            throw new ApiException(ErrorCode.CONFLICT);
        }
        List<VolumeTier> existing = tiers.findByVariantIdOrderByMinQtyAsc(id);
        VariantContent content = content(req, id, existing);
        VariantDto before = VariantDto.from(variant, existing);
        variant.update(content);
        variants.saveAndFlush(variant);
        VariantDto after = dto(variant);
        audit.record("VARIANT_UPDATE", ENTITY, id, before, after);
        return after;
    }

    @Transactional
    public VariantDto replaceTiers(long id, TiersRequest req) {
        Variant variant = find(id);
        List<FieldError> errors = TierPricing.validate(variant.getBasePrice(), req.tiers());
        if (!errors.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, errors);
        }
        VariantDto before = dto(variant);
        tiers.deleteByVariantId(id);
        tiers.flush();
        tiers.saveAll(req.tiers().stream().map(t -> new VolumeTier(id, t.minQty(), t.unitPrice())).toList());
        tiers.flush();
        VariantDto after = dto(variant);
        audit.record("VARIANT_TIERS_UPDATE", ENTITY, id, before, after);
        return after;
    }

    private Variant find(long id) {
        return variants.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private VariantDto dto(Variant v) {
        return VariantDto.from(v, tiers.findByVariantIdOrderByMinQtyAsc(v.getId()));
    }

    private VariantContent content(VariantUpsertRequest req, Long selfId, List<VolumeTier> existingTiers) {
        String sku = req.sku().trim().toUpperCase(Locale.ROOT);
        if (sku.isEmpty()) {
            throw ApiException.field("sku", "REQUIRED");
        }
        if (sku.length() > 64) {
            throw ApiException.field("sku", "Size");
        }
        boolean taken = selfId == null ? variants.existsBySku(sku) : variants.existsBySkuAndIdNot(sku, selfId);
        if (taken) {
            throw ApiException.field("sku", "DUPLICATE");
        }
        long base = req.basePrice();
        if (req.compareAtPrice() != null && req.compareAtPrice() <= base) {
            throw ApiException.field("compareAtPrice", "INVALID");
        }
        if (!existingTiers.isEmpty()) {
            List<TierDto> dtos = existingTiers.stream().map(t -> new TierDto(t.getMinQty(), t.getUnitPrice())).toList();
            if (!TierPricing.validate(base, dtos).isEmpty()) {
                throw ApiException.field("basePrice", "TIER_INVALID");
            }
        }
        return new VariantContent(sku, trimToNull(req.flavourFa()), trimToNull(req.flavourEn()),
                trimToNull(req.sizeLabel()), req.weightGrams(), base, req.compareAtPrice(),
                req.lowStockThreshold() == null ? DEFAULT_LOW_STOCK : req.lowStockThreshold(),
                req.active() == null || req.active(), req.sortOrder() == null ? 0 : req.sortOrder());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
