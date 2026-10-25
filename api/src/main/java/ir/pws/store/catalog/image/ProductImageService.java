package ir.pws.store.catalog.image;

import ir.pws.store.audit.AuditService;
import ir.pws.store.catalog.product.ProductRepository;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.config.AppProperties;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductImageService {

    /** Upload limit (also enforced by multipart config; checked here so the error is always FILE_TOO_LARGE). */
    public static final int MAX_BYTES = 5 * 1024 * 1024;

    private static final String ENTITY = "PRODUCT_IMAGE";

    private final ProductImageRepository images;
    private final ProductRepository products;
    private final ImageProcessor processor;
    private final MediaStorage storage;
    private final AuditService audit;
    private final String mediaBaseUrl;

    public ProductImageService(ProductImageRepository images, ProductRepository products, ImageProcessor processor,
            MediaStorage storage, AuditService audit, AppProperties props) {
        this.images = images;
        this.products = products;
        this.processor = processor;
        this.storage = storage;
        this.audit = audit;
        this.mediaBaseUrl = props.media() == null ? "/media" : props.media().baseUrl();
    }

    /** Throws FILE_TOO_LARGE when the upload exceeds the limit. */
    public static void checkSize(long size) {
        if (size > MAX_BYTES) {
            throw ApiException.field("file", "FILE_TOO_LARGE");
        }
    }

    @Transactional(readOnly = true)
    public List<ImageDto> listForProduct(long productId) {
        return images.findByProductIdOrderBySortOrderAscIdAsc(productId).stream().map(this::toDto).toList();
    }

    /** First image's 400 px URL per product id (products without images are absent); one query. */
    @Transactional(readOnly = true)
    public Map<Long, String> thumbUrls(Collection<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        return images.findFirstImages(productIds).stream()
                .collect(Collectors.toMap(ProductImage::getProductId, i -> mediaBaseUrl + "/" + i.thumbPath(),
                        (a, b) -> a));
    }

    @Transactional
    public ImageDto upload(long productId, byte[] bytes) {
        if (!products.existsById(productId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        checkSize(bytes.length);
        ProcessedImage processed = processor.process(bytes);
        String stem = "products/" + productId + "/" + UUID.randomUUID();
        Map<String, byte[]> files = new LinkedHashMap<>();
        files.put(stem + "-1600.webp", processed.large());
        files.put(stem + "-400.webp", processed.thumb());
        MediaTransactions.saveFiles(storage, files);
        ProductImage saved = images.saveAndFlush(new ProductImage(productId, stem, images.maxSortOrder(productId) + 1));
        ImageDto dto = toDto(saved);
        audit.record("PRODUCT_IMAGE_UPLOAD", ENTITY, saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public List<ImageDto> reorder(long productId, List<Long> imageIds) {
        if (!products.existsById(productId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        List<ProductImage> current = images.findByProductIdOrderBySortOrderAscIdAsc(productId);
        Set<Long> expected = current.stream().map(ProductImage::getId).collect(Collectors.toSet());
        if (imageIds.size() != expected.size() || !expected.equals(new HashSet<>(imageIds))) {
            throw ApiException.field("imageIds", "INVALID");
        }
        List<ImageDto> before = current.stream().map(this::toDto).toList();
        Map<Long, ProductImage> byId = current.stream().collect(Collectors.toMap(ProductImage::getId, Function.identity()));
        for (int i = 0; i < imageIds.size(); i++) {
            byId.get(imageIds.get(i)).setSortOrder(i);
        }
        images.flush();
        List<ImageDto> after = listForProduct(productId);
        audit.record("PRODUCT_IMAGES_REORDER", ENTITY, productId, before, after);
        return after;
    }

    @Transactional
    public ImageDto updateAlt(long imageId, ImageAltRequest req) {
        ProductImage image = find(imageId);
        ImageDto before = toDto(image);
        image.setAlt(trimToNull(req.altFa()), trimToNull(req.altEn()));
        images.saveAndFlush(image);
        ImageDto after = toDto(image);
        audit.record("PRODUCT_IMAGE_UPDATE", ENTITY, imageId, before, after);
        return after;
    }

    @Transactional
    public void delete(long imageId) {
        ProductImage image = find(imageId);
        ImageDto before = toDto(image);
        images.delete(image);
        images.flush();
        audit.record("PRODUCT_IMAGE_DELETE", ENTITY, imageId, before, null);
        MediaTransactions.deleteFilesAfterCommit(storage, List.of(image.largePath(), image.thumbPath()));
    }

    private ProductImage find(long id) {
        return images.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private ImageDto toDto(ProductImage image) {
        return ImageDto.from(image, mediaBaseUrl);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
