package ir.pws.store.catalog.brand;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.image.ImageProcessor;
import ir.pws.store.catalog.image.MediaStorage;
import ir.pws.store.catalog.image.MediaTransactions;
import ir.pws.store.catalog.image.ProcessedImage;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.Slugs;
import ir.pws.store.config.AppProperties;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BrandService {

    private static final String ENTITY = "BRAND";

    private final BrandRepository brands;
    private final AuditService audit;
    private final ProductRepository products;
    private final ImageProcessor imageProcessor;
    private final MediaStorage storage;
    private final String mediaBaseUrl;

    public BrandService(BrandRepository brands, AuditService audit, ProductRepository products,
            ImageProcessor imageProcessor, MediaStorage storage, AppProperties props) {
        this.brands = brands;
        this.audit = audit;
        this.products = products;
        this.imageProcessor = imageProcessor;
        this.storage = storage;
        this.mediaBaseUrl = props.media() == null ? "/media" : props.media().baseUrl();
    }

    @Transactional(readOnly = true)
    public List<BrandDto> list() {
        return brands.findAll(Sort.by("nameFa", "id")).stream().map(this::toDto).toList();
    }

    @Transactional
    public BrandDto create(BrandRequest req) {
        String slug = checkSlug(req.slug(), null);
        Brand saved = brands.saveAndFlush(
                new Brand(req.nameFa().trim(), trimToNull(req.nameEn()), slug, req.active()));
        BrandDto dto = toDto(saved);
        audit.record("BRAND_CREATE", ENTITY, saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public BrandDto update(long id, BrandRequest req) {
        Brand brand = find(id);
        String slug = checkSlug(req.slug(), id);
        BrandDto before = toDto(brand);
        brand.update(req.nameFa().trim(), trimToNull(req.nameEn()), slug, req.active());
        brands.saveAndFlush(brand);
        BrandDto after = toDto(brand);
        audit.record("BRAND_UPDATE", ENTITY, id, before, after);
        return after;
    }

    @Transactional
    public BrandDto uploadLogo(long id, byte[] bytes) {
        Brand brand = find(id);
        ProcessedImage processed = imageProcessor.process(bytes);
        BrandDto before = toDto(brand);
        String previous = brand.getLogoPath();
        String path = "brands/" + id + "/" + UUID.randomUUID() + "-400.webp";
        MediaTransactions.saveFiles(storage, Map.of(path, processed.thumb()));
        brand.setLogoPath(path);
        brands.saveAndFlush(brand);
        if (previous != null) {
            MediaTransactions.deleteFilesAfterCommit(storage, List.of(previous));
        }
        BrandDto after = toDto(brand);
        audit.record("BRAND_LOGO_UPLOAD", ENTITY, id, before, after);
        return after;
    }

    @Transactional
    public void delete(long id) {
        Brand brand = find(id);
        assertDeletable(id);
        BrandDto before = toDto(brand);
        brands.delete(brand);
        brands.flush();
        audit.record("BRAND_DELETE", ENTITY, id, before, null);
        if (brand.getLogoPath() != null) {
            MediaTransactions.deleteFilesAfterCommit(storage, List.of(brand.getLogoPath()));
        }
    }

    /** Throws RESOURCE_IN_USE when the brand cannot be removed. */
    public void assertDeletable(long id) {
        if (products.existsByBrandId(id)) {
            throw new ApiException(ErrorCode.RESOURCE_IN_USE);
        }
    }

    private Brand find(long id) {
        return brands.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private BrandDto toDto(Brand brand) {
        return BrandDto.from(brand, mediaBaseUrl);
    }

    private String checkSlug(String raw, Long selfId) {
        String slug = raw.trim();
        if (!Slugs.isValid(slug)) {
            throw ApiException.field("slug", "SLUG_INVALID");
        }
        boolean taken = selfId == null ? brands.existsBySlug(slug) : brands.existsBySlugAndIdNot(slug, selfId);
        if (taken) {
            throw ApiException.field("slug", "DUPLICATE");
        }
        return slug;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
