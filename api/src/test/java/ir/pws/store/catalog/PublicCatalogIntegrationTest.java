package ir.pws.store.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.support.IntegrationTest;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class PublicCatalogIntegrationTest extends IntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectMapper json;

    long brandId;
    long parentCategoryId;
    long childCategoryId;

    @BeforeEach
    void setUpCatalogData() {
        brandId = jdbc.queryForObject(
                "insert into brand (name_fa, name_en, slug) values ('کاله', 'Kalleh', 'kalleh') returning id",
                Long.class);

        parentCategoryId = jdbc.queryForObject(
                "insert into category (name_fa, name_en, slug, sort_order, active) values ('مکمل ورزشی', 'Supplements', 'supplements', 1, true) returning id",
                Long.class);

        childCategoryId = jdbc.queryForObject(
                "insert into category (name_fa, name_en, slug, parent_id, sort_order, active) values ('پروتئین', 'Protein', 'protein', ?, 2, true) returning id",
                Long.class, parentCategoryId);

        // Inactive category
        jdbc.execute("insert into category (name_fa, name_en, slug, sort_order, active) values ('غیرفعال', 'Inactive', 'inactive', 3, false)");
    }

    private long createProduct(String slug, String nameFa, String nameEn, String descFa, long catId, String status, boolean featured) {
        return createProduct(brandId, slug, nameFa, nameEn, descFa, catId, status, featured);
    }

    private long createProduct(long bId, String slug, String nameFa, String nameEn, String descFa, long catId, String status, boolean featured) {
        return jdbc.queryForObject(
                "insert into product (brand_id, category_id, slug, name_fa, name_en, description_fa, status, featured) " +
                        "values (?, ?, ?, ?, ?, ?, ?, ?) returning id",
                Long.class, bId, catId, slug, nameFa, nameEn, descFa, status, featured);
    }

    private long createVariant(long productId, String sku, long basePrice, Long compareAtPrice, int stock, boolean active, int sortOrder) {
        return jdbc.queryForObject(
                "insert into variant (product_id, sku, base_price, compare_at_price, stock_on_hand, active, sort_order) " +
                        "values (?, ?, ?, ?, ?, ?, ?) returning id",
                Long.class, productId, sku, basePrice, compareAtPrice, stock, active, sortOrder);
    }

    private void addVolumeTier(long variantId, int minQty, long unitPrice) {
        jdbc.update("insert into volume_tier (variant_id, min_qty, unit_price) values (?, ?, ?)",
                variantId, minQty, unitPrice);
    }

    @Test
    @DisplayName("GET /api/shop/catalog/home returns categories, special offers, and popular products")
    void homeReturnsCategoriesAndCuratedSections() throws Exception {
        // Product 1: On Sale (compareAtPrice > basePrice) & featured
        long p1 = createProduct("whey-protein", "پروتئین وی", "Whey Protein", "توضیحات وی", childCategoryId, "ACTIVE", true);
        createVariant(p1, "WHEY-1", 1_500_000L, 1_800_000L, 10, true, 0);

        // Product 2: Volume tier ("تخفیف پلکانی")
        long p2 = createProduct("creatine", "کراتین", "Creatine", "توضیحات کراتین", childCategoryId, "ACTIVE", false);
        long v2 = createVariant(p2, "CREAT-1", 900_000L, null, 15, true, 0);
        addVolumeTier(v2, 3, 800_000L);

        // Product 3: Regular active product
        long p3 = createProduct("glutamine", "گلوتامین", "Glutamine", "توضیحات گلوتامین", childCategoryId, "ACTIVE", false);
        createVariant(p3, "GLUT-1", 700_000L, null, 5, true, 0);

        // Product 4: Draft product (should never appear)
        long p4 = createProduct("bcaa-draft", "بی‌سی‌دابل‌ای", "BCAA", "توضیحات", childCategoryId, "DRAFT", true);
        createVariant(p4, "BCAA-1", 500_000L, 600_000L, 20, true, 0);

        String response = mvc.perform(get("/api/shop/catalog/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories").isArray())
                .andExpect(jsonPath("$.specialOffers").isArray())
                .andExpect(jsonPath("$.popularProducts").isArray())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(response);
        JsonNode categories = root.get("categories");
        JsonNode specialOffers = root.get("specialOffers");
        JsonNode popularProducts = root.get("popularProducts");

        // Categories should contain active categories only
        List<String> categorySlugs = categories.findValuesAsText("slug");
        assertThat(categorySlugs).contains("supplements", "protein");
        assertThat(categorySlugs).doesNotContain("inactive");

        // Special offers should include p1 (on sale) and p2 (volume tiers), not p3 or draft p4
        List<String> offerSlugs = specialOffers.findValuesAsText("slug");
        assertThat(offerSlugs).contains("whey-protein", "creatine");
        assertThat(offerSlugs).doesNotContain("glutamine", "bcaa-draft");

        // Popular products should include featured p1
        List<String> popularSlugs = popularProducts.findValuesAsText("slug");
        assertThat(popularSlugs).contains("whey-protein");
        assertThat(popularSlugs).doesNotContain("bcaa-draft");
    }

    @Test
    @DisplayName("GET /api/shop/catalog/products filters by category and sorts by price")
    void productsFilterAndSort() throws Exception {
        long otherCatId = jdbc.queryForObject(
                "insert into category (name_fa, name_en, slug, sort_order, active) values ('ویتامین', 'Vitamins', 'vitamins', 3, true) returning id",
                Long.class);

        // P1: In Protein, price 1,000,000 Rials
        long p1 = createProduct("p1", "محصول یک", "Product 1", "توضیحات", childCategoryId, "ACTIVE", false);
        createVariant(p1, "SKU-P1", 1_000_000L, null, 10, true, 0);

        // P2: In Protein, price 2_500_000 Rials
        long p2 = createProduct("p2", "محصول دو", "Product 2", "توضیحات", childCategoryId, "ACTIVE", false);
        createVariant(p2, "SKU-P2", 2_500_000L, null, 10, true, 0);

        // P3: In Vitamins, price 1_800_000 Rials
        long p3 = createProduct("p3", "محصول سه", "Product 3", "توضیحات", otherCatId, "ACTIVE", false);
        createVariant(p3, "SKU-P3", 1_800_000L, null, 10, true, 0);

        // P4: In Protein, but DRAFT (must be excluded)
        long p4 = createProduct("p4", "محصول چهار", "Product 4", "توضیحات", childCategoryId, "DRAFT", false);
        createVariant(p4, "SKU-P4", 500_000L, null, 10, true, 0);

        // P5: In Protein, ACTIVE but no active variants (must be excluded)
        long p5 = createProduct("p5", "محصول پنج", "Product 5", "توضیحات", childCategoryId, "ACTIVE", false);
        createVariant(p5, "SKU-P5", 500_000L, null, 10, false, 0);

        // 1. Filter by Protein category
        mvc.perform(get("/api/shop/catalog/products").param("categoryId", String.valueOf(childCategoryId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[?(@.slug == 'p1')]").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'p1')].defaultVariantId").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'p2')]").exists());

        // 2. Sort by price ascending
        mvc.perform(get("/api/shop/catalog/products").param("sort", "price_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slug").value("p1"))
                .andExpect(jsonPath("$.items[1].slug").value("p3"))
                .andExpect(jsonPath("$.items[2].slug").value("p2"));

        // 3. Sort by price descending
        mvc.perform(get("/api/shop/catalog/products").param("sort", "price_desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slug").value("p2"))
                .andExpect(jsonPath("$.items[1].slug").value("p3"))
                .andExpect(jsonPath("$.items[2].slug").value("p1"));

        // 4. Filter by price range: 1,500,000 to 2,000,000 Rials
        mvc.perform(get("/api/shop/catalog/products")
                        .param("minPrice", "1500000")
                        .param("maxPrice", "2000000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("p3"));
    }

    @Test
    @DisplayName("GET /api/shop/catalog/search matches description, SKU, and Persian digits")
    void searchFindsProductsByKeywordsDescriptionSkuAndPersianDigits() throws Exception {
        // Product 1: Description has "کافئین و تائورین"
        long p1 = createProduct("energy-powder", "پودر انرژی", "Energy Powder",
                "<p>حاوی کافئین و تائورین برای افزایش تمرکز</p>", childCategoryId, "ACTIVE", false);
        createVariant(p1, "ENERGY-001", 600_000L, null, 10, true, 0);

        // Product 2: Variant SKU is "WHEY-100"
        long p2 = createProduct("whey-100", "پروتئین صد درصد", "Pure 100 Whey",
                "<p>پروتئین کنسانتره صد در صد خالص</p>", childCategoryId, "ACTIVE", false);
        createVariant(p2, "WHEY-100", 2_000_000L, null, 10, true, 0);

        // 1. Search keyword in descriptionHtml
        mvc.perform(get("/api/shop/catalog/search").param("q", "تائورین"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("energy-powder"));

        // 2. Search exact SKU
        mvc.perform(get("/api/shop/catalog/search").param("q", "ENERGY-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("energy-powder"));

        // 3. Search SKU with Persian digits: "WHEY-۱۰۰" -> maps to "WHEY-100"
        mvc.perform(get("/api/shop/catalog/search").param("q", "WHEY-۱۰۰"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("whey-100"));
    }

    @Test
    @DisplayName("GET /api/shop/catalog/products/{slug} returns detail with breadcrumbs & variants, or 404")
    void productDetailReturnsVariantsTiersBreadcrumbsAnd404OnDraft() throws Exception {
        long p = createProduct("gold-whey", "وی گلد استاندارد", "Gold Standard Whey",
                "<p>بهترین پروتئین وی</p>", childCategoryId, "ACTIVE", true);

        long v1 = createVariant(p, "GW-VAN-2KG", 3_000_000L, 3_500_000L, 8, true, 1);
        addVolumeTier(v1, 2, 2_800_000L);
        addVolumeTier(v1, 5, 2_600_000L);

        long v2 = createVariant(p, "GW-CHOC-2KG", 3_100_000L, null, 0, true, 2);

        // Inactive variant of same product (should be excluded)
        createVariant(p, "GW-STRAW-2KG", 3_000_000L, null, 5, false, 3);

        // Add an image
        jdbc.update("insert into product_image (product_id, path, sort_order, alt_fa) values (?, 'products/1/img', 0, 'عکس وی')", p);

        // 1. Successfully retrieve active product detail
        mvc.perform(get("/api/shop/catalog/products/gold-whey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("gold-whey"))
                .andExpect(jsonPath("$.nameFa").value("وی گلد استاندارد"))
                .andExpect(jsonPath("$.brandNameFa").value("کاله"))
                .andExpect(jsonPath("$.categoryNameFa").value("پروتئین"))
                .andExpect(jsonPath("$.basePriceRials").value(3_000_000L))
                .andExpect(jsonPath("$.priceToman").value(300_000L))
                .andExpect(jsonPath("$.inStock").value(true))
                // Breadcrumbs: root -> child
                .andExpect(jsonPath("$.breadcrumb[0].slug").value("supplements"))
                .andExpect(jsonPath("$.breadcrumb[1].slug").value("protein"))
                // Variants: only active variants (v1 and v2), sorted
                .andExpect(jsonPath("$.variants.length()").value(2))
                .andExpect(jsonPath("$.variants[0].sku").value("GW-VAN-2KG"))
                .andExpect(jsonPath("$.variants[0].tiers.length()").value(2))
                .andExpect(jsonPath("$.variants[0].tiers[0].minQty").value(2))
                .andExpect(jsonPath("$.variants[0].tiers[0].unitPriceRials").value(2_800_000L))
                .andExpect(jsonPath("$.variants[0].tiers[0].unitPriceToman").value(280_000L))
                .andExpect(jsonPath("$.variants[1].sku").value("GW-CHOC-2KG"))
                .andExpect(jsonPath("$.variants[1].inStock").value(false))
                // Images
                .andExpect(jsonPath("$.images.length()").value(1));

        // 2. Draft product returns 404
        long draftId = createProduct("draft-whey", "وی پیش‌نویس", "Draft Whey", "متن", childCategoryId, "DRAFT", false);
        createVariant(draftId, "DRAFT-1", 1_000_000L, null, 5, true, 0);

        mvc.perform(get("/api/shop/catalog/products/draft-whey"))
                .andExpect(status().isNotFound());

        // 3. Non-existent product returns 404
        mvc.perform(get("/api/shop/catalog/products/does-not-exist"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/shop/catalog/products filters by brand, onSale, and sorts by popular")
    void productsFilterByBrandAndOnSaleAndSortPopular() throws Exception {
        long brand2 = jdbc.queryForObject(
                "insert into brand (name_fa, name_en, slug) values ('پگاه', 'Pegah', 'pegah') returning id",
                Long.class);

        // Product 1: Kalleh, On Sale (compareAtPrice > basePrice), featured = false
        long p1 = createProduct("p1-sale", "محصول تخفیف", "Sale Product", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p1, "SKU-SALE", 1_000_000L, 1_200_000L, 5, true, 0);

        // Product 2: Kalleh, regular, featured = true
        long p2 = createProduct("p2-featured", "محصول ویژه", "Featured Product", "متن", childCategoryId, "ACTIVE", true);
        createVariant(p2, "SKU-FEAT", 1_500_000L, null, 10, true, 0);

        // Product 3: Pegah, regular, featured = false
        long p3 = createProduct(brand2, "p3-pegah", "محصول پگاه", "Pegah Product", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p3, "SKU-PEG", 2_000_000L, null, 10, true, 0);

        // Filter by brand2 (Pegah)
        mvc.perform(get("/api/shop/catalog/products").param("brandId", String.valueOf(brand2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("p3-pegah"));

        // Filter by onSale=true
        mvc.perform(get("/api/shop/catalog/products").param("onSale", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("p1-sale"))
                .andExpect(jsonPath("$.items[0].badges").isArray());

        // Sort by popular (featured first)
        mvc.perform(get("/api/shop/catalog/products").param("sort", "popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slug").value("p2-featured"));
    }

    @Test
    @DisplayName("GET /api/shop/catalog/search with empty query returns paginated active products")
    void searchEmptyQueryReturnsActiveProducts() throws Exception {
        long p1 = createProduct("search-all-1", "محصول یک", "Product 1", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p1, "SKU-ALL-1", 1_000_000L, null, 5, true, 0);

        long p2 = createProduct("search-all-2", "محصول دو", "Product 2", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p2, "SKU-ALL-2", 2_000_000L, null, 5, true, 0);

        mvc.perform(get("/api/shop/catalog/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));
    }

    @Test
    @DisplayName("GET /api/shop/catalog/products filters by inStock")
    void productsFilterByInStockOnly() throws Exception {
        // Product A: active variant with stock 5
        long pA = createProduct("product-in-stock", "محصول موجود", "In Stock Product", "متن", childCategoryId, "ACTIVE", false);
        createVariant(pA, "SKU-IN-STOCK", 1_000_000L, null, 5, true, 0);

        // Product B: active variant with stock 0
        long pB = createProduct("product-out-of-stock", "محصول ناموجود", "Out of Stock Product", "متن", childCategoryId, "ACTIVE", false);
        createVariant(pB, "SKU-OUT-OF-STOCK", 1_000_000L, null, 0, true, 0);

        // Query inStock=true
        mvc.perform(get("/api/shop/catalog/products").param("inStock", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("product-in-stock"));
    }

    @Test
    @DisplayName("GET /api/shop/catalog/brands returns active brands")
    void publicBrandsEndpointReturnsActiveBrands() throws Exception {
        // Inactive brand
        jdbc.execute("insert into brand (name_fa, name_en, slug, active) values ('برند غیرفعال', 'Inactive Brand', 'inactive-brand', false)");

        // Another active brand
        jdbc.execute("insert into brand (name_fa, name_en, slug, active) values ('دامداران', 'Damdaran', 'damdaran', true)");

        mvc.perform(get("/api/shop/catalog/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.slug == 'kalleh')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'damdaran')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'inactive-brand')]").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/shop/catalog/products filters by categorySlug")
    void productsFilterByCategorySlug() throws Exception {
        long otherCatId = jdbc.queryForObject(
                "insert into category (name_fa, name_en, slug, sort_order, active) values ('ویتامین', 'Vitamins', 'vitamins', 3, true) returning id",
                Long.class);

        long p1 = createProduct("p-protein", "پروتئین", "Protein", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p1, "SKU-PROT", 1_000_000L, null, 10, true, 0);

        long p2 = createProduct("p-vit", "ویتامین", "Vitamin", "متن", otherCatId, "ACTIVE", false);
        createVariant(p2, "SKU-VIT", 1_000_000L, null, 10, true, 0);

        mvc.perform(get("/api/shop/catalog/products").param("categorySlug", "protein"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("p-protein"));
    }

    @Test
    @DisplayName("GET /api/shop/catalog/products filters by brandSlug and brandIds")
    void productsFilterByBrandSlugAndBrandIds() throws Exception {
        long brand2 = jdbc.queryForObject(
                "insert into brand (name_fa, name_en, slug) values ('پگاه', 'Pegah', 'pegah') returning id",
                Long.class);
        long brand3 = jdbc.queryForObject(
                "insert into brand (name_fa, name_en, slug) values ('میهن', 'Mihan', 'mihan') returning id",
                Long.class);

        long p1 = createProduct(brandId, "p-kalleh", "کاله", "Kalleh", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p1, "SKU-K", 1_000_000L, null, 10, true, 0);

        long p2 = createProduct(brand2, "p-pegah", "پگاه", "Pegah", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p2, "SKU-P", 1_000_000L, null, 10, true, 0);

        long p3 = createProduct(brand3, "p-mihan", "میهن", "Mihan", "متن", childCategoryId, "ACTIVE", false);
        createVariant(p3, "SKU-M", 1_000_000L, null, 10, true, 0);

        // Test brandSlug
        mvc.perform(get("/api/shop/catalog/products").param("brandSlug", "pegah"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("p-pegah"));

        // Test brandIds
        mvc.perform(get("/api/shop/catalog/products")
                        .param("brandIds", String.valueOf(brandId) + "," + String.valueOf(brand3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[?(@.slug == 'p-kalleh')]").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'p-mihan')]").exists());
    }

    @Test
    @DisplayName("GET /api/shop/catalog/brands includes logoUrl and excludes inactive brands")
    void listBrandsIncludesLogoUrl() throws Exception {
        jdbc.update("update brand set logo_path = 'brands/kalleh.webp' where id = ?", brandId);
        long inactiveBrandId = jdbc.queryForObject(
                "insert into brand (name_fa, name_en, slug, active) values ('غیرفعال', 'Inactive', 'inactive-brand', false) returning id",
                Long.class);

        mvc.perform(get("/api/shop/catalog/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'kalleh')].logoUrl").value("/media/brands/kalleh.webp"))
                .andExpect(jsonPath("$[?(@.slug == 'inactive-brand')]").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/shop/catalog/brands/{slug} returns brand detail or 404")
    void getBrandBySlugReturnsBrandDetailOr404() throws Exception {
        jdbc.update("update brand set logo_path = 'brands/kalleh.webp' where id = ?", brandId);

        // Success case
        mvc.perform(get("/api/shop/catalog/brands/kalleh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(brandId))
                .andExpect(jsonPath("$.slug").value("kalleh"))
                .andExpect(jsonPath("$.nameFa").value("کاله"))
                .andExpect(jsonPath("$.nameEn").value("Kalleh"))
                .andExpect(jsonPath("$.logoUrl").value("/media/brands/kalleh.webp"));

        // Non-existent slug -> 404
        mvc.perform(get("/api/shop/catalog/brands/non-existent-brand"))
                .andExpect(status().isNotFound());

        // Inactive slug -> 404
        jdbc.execute("insert into brand (name_fa, name_en, slug, active) values ('غیرفعال', 'Inactive', 'inactive-slug', false)");
        mvc.perform(get("/api/shop/catalog/brands/inactive-slug"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/shop/catalog/categories returns active categories sorted by sortOrder and id")
    void listCategoriesReturnsActiveCategories() throws Exception {
        mvc.perform(get("/api/shop/catalog/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].slug").value("supplements"))
                .andExpect(jsonPath("$[0].nameFa").value("مکمل ورزشی"))
                .andExpect(jsonPath("$[0].parentId").doesNotExist())
                .andExpect(jsonPath("$[1].slug").value("protein"))
                .andExpect(jsonPath("$[1].parentId").value(parentCategoryId))
                .andExpect(jsonPath("$[?(@.slug == 'inactive')]").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/shop/catalog/categories/{slug} returns category detail, breadcrumbs, and subcategories")
    void getCategoryBySlugReturnsDetailsAndHierarchy() throws Exception {
        // Test parent category (has subcategories)
        mvc.perform(get("/api/shop/catalog/categories/supplements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(parentCategoryId))
                .andExpect(jsonPath("$.slug").value("supplements"))
                .andExpect(jsonPath("$.nameFa").value("مکمل ورزشی"))
                .andExpect(jsonPath("$.breadcrumbs").isArray())
                .andExpect(jsonPath("$.breadcrumbs[0].slug").value("supplements"))
                .andExpect(jsonPath("$.subcategories").isArray())
                .andExpect(jsonPath("$.subcategories[0].slug").value("protein"));

        // Test child category (has ancestor breadcrumbs)
        mvc.perform(get("/api/shop/catalog/categories/protein"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(childCategoryId))
                .andExpect(jsonPath("$.slug").value("protein"))
                .andExpect(jsonPath("$.nameFa").value("پروتئین"))
                .andExpect(jsonPath("$.breadcrumbs").isArray())
                .andExpect(jsonPath("$.breadcrumbs[0].slug").value("supplements"))
                .andExpect(jsonPath("$.breadcrumbs[1].slug").value("protein"))
                .andExpect(jsonPath("$.subcategories").isEmpty());

        // Non-existent slug -> 404
        mvc.perform(get("/api/shop/catalog/categories/non-existent-category"))
                .andExpect(status().isNotFound());

        // Inactive slug -> 404
        mvc.perform(get("/api/shop/catalog/categories/inactive"))
                .andExpect(status().isNotFound());
    }
}
