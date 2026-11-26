package ir.pws.store.catalog.category;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.text.Slugs;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private static final String ENTITY = "CATEGORY";

    private final CategoryRepository categories;
    private final AuditService audit;
    private final ProductRepository products;

    public CategoryService(CategoryRepository categories, AuditService audit, ProductRepository products) {
        this.categories = categories;
        this.audit = audit;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> list() {
        return categories.findAll(Sort.by("sortOrder", "id")).stream()
                .map(CategoryDto::from)
                .toList();
    }

    @Transactional
    public CategoryDto create(CategoryRequest req) {
        String nameFa = req.nameFa().trim();
        String slug = checkSlug(req.slug(), null);
        requireParent(req.parentId());
        Category category = new Category(req.parentId(), nameFa, trimToNull(req.nameEn()), slug, req.sortOrder(), req.active());
        category.updateSeo(
                trimToNull(req.seoTitle()),
                trimToNull(req.seoDescription()),
                trimToNull(req.seoH1()),
                trimToNull(req.seoContentFa()));
        Category saved = categories.saveAndFlush(category);
        CategoryDto dto = CategoryDto.from(saved);
        audit.record("CATEGORY_CREATE", ENTITY, saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public CategoryDto update(long id, CategoryRequest req) {
        Category category = find(id);
        String nameFa = req.nameFa().trim();
        String slug = checkSlug(req.slug(), id);
        requireParent(req.parentId());
        requireNoCycle(id, req.parentId());
        CategoryDto before = CategoryDto.from(category);
        category.update(req.parentId(), nameFa, trimToNull(req.nameEn()), slug, req.sortOrder(), req.active());
        category.updateSeo(
                trimToNull(req.seoTitle()),
                trimToNull(req.seoDescription()),
                trimToNull(req.seoH1()),
                trimToNull(req.seoContentFa()));
        categories.saveAndFlush(category);
        CategoryDto after = CategoryDto.from(category);
        audit.record("CATEGORY_UPDATE", ENTITY, id, before, after);
        return after;
    }

    @Transactional
    public void delete(long id) {
        Category category = find(id);
        assertDeletable(id);
        CategoryDto before = CategoryDto.from(category);
        categories.delete(category);
        categories.flush();
        audit.record("CATEGORY_DELETE", ENTITY, id, before, null);
    }

    /** Throws RESOURCE_IN_USE when the category cannot be removed. */
    public void assertDeletable(long id) {
        if (categories.existsByParentId(id) || products.existsByCategoryId(id)) {
            throw new ApiException(ErrorCode.RESOURCE_IN_USE);
        }
    }

    private Category find(long id) {
        return categories.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private String checkSlug(String raw, Long selfId) {
        String slug = raw.trim();
        if (!Slugs.isValid(slug)) {
            throw ApiException.field("slug", "SLUG_INVALID");
        }
        boolean taken = selfId == null
                ? categories.existsBySlug(slug)
                : categories.existsBySlugAndIdNot(slug, selfId);
        if (taken) {
            throw ApiException.field("slug", "DUPLICATE");
        }
        return slug;
    }

    private void requireParent(Long parentId) {
        if (parentId != null && !categories.existsById(parentId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
    }

    /** Walks up the proposed parent chain; reaching {@code id} means the parent is the category or a descendant. */
    private void requireNoCycle(long id, Long parentId) {
        if (parentId == null) {
            return;
        }
        Map<Long, Long> parentOf = categories.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c.getParentId() == null ? -1L : c.getParentId(),
                        (a, b) -> a));
        long current = parentId;
        for (int steps = 0; current != -1L && steps <= parentOf.size(); steps++) {
            if (current == id) {
                throw ApiException.field("parentId", "CATEGORY_CYCLE");
            }
            current = parentOf.getOrDefault(current, -1L);
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
