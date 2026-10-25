package ir.pws.store.catalog.image;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ir.pws.store.common.error.ApiException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

class ImageProcessorTest {

    private final ImageProcessor processor = new ImageProcessor();

    private static void assertWebp(byte[] bytes) {
        assertThat(new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("RIFF");
        assertThat(new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("WEBP");
    }

    @Test
    void jpeg_isResizedTo1600And400Webp() {
        ProcessedImage out = processor.process(TestImages.jpeg(2400, 1600));
        assertWebp(out.large());
        assertWebp(out.thumb());
        assertThat(TestImages.width(out.large())).isEqualTo(1600);
        assertThat(TestImages.width(out.thumb())).isEqualTo(400);
    }

    @Test
    void smallImage_isNotUpscaled() {
        ProcessedImage out = processor.process(TestImages.png(300, 200));
        assertThat(TestImages.width(out.large())).isEqualTo(300);
        assertThat(TestImages.width(out.thumb())).isEqualTo(300);
    }

    @Test
    void textFile_isImageInvalid() {
        assertInvalid(TestImages.notImage());
    }

    @Test
    void fakeJpg_isImageInvalid() {
        assertInvalid(TestImages.fakeJpg());
    }

    @Test
    void truncatedJpeg_isImageInvalid() {
        assertInvalid(TestImages.truncatedJpeg());
    }

    @Test
    void decompressionBomb_isRejectedBeforeDecoding() throws Exception {
        // 7000 x 7000 = 49 MP of a single colour: tiny PNG, huge raster.
        BufferedImage big = new BufferedImage(7000, 7000, BufferedImage.TYPE_BYTE_GRAY);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(big, "png", out);
        assertThat(out.size()).isLessThan(1_000_000);
        assertInvalid(out.toByteArray());
    }

    @Test
    void exifOrientation6_rotatesToPortrait() {
        ProcessedImage out = processor.process(TestImages.jpegWithOrientation(300, 200, 6));
        assertThat(TestImages.width(out.large())).isEqualTo(200);
        assertThat(TestImages.height(out.large())).isEqualTo(300);
        assertThat(TestImages.width(out.thumb())).isEqualTo(200);
    }

    @Test
    void exifOrientation6_largeSource_isResizedByOrientedWidth() {
        ProcessedImage out = processor.process(TestImages.jpegWithOrientation(3000, 2000, 6));
        assertThat(TestImages.width(out.large())).isEqualTo(1600);
        assertThat(TestImages.height(out.large())).isEqualTo(2400);
        assertThat(TestImages.width(out.thumb())).isEqualTo(400);
        assertThat(TestImages.height(out.thumb())).isEqualTo(600);
    }

    @Test
    void exifOrientation1_orAbsent_isUnchanged() {
        for (byte[] jpg : new byte[][] {TestImages.jpegWithOrientation(300, 200, 1), TestImages.jpeg(300, 200)}) {
            ProcessedImage out = processor.process(jpg);
            assertThat(TestImages.width(out.large())).isEqualTo(300);
            assertThat(TestImages.height(out.large())).isEqualTo(200);
        }
    }

    @Test
    void encoderFailure_isNotReportedAsImageInvalid() {
        var broken = new ImageProcessor(() -> {
            throw new IllegalStateException("No WebP ImageWriter available");
        });
        assertThatThrownBy(() -> broken.process(TestImages.png(100, 100)))
                .isInstanceOf(IllegalStateException.class)
                .isNotInstanceOf(ApiException.class);
    }

    private void assertInvalid(byte[] bytes) {
        assertThatThrownBy(() -> processor.process(bytes)).isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).errors().get(0).code()).isEqualTo("IMAGE_INVALID"));
    }
}
