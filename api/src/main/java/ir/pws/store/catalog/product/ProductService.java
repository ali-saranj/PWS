package ir.pws.store.catalog.product;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.brand.BrandRepository;
import ir.pws.store.catalog.category.CategoryRepository;
import ir.pws.store.catalog.image.ProductImageService;
import ir.pws.store.catalog.product.Product.ProductContent;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.catalog.variant.VariantService;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.HtmlSanitizer;
import ir.pws.store.common.text.PersianTextNormalizer;
import ir.pws.store.common.text.Slugs;
import ir.pws.store.common.web.PageResponse;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private static final String ENTITY = "PRODUCT";
    private static final Sort LIST_SORT = Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by(Sort.Direction.DESC, "id"));

    private final ProductRepository products;
    private final BrandRepository brands;
    private final CategoryRepository categories;
    private final VariantRepository variants;
    private final VariantService variantService;
    private final ProductImageService imageService;
    private final AuditService audit;

    public ProductService(ProductRepository products, BrandRepository brands, CategoryRepository categories,
            VariantRepository variants, VariantService variantService, ProductImageService imageService, AuditService audit) {
        this.products = products;
        this.brands = brands;
        this.categories = categories;
        this.variants = variants;
        this.variantService = variantService;
        this.imageService = imageService;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryDto> list(String q, ProductStatus status, Long categoryId, Long brandId,
            int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), LIST_SORT);
        var result = products.findAll(filter(q, status, categoryId, brandId), pageable);
        // One aggregate query and one thumbnail query for the whole page (no N+1).
        List<Long> ids = result.getContent().stream().map(Product::getId).toList();
        Map<Long, VariantRepository.ProductAggregate> aggregates = ids.isEmpty() ? Map.of()
                : variants.aggregateByProductIds(ids).stream()
                        .collect(Collectors.toMap(VariantRepository.ProductAggregate::getProductId,
                                Function.identity()));
        Map<Long, String> thumbs = imageService.thumbUrls(ids);
        return PageResponse.of(result.map(p -> ProductSummaryDto.from(p, thumbs.get(p.getId()),
                aggregates.get(p.getId()))));
    }

    @Transactional(readOnly = true)
    public ProductDetailDto getDetail(long id) {
        return detail(find(id));
    }

    @Transactional
    public ProductDetailDto create(ProductUpsertRequest req) {
        ProductContent content = content(req, null);
        Product saved = products.saveAndFlush(new Product(content));
        ProductDetailDto dto = getDetail(saved.getId());
        audit.record("PRODUCT_CREATE", ENTITY, saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public ProductDetailDto update(long id, ProductUpsertRequest req) {
        Product product = find(id);
        if (req.version() == null) {
            throw ApiException.field("version", "REQUIRED");
        }
        if (req.version() != product.getVersion()) {
            throw new ApiException(ErrorCode.CONFLICT);
        }
        ProductContent content = content(req, id);
        ProductDetailDto before = detail(product);
        product.update(content);
        products.saveAndFlush(product);
        ProductDetailDto after = getDetail(id);
        audit.record("PRODUCT_UPDATE", ENTITY, id, before, after);
        return after;
    }

    @Transactional
    public ProductDetailDto changeStatus(long id, ProductStatusRequest req) {
        Product product = find(id);
        if (req.version() == null) {
            throw ApiException.field("version", "REQUIRED");
        }
        if (req.version() != product.getVersion()) {
            throw new ApiException(ErrorCode.CONFLICT);
        }
        if (req.status() == ProductStatus.ACTIVE && !variants.existsByProductIdAndActiveTrue(id)) {
            throw new ApiException(ErrorCode.PRODUCT_NOT_PUBLISHABLE);
        }
        ProductDetailDto before = detail(product);
        product.setStatus(req.status());
        products.saveAndFlush(product);
        ProductDetailDto after = detail(product);
        audit.record("PRODUCT_STATUS_CHANGE", ENTITY, id, before, after);
        return after;
    }

    private ProductDetailDto detail(Product product) {
        return ProductDetailDto.from(product, imageService.listForProduct(product.getId()),
                variantService.listForProduct(product.getId()));
    }

    private Product find(long id) {
        return products.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private ProductContent content(ProductUpsertRequest req, Long selfId) {
        String slug = req.slug().trim();
        if (!Slugs.isValid(slug)) {
            throw ApiException.field("slug", "SLUG_INVALID");
        }
        if (!brands.existsById(req.brandId()) || !categories.existsById(req.categoryId())) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        boolean taken = selfId == null ? products.existsBySlug(slug) : products.existsBySlugAndIdNot(slug, selfId);
        if (taken) {
            throw ApiException.field("slug", "DUPLICATE");
        }
        return new ProductContent(req.brandId(), req.categoryId(), slug, req.nameFa().trim(),
                trimToNull(req.nameEn()), HtmlSanitizer.sanitize(req.descriptionFa()),
                HtmlSanitizer.sanitize(req.descriptionEn()), req.featured(), trimToNull(req.seoTitleFa()),
                trimToNull(req.seoTitleEn()), trimToNull(req.seoDescriptionFa()),
                trimToNull(req.seoDescriptionEn()));
    }

    private static Specification<Product> filter(String q, ProductStatus status, Long categoryId, Long brandId) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                List<String> tokens = PersianTextNormalizer.tokenize(q);
                for (String token : tokens) {
                    String tokenPersian = PersianTextNormalizer.normalize(token);
                    String tokenArabic = tokenPersian.replace('ک', 'ك').replace('ی', 'ي');
                    Predicate tokenPred = matchAdminToken(root, query, cb, tokenPersian);
                    if (!tokenPersian.equals(tokenArabic)) {
                        tokenPred = cb.or(tokenPred, matchAdminToken(root, query, cb, tokenArabic));
                    }
                    ps.add(tokenPred);
                }
            }
            if (status != null) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (categoryId != null) {
                ps.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (brandId != null) {
                ps.add(cb.equal(root.get("brandId"), brandId));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
    }

    private static Predicate matchAdminToken(Root<Product> root, jakarta.persistence.criteria.CriteriaQuery<?> query,
            jakarta.persistence.criteria.CriteriaBuilder cb, String token) {
        String like = "%" + token.toLowerCase().replace("\\", "\\\\").replace("%", "\\%")
                .replace("_", "\\_") + "%";
        return cb.or(
                cb.like(cb.lower(root.get("nameFa")), like, '\\'),
                cb.like(cb.lower(cb.coalesce(root.get("nameEn"), "")), like, '\\'),
                cb.like(cb.lower(root.get("slug")), like, '\\'),
                cb.exists(skuMatch(root, query, cb, like)));
    }

    private static Subquery<Long> skuMatch(Root<Product> root, jakarta.persistence.criteria.CriteriaQuery<?> query,
            jakarta.persistence.criteria.CriteriaBuilder cb, String like) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<Variant> v = sub.from(Variant.class);
        return sub.select(v.<Long>get("id")).where(
                cb.equal(v.get("productId"), root.get("id")),
                cb.like(cb.lower(v.get("sku")), like, '\\'));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
