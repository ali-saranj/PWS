package ir.pws.store.catalog;

import ir.pws.store.catalog.PublicCatalogService.PublicBrandDto;
import ir.pws.store.catalog.PublicCatalogService.PublicCategoryDetailDto;
import ir.pws.store.catalog.PublicCatalogService.PublicCategoryDto;
import ir.pws.store.catalog.dto.HomeCatalogResponse;
import ir.pws.store.catalog.dto.ProductDetailResponse;
import ir.pws.store.catalog.dto.ProductSummaryResponse;
import ir.pws.store.common.web.PageResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/catalog")
public class PublicCatalogController {

    private final PublicCatalogService service;

    public PublicCatalogController(PublicCatalogService service) {
        this.service = service;
    }

    @GetMapping("/home")
    public HomeCatalogResponse getHome() {
        return service.getHome();
    }

    @GetMapping("/categories")
    public List<PublicCategoryDto> listCategories() {
        return service.listCategories();
    }

    @GetMapping("/categories/{slug}")
    public PublicCategoryDetailDto getCategory(@PathVariable String slug) {
        return service.getCategoryBySlug(slug);
    }

    @GetMapping("/brands")
    public List<PublicBrandDto> listBrands() {
        return service.listBrands();
    }

    @GetMapping("/brands/{slug}")
    public PublicBrandDto getBrand(@PathVariable String slug) {
        return service.getBrandBySlug(slug);
    }

    @GetMapping("/products")
    public PageResponse<ProductSummaryResponse> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String brandSlug,
            @RequestParam(required = false) List<Long> brandIds,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listProducts(
                categoryId,
                categorySlug,
                brandId,
                brandSlug,
                brandIds,
                inStock,
                onSale,
                minPrice,
                maxPrice,
                sort,
                page,
                size);
    }

    @GetMapping("/search")
    public PageResponse<ProductSummaryResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.search(q, page, size);
    }

    @GetMapping("/products/{slug}")
    public ProductDetailResponse getProduct(@PathVariable String slug) {
        return service.getProductBySlug(slug);
    }
}
