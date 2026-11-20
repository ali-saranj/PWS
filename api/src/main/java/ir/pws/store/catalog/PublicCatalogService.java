package ir.pws.store.catalog;

import ir.pws.store.catalog.brand.Brand;
import ir.pws.store.catalog.brand.BrandRepository;
import ir.pws.store.catalog.category.Category;
import ir.pws.store.catalog.category.CategoryRepository;
import ir.pws.store.catalog.dto.HomeCatalogResponse;
import ir.pws.store.catalog.dto.HomeCatalogResponse.HomeCategoryDto;
import ir.pws.store.catalog.dto.ProductDetailResponse;
import ir.pws.store.catalog.dto.ProductDetailResponse.CategoryBreadcrumb;
import ir.pws.store.catalog.dto.ProductDetailResponse.StorefrontImageDto;
import ir.pws.store.catalog.dto.ProductDetailResponse.StorefrontVariantDto;
import ir.pws.store.catalog.dto.ProductDetailResponse.VolumeTierDto;
import ir.pws.store.catalog.dto.ProductSummaryResponse;
import ir.pws.store.catalog.dto.SearchSuggestionDto;
import ir.pws.store.catalog.image.ProductImageService;
import ir.pws.store.catalog.product.Product;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.catalog.product.ProductStatus;
import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.catalog.variant.VariantRepository;
import ir.pws.store.catalog.variant.VolumeTier;
import ir.pws.store.catalog.variant.VolumeTierRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.Digits;
import ir.pws.store.common.text.PersianTextNormalizer;
import ir.pws.store.common.web.PageResponse;
import ir.pws.store.config.AppProperties;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicCatalogService {

    private final ProductRepository products;
    private final BrandRepository brands;
    private final CategoryRepository categories;
    private final VariantRepository variants;
    private final VolumeTierRepository volumeTiers;
    private final ProductImageService imageService;
    private final String mediaBaseUrl;

    public PublicCatalogService(
            ProductRepository products,
            BrandRepository brands,
            CategoryRepository categories,
            VariantRepository variants,
            VolumeTierRepository volumeTiers,
            ProductImageService imageService,
            AppProperties props) {
        this.products = products;
        this.brands = brands;
        this.categories = categories;
        this.variants = variants;
        this.volumeTiers = volumeTiers;
        this.imageService = imageService;
        this.mediaBaseUrl = props.media() == null ? "/media" : props.media().baseUrl();
    }

    @Transactional(readOnly = true)
    public HomeCatalogResponse getHome() {
        List<Category> activeCats = categories.findByActiveTrueOrderBySortOrderAscIdAsc();
        List<HomeCategoryDto> catDtos = activeCats.stream()
                .map(c -> new HomeCategoryDto(
                        c.getId(),
                        c.getNameFa(),
                        c.getNameFa(),
                        c.getNameEn(),
                        c.getSlug(),
                        c.getSlug(),
                        c.getParentId(),
                        c.getSortOrder()))
                .toList();

        List<ProductSummaryResponse> specialOffers = listProducts(null, null, true, null, null, "newest", 0, 12).items();
        List<ProductSummaryResponse> popularProducts = listProducts(null, null, null, null, null, "popular", 0, 12).items();

        return new HomeCatalogResponse(catDtos, specialOffers, popularProducts);
    }

    public record PublicBrandDto(long id, String nameFa, String nameEn, String slug, String logoUrl) {}

    public record PublicCategoryDto(
            long id,
            String nameFa,
            String nameEn,
            String slug,
            Long parentId,
            int sortOrder
    ) {}

    public record PublicCategoryDetailDto(
            long id,
            String nameFa,
            String nameEn,
            String slug,
            Long parentId,
            int sortOrder,
            List<CategoryBreadcrumb> breadcrumbs,
            List<PublicCategoryDto> subcategories
    ) {}

    private PublicBrandDto toPublicBrandDto(Brand b) {
        String logoUrl = b.getLogoPath() == null ? null : mediaBaseUrl + "/" + b.getLogoPath();
        return new PublicBrandDto(b.getId(), b.getNameFa(), b.getNameEn(), b.getSlug(), logoUrl);
    }

    private PublicCategoryDto toPublicCategoryDto(Category c) {
        return new PublicCategoryDto(
                c.getId(),
                c.getNameFa(),
                c.getNameEn(),
                c.getSlug(),
                c.getParentId(),
                c.getSortOrder()
        );
    }

    @Transactional(readOnly = true)
    public List<PublicCategoryDto> listCategories() {
        return categories.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .map(this::toPublicCategoryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicCategoryDetailDto getCategoryBySlug(String slug) {
        Category cat = categories.findBySlug(slug)
                .filter(Category::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        List<CategoryBreadcrumb> breadcrumbs = buildBreadcrumbs(cat.getId());

        List<PublicCategoryDto> subcategories = categories.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .filter(c -> Objects.equals(c.getParentId(), cat.getId()))
                .map(this::toPublicCategoryDto)
                .toList();

        return new PublicCategoryDetailDto(
                cat.getId(),
                cat.getNameFa(),
                cat.getNameEn(),
                cat.getSlug(),
                cat.getParentId(),
                cat.getSortOrder(),
                breadcrumbs,
                subcategories
        );
    }

    @Transactional(readOnly = true)
    public List<PublicBrandDto> listBrands() {
        return brands.findByActiveTrueOrderByNameFaAsc().stream()
                .map(this::toPublicBrandDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicBrandDto getBrandBySlug(String slug) {
        Brand b = brands.findBySlug(slug)
                .filter(Brand::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return toPublicBrandDto(b);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> listProducts(
            Long categoryId,
            String categorySlug,
            Long brandId,
            String brandSlug,
            List<Long> brandIds,
            Boolean inStock,
            Boolean onSale,
            Long minPrice,
            Long maxPrice,
            String sort,
            int page,
            int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(pageIndex, pageSize);

        Set<Long> categoryIds = null;
        if (categoryId != null) {
            categoryIds = getCategoryAndDescendantIds(categoryId);
        } else if (categorySlug != null && !categorySlug.isBlank()) {
            Category cat = categories.findBySlug(categorySlug.trim()).orElse(null);
            if (cat != null) {
                categoryIds = getCategoryAndDescendantIds(cat.getId());
            } else {
                categoryIds = Collections.emptySet();
            }
        }

        Long effectiveBrandId = brandId;
        if (effectiveBrandId == null && brandSlug != null && !brandSlug.isBlank()) {
            effectiveBrandId = brands.findBySlug(brandSlug.trim()).map(Brand::getId).orElse(-1L);
        }

        Specification<Product> spec = buildFilterSpec(categoryIds, effectiveBrandId, brandIds, inStock, onSale, minPrice, maxPrice, sort);

        Page<Product> productPage = products.findAll(spec, pageable);
        List<ProductSummaryResponse> items = mapToSummaries(productPage.getContent());

        return PageResponse.of(productPage, items);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> listProducts(
            Long categoryId,
            Long brandId,
            Boolean onSale,
            Long minPrice,
            Long maxPrice,
            String sort,
            int page,
            int size) {
        return listProducts(categoryId, null, brandId, null, null, null, onSale, minPrice, maxPrice, sort, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> search(String q, int page, int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(pageIndex, pageSize);

        if (q == null || q.isBlank()) {
            Specification<Product> spec = buildSearchSpec(q, false);
            Page<Product> productPage = products.findAll(spec, pageable);
            return PageResponse.of(productPage, mapToSummaries(productPage.getContent()));
        }

        // 1. Strict AND search
        Specification<Product> andSpec = buildSearchSpec(q, false);
        Page<Product> productPage = products.findAll(andSpec, pageable);

        // 2. Progressive fallback to OR search if strict AND produced 0 results
        List<String> tokens = PersianTextNormalizer.tokenize(q);
        if (productPage.getTotalElements() == 0 && tokens.size() > 1) {
            Specification<Product> orSpec = buildSearchSpec(q, true);
            productPage = products.findAll(orSpec, pageable);
        }

        List<ProductSummaryResponse> items = mapToSummaries(productPage.getContent());
        return PageResponse.of(productPage, items);
    }

    @Transactional(readOnly = true)
    public List<SearchSuggestionDto> suggest(String q) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        PageResponse<ProductSummaryResponse> page = search(q, 0, 6);
        return page.items().stream()
                .map(p -> new SearchSuggestionDto(
                        p.id(),
                        p.slug(),
                        p.nameFa(),
                        p.thumbnailUrl(),
                        p.priceToman(),
                        p.categoryNameFa()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = products.findBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        List<Variant> activeVariants = variants.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
                .filter(Variant::isActive)
                .toList();

        if (activeVariants.isEmpty()) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        Brand brand = brands.findById(product.getBrandId()).orElse(null);
        Category category = categories.findById(product.getCategoryId()).orElse(null);

        List<CategoryBreadcrumb> breadcrumbs = buildBreadcrumbs(product.getCategoryId());

        List<StorefrontImageDto> images = imageService.listForProduct(product.getId()).stream()
                .map(i -> new StorefrontImageDto(i.id(), i.url(), i.thumbUrl(), i.sortOrder(), i.altFa(), i.altEn()))
                .toList();

        List<Long> variantIds = activeVariants.stream().map(Variant::getId).toList();
        Map<Long, List<VolumeTier>> tiersByVariant = volumeTiers.findByVariantIdInOrderByMinQtyAsc(variantIds).stream()
                .collect(Collectors.groupingBy(VolumeTier::getVariantId));

        List<StorefrontVariantDto> variantDtos = activeVariants.stream().map(v -> {
            List<VolumeTier> vTiers = tiersByVariant.getOrDefault(v.getId(), List.of());
            List<VolumeTierDto> tierDtos = vTiers.stream().map(t -> {
                int discount = v.getBasePrice() > t.getUnitPrice()
                        ? (int) Math.round(((double) (v.getBasePrice() - t.getUnitPrice()) / v.getBasePrice()) * 100)
                        : 0;
                return new VolumeTierDto(t.getMinQty(), t.getUnitPrice(), t.getUnitPrice() / 10, discount);
            }).toList();

            Long compareAt = v.getCompareAtPrice();
            Long compareAtToman = compareAt != null ? compareAt / 10 : null;
            Integer discountPercent = (compareAt != null && compareAt > v.getBasePrice())
                    ? (int) Math.round(((double) (compareAt - v.getBasePrice()) / compareAt) * 100)
                    : null;

            return new StorefrontVariantDto(
                    v.getId(),
                    v.getSku(),
                    v.getFlavourFa(),
                    v.getFlavourEn(),
                    v.getSizeLabel(),
                    v.getWeightGrams(),
                    v.getBasePrice(),
                    v.getBasePrice() / 10,
                    compareAt,
                    compareAtToman,
                    discountPercent,
                    v.getStockOnHand(),
                    v.getStockOnHand() > 0,
                    v.getSortOrder(),
                    tierDtos);
        }).toList();

        Variant minVariant = activeVariants.stream()
                .min(Comparator.comparingLong(Variant::getBasePrice))
                .orElse(activeVariants.get(0));

        long basePriceRials = minVariant.getBasePrice();
        long priceToman = basePriceRials / 10;
        Long compareAtRials = minVariant.getCompareAtPrice();
        Long compareAtToman = compareAtRials != null ? compareAtRials / 10 : null;
        Integer discountPercent = (compareAtRials != null && compareAtRials > basePriceRials)
                ? (int) Math.round(((double) (compareAtRials - basePriceRials) / compareAtRials) * 100)
                : null;

        boolean inStock = activeVariants.stream().anyMatch(v -> v.getStockOnHand() > 0);

        List<String> badges = buildBadges(minVariant, !tiersByVariant.isEmpty(), product.isFeatured());

        return new ProductDetailResponse(
                product.getId(),
                product.getSlug(),
                product.getNameFa(),
                product.getNameEn(),
                product.getDescriptionFa(),
                product.getDescriptionEn(),
                product.getBrandId(),
                brand != null ? brand.getNameFa() : "",
                brand != null ? brand.getNameEn() : "",
                product.getCategoryId(),
                category != null ? category.getNameFa() : "",
                category != null ? category.getNameEn() : "",
                breadcrumbs,
                images,
                variantDtos,
                basePriceRials,
                priceToman,
                compareAtRials,
                compareAtToman,
                discountPercent,
                inStock,
                product.isFeatured(),
                badges);
    }

    private List<ProductSummaryResponse> mapToSummaries(List<Product> productList) {
        if (productList.isEmpty()) {
            return List.of();
        }

        List<Long> productIds = productList.stream().map(Product::getId).toList();
        Set<Long> brandIds = productList.stream().map(Product::getBrandId).collect(Collectors.toSet());
        Set<Long> catIds = productList.stream().map(Product::getCategoryId).collect(Collectors.toSet());

        Map<Long, Brand> brandMap = brands.findAllById(brandIds).stream()
                .collect(Collectors.toMap(Brand::getId, Function.identity()));
        Map<Long, Category> catMap = categories.findAllById(catIds).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        Map<Long, String> thumbs = imageService.thumbUrls(productIds);

        List<Variant> activeVariants = variants.findByProductIdInOrderBySortOrderAscIdAsc(productIds).stream()
                .filter(Variant::isActive)
                .toList();

        Map<Long, List<Variant>> variantsByProduct = activeVariants.stream()
                .collect(Collectors.groupingBy(Variant::getProductId));

        Set<Long> variantsWithTiers = new HashSet<>(
                volumeTiers.findByVariantIdInOrderByMinQtyAsc(activeVariants.stream().map(Variant::getId).toList())
                        .stream().map(VolumeTier::getVariantId).toList());

        return productList.stream().map(p -> {
            List<Variant> pVars = variantsByProduct.getOrDefault(p.getId(), List.of());
            if (pVars.isEmpty()) {
                return null;
            }

            Variant minVariant = pVars.stream()
                    .min(Comparator.comparingLong(Variant::getBasePrice))
                    .orElse(pVars.get(0));

            long basePriceRials = minVariant.getBasePrice();
            long priceToman = basePriceRials / 10;
            Long compareAtRials = minVariant.getCompareAtPrice();
            Long compareAtToman = compareAtRials != null ? compareAtRials / 10 : null;
            Integer discountPercent = (compareAtRials != null && compareAtRials > basePriceRials)
                    ? (int) Math.round(((double) (compareAtRials - basePriceRials) / compareAtRials) * 100)
                    : null;

            long totalStock = pVars.stream().mapToLong(Variant::getStockOnHand).sum();
            boolean inStock = totalStock > 0;

            boolean hasVolumeTiers = pVars.stream().anyMatch(v -> variantsWithTiers.contains(v.getId()));
            List<String> badges = buildBadges(minVariant, hasVolumeTiers, p.isFeatured());

            Brand b = brandMap.get(p.getBrandId());
            Category c = catMap.get(p.getCategoryId());
            Long defaultVariantId = pVars.get(0).getId();

            return new ProductSummaryResponse(
                    p.getId(),
                    p.getSlug(),
                    p.getNameFa(),
                    p.getNameEn(),
                    p.getBrandId(),
                    b != null ? b.getNameFa() : "",
                    b != null ? b.getNameEn() : "",
                    p.getCategoryId(),
                    c != null ? c.getNameFa() : "",
                    c != null ? c.getNameEn() : "",
                    thumbs.get(p.getId()),
                    basePriceRials,
                    priceToman,
                    compareAtRials,
                    compareAtToman,
                    discountPercent,
                    inStock,
                    totalStock,
                    p.isFeatured(),
                    badges,
                    defaultVariantId);
        }).filter(Objects::nonNull).toList();
    }

    private List<String> buildBadges(Variant minVariant, boolean hasVolumeTiers, boolean featured) {
        List<String> badges = new ArrayList<>();
        if (minVariant.getCompareAtPrice() != null && minVariant.getCompareAtPrice() > minVariant.getBasePrice()) {
            int pct = (int) Math.round(((double) (minVariant.getCompareAtPrice() - minVariant.getBasePrice()) / minVariant.getCompareAtPrice()) * 100);
            badges.add("-" + pct + "%");
            badges.add("پیشنهاد شگفت‌انگیز");
        }
        if (hasVolumeTiers) {
            badges.add("تخفیف پلکانی");
        }
        if (featured) {
            badges.add("ویژه");
        }
        return badges;
    }

    private List<CategoryBreadcrumb> buildBreadcrumbs(long categoryId) {
        List<CategoryBreadcrumb> list = new ArrayList<>();
        Long currentId = categoryId;
        Set<Long> visited = new HashSet<>();
        while (currentId != null && visited.add(currentId)) {
            Category cat = categories.findById(currentId).orElse(null);
            if (cat == null) {
                break;
            }
            list.add(new CategoryBreadcrumb(cat.getId(), cat.getNameFa(), cat.getNameEn(), cat.getSlug()));
            currentId = cat.getParentId();
        }
        Collections.reverse(list);
        return list;
    }

    private Set<Long> getCategoryAndDescendantIds(Long rootId) {
        Set<Long> result = new HashSet<>();
        result.add(rootId);
        List<Category> all = categories.findAll();
        boolean changed = true;
        while (changed) {
            changed = false;
            for (Category c : all) {
                if (c.getParentId() != null && result.contains(c.getParentId()) && result.add(c.getId())) {
                    changed = true;
                }
            }
        }
        return result;
    }

    private Specification<Product> buildFilterSpec(
            Set<Long> categoryIds,
            Long brandId,
            List<Long> brandIds,
            Boolean inStock,
            Boolean onSale,
            Long minPrice,
            Long maxPrice,
            String sort) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            // 1. Must be ACTIVE
            ps.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            // 2. Must have at least one active variant
            Subquery<Long> hasActiveVariant = query.subquery(Long.class);
            Root<Variant> v1 = hasActiveVariant.from(Variant.class);
            hasActiveVariant.select(v1.get("id")).where(
                    cb.equal(v1.get("productId"), root.get("id")),
                    cb.isTrue(v1.get("active")));
            ps.add(cb.exists(hasActiveVariant));

            // In-stock filter
            if (Boolean.TRUE.equals(inStock)) {
                Subquery<Long> inStockSub = query.subquery(Long.class);
                Root<Variant> vs = inStockSub.from(Variant.class);
                inStockSub.select(vs.get("id")).where(
                        cb.equal(vs.get("productId"), root.get("id")),
                        cb.isTrue(vs.get("active")),
                        cb.greaterThan(vs.get("stockOnHand"), 0));
                ps.add(cb.exists(inStockSub));
            }

            // 3. Category filter
            if (categoryIds != null) {
                if (categoryIds.isEmpty()) {
                    ps.add(cb.disjunction());
                } else {
                    ps.add(root.get("categoryId").in(categoryIds));
                }
            }

            // 4. Brand filter
            if (brandId != null) {
                ps.add(cb.equal(root.get("brandId"), brandId));
            }
            if (brandIds != null && !brandIds.isEmpty()) {
                List<Long> safeBrandIds = brandIds.stream().filter(Objects::nonNull).toList();
                if (!safeBrandIds.isEmpty()) {
                    ps.add(root.get("brandId").in(safeBrandIds));
                }
            }

            // 5. On sale filter (compareAtPrice > basePrice OR has volume tiers)
            if (Boolean.TRUE.equals(onSale)) {
                Subquery<Long> onSaleSub = query.subquery(Long.class);
                Root<Variant> v2 = onSaleSub.from(Variant.class);

                Subquery<Long> tierSub = onSaleSub.subquery(Long.class);
                Root<VolumeTier> vt = tierSub.from(VolumeTier.class);
                tierSub.select(vt.get("id")).where(cb.equal(vt.get("variantId"), v2.get("id")));

                Predicate compareAtGreater = cb.and(
                        cb.isNotNull(v2.get("compareAtPrice")),
                        cb.greaterThan(v2.get("compareAtPrice"), v2.get("basePrice")));

                onSaleSub.select(v2.get("id")).where(
                        cb.equal(v2.get("productId"), root.get("id")),
                        cb.isTrue(v2.get("active")),
                        cb.or(compareAtGreater, cb.exists(tierSub)));

                ps.add(cb.exists(onSaleSub));
            }

            // 6. Price range filter
            if (minPrice != null || maxPrice != null) {
                Subquery<Long> priceSub = query.subquery(Long.class);
                Root<Variant> v3 = priceSub.from(Variant.class);
                List<Predicate> pricePreds = new ArrayList<>();
                pricePreds.add(cb.equal(v3.get("productId"), root.get("id")));
                pricePreds.add(cb.isTrue(v3.get("active")));
                if (minPrice != null) {
                    pricePreds.add(cb.greaterThanOrEqualTo(v3.get("basePrice"), minPrice));
                }
                if (maxPrice != null) {
                    pricePreds.add(cb.lessThanOrEqualTo(v3.get("basePrice"), maxPrice));
                }
                priceSub.select(v3.get("id")).where(pricePreds.toArray(Predicate[]::new));
                ps.add(cb.exists(priceSub));
            }

            // 7. Order By
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                applySorting(sort, root, query, cb);
            }

            return cb.and(ps.toArray(Predicate[]::new));
        };
    }

    private Specification<Product> buildSearchSpec(String q, boolean fallbackOr) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            // 1. Must be ACTIVE
            ps.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            // 2. Must have active variant
            Subquery<Long> hasActiveVariant = query.subquery(Long.class);
            Root<Variant> v1 = hasActiveVariant.from(Variant.class);
            hasActiveVariant.select(v1.get("id")).where(
                    cb.equal(v1.get("productId"), root.get("id")),
                    cb.isTrue(v1.get("active")));
            ps.add(cb.exists(hasActiveVariant));

            // 3. Search query matching
            if (q != null && !q.isBlank()) {
                List<String> tokens = PersianTextNormalizer.tokenize(q);
                List<Predicate> tokenPredicates = new ArrayList<>();
                Expression<Integer> relevanceScore = cb.literal(0);

                for (String token : tokens) {
                    Predicate tokenPred = matchToken(cb, root, query, token);
                    tokenPredicates.add(tokenPred);

                    String tokenNorm = PersianTextNormalizer.normalize(token);
                    String like = "%" + tokenNorm.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                    String prefixLike = tokenNorm.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";

                    Expression<Integer> tokenScore = cb.<Integer>selectCase()
                            .when(cb.equal(cb.lower(root.get("nameFa")), tokenNorm), 100)
                            .when(cb.like(cb.lower(root.get("nameFa")), prefixLike, '\\'), 60)
                            .when(cb.like(cb.lower(root.get("nameFa")), like, '\\'), 30)
                            .when(cb.like(cb.lower(cb.coalesce(root.get("nameEn"), "")), like, '\\'), 20)
                            .when(cb.like(cb.lower(cb.coalesce(root.get("descriptionFa"), "")), like, '\\'), 5)
                            .otherwise(1);

                    relevanceScore = cb.sum(relevanceScore, tokenScore);
                }

                if (!tokenPredicates.isEmpty()) {
                    if (fallbackOr) {
                        ps.add(cb.or(tokenPredicates.toArray(Predicate[]::new)));
                    } else {
                        ps.add(cb.and(tokenPredicates.toArray(Predicate[]::new)));
                    }
                }

                if (tokens.size() > 1) {
                    String fullNorm = PersianTextNormalizer.normalize(q);
                    if (fullNorm != null && !fullNorm.isBlank()) {
                        String fullLike = "%" + fullNorm.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                        Expression<Integer> fullPhraseScore = cb.<Integer>selectCase()
                                .when(cb.like(cb.lower(root.get("nameFa")), fullLike, '\\'), 50)
                                .otherwise(0);
                        relevanceScore = cb.sum(relevanceScore, fullPhraseScore);
                    }
                }

                if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                    query.orderBy(cb.desc(relevanceScore), cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
                }
            } else {
                if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                    query.orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
                }
            }

            return cb.and(ps.toArray(Predicate[]::new));
        };
    }

    private Predicate matchToken(CriteriaBuilder cb, Root<Product> root, CriteriaQuery<?> query, String token) {
        String tokenPersian = PersianTextNormalizer.normalize(token);
        String tokenArabic = tokenPersian.replace('ک', 'ك').replace('ی', 'ي');

        Predicate tokenPred = matchTokenPattern(cb, root, query, tokenPersian);
        if (!tokenPersian.equals(tokenArabic)) {
            tokenPred = cb.or(tokenPred, matchTokenPattern(cb, root, query, tokenArabic));
        }

        String tokenLatin = Digits.toLatin(token.toLowerCase());
        if (!tokenLatin.equals(tokenPersian) && !tokenLatin.equals(tokenArabic)) {
            tokenPred = cb.or(tokenPred, matchTokenPattern(cb, root, query, tokenLatin));
        }

        return tokenPred;
    }

    private Predicate matchTokenPattern(CriteriaBuilder cb, Root<Product> root, CriteriaQuery<?> query, String token) {
        String like = "%" + token.toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";

        // Product text fields (with ZWNJ-stripped and ZWNJ-spaced matching)
        Expression<String> nameFaLower = cb.lower(root.get("nameFa"));
        Expression<String> nameFaNoZwnj = cb.function("replace", String.class, nameFaLower, cb.literal("\u200C"), cb.literal(""));
        Expression<String> nameFaSpaced = cb.function("replace", String.class, nameFaLower, cb.literal("\u200C"), cb.literal(" "));
        Predicate nameFa = cb.or(
                cb.like(nameFaLower, like, '\\'),
                cb.like(nameFaNoZwnj, like, '\\'),
                cb.like(nameFaSpaced, like, '\\'));

        Predicate nameEn = cb.like(cb.lower(cb.coalesce(root.get("nameEn"), "")), like, '\\');

        Expression<String> descFaLower = cb.lower(cb.coalesce(root.get("descriptionFa"), ""));
        Expression<String> descFaNoZwnj = cb.function("replace", String.class, descFaLower, cb.literal("\u200C"), cb.literal(""));
        Predicate descFa = cb.or(
                cb.like(descFaLower, like, '\\'),
                cb.like(descFaNoZwnj, like, '\\'));

        Predicate descEn = cb.like(cb.lower(cb.coalesce(root.get("descriptionEn"), "")), like, '\\');

        // Brand match
        Subquery<Long> brandSub = query.subquery(Long.class);
        Root<Brand> b = brandSub.from(Brand.class);
        brandSub.select(b.get("id")).where(
                cb.equal(b.get("id"), root.get("brandId")),
                cb.or(
                        cb.like(cb.lower(b.get("nameFa")), like, '\\'),
                        cb.like(cb.lower(cb.coalesce(b.get("nameEn"), "")), like, '\\')));

        // Category match
        Subquery<Long> catSub = query.subquery(Long.class);
        Root<Category> c = catSub.from(Category.class);
        catSub.select(c.get("id")).where(
                cb.equal(c.get("id"), root.get("categoryId")),
                cb.or(
                        cb.like(cb.lower(c.get("nameFa")), like, '\\'),
                        cb.like(cb.lower(cb.coalesce(c.get("nameEn"), "")), like, '\\')));

        // Variant SKU match
        Subquery<Long> skuSub = query.subquery(Long.class);
        Root<Variant> v = skuSub.from(Variant.class);
        skuSub.select(v.get("id")).where(
                cb.equal(v.get("productId"), root.get("id")),
                cb.like(cb.lower(v.get("sku")), like, '\\'));

        return cb.or(nameFa, nameEn, descFa, descEn, cb.exists(brandSub), cb.exists(catSub), cb.exists(skuSub));
    }

    private void applySorting(String sort, Root<Product> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        if ("price_asc".equalsIgnoreCase(sort)) {
            Subquery<Long> minPriceSub = query.subquery(Long.class);
            Root<Variant> v = minPriceSub.from(Variant.class);
            minPriceSub.select(cb.min(v.get("basePrice"))).where(
                    cb.equal(v.get("productId"), root.get("id")),
                    cb.isTrue(v.get("active")));
            query.orderBy(cb.asc(minPriceSub), cb.desc(root.get("id")));
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            Subquery<Long> minPriceSub = query.subquery(Long.class);
            Root<Variant> v = minPriceSub.from(Variant.class);
            minPriceSub.select(cb.min(v.get("basePrice"))).where(
                    cb.equal(v.get("productId"), root.get("id")),
                    cb.isTrue(v.get("active")));
            query.orderBy(cb.desc(minPriceSub), cb.desc(root.get("id")));
        } else if ("popular".equalsIgnoreCase(sort)) {
            query.orderBy(cb.desc(root.get("featured")), cb.desc(root.get("id")));
        } else {
            // Default newest
            query.orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
        }
    }
}
