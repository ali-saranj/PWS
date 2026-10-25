package ir.pws.store.catalog.image;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.security.Roles;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize(Roles.CATALOG)
public class ProductImageController {

    private final ProductImageService service;

    public ProductImageController(ProductImageService service) {
        this.service = service;
    }

    @PostMapping("/products/{productId}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public ImageDto upload(@PathVariable long productId, @RequestParam("file") MultipartFile file) {
        return service.upload(productId, bytes(file));
    }

    @PutMapping("/products/{productId}/images/order")
    public List<ImageDto> reorder(@PathVariable long productId, @Valid @RequestBody ImageOrderRequest request) {
        return service.reorder(productId, request.imageIds());
    }

    @PutMapping("/images/{imageId}")
    public ImageDto updateAlt(@PathVariable long imageId, @Valid @RequestBody ImageAltRequest request) {
        return service.updateAlt(imageId, request);
    }

    @DeleteMapping("/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long imageId) {
        service.delete(imageId);
    }

    /** Reads an upload, rejecting oversized files before copying them into memory. */
    public static byte[] bytes(MultipartFile file) {
        ProductImageService.checkSize(file.getSize());
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw ApiException.field("file", "IMAGE_INVALID");
        }
    }
}
