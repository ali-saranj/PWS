package ir.pws.store.catalog.image;

import ir.pws.store.common.error.ApiException;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import org.springframework.stereotype.Component;

/** Validates an uploaded JPEG/PNG/WebP and produces the 1600 px and 400 px WebP renditions (never upscaled). */
@Component
public class ImageProcessor {

    static final int LARGE_WIDTH = 1600;
    static final int THUMB_WIDTH = 400;
    static final long MAX_PIXELS = 40_000_000L;
    private static final float QUALITY = 0.82f;

    public ProcessedImage process(byte[] input) {
        if (input == null || !hasKnownMagic(input)) {
            throw invalid();
        }
        BufferedImage source = decode(input);
        try {
            return new ProcessedImage(encode(resize(source, LARGE_WIDTH)), encode(resize(source, THUMB_WIDTH)));
        } catch (IOException | RuntimeException e) {
            throw invalid();
        }
    }

    private static BufferedImage decode(byte[] input) {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(input))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) {
                throw invalid();
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                // Dimensions first: reject decompression bombs before allocating the raster.
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels <= 0 || pixels > MAX_PIXELS) {
                    throw invalid();
                }
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw invalid();
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ApiException api) {
                throw api;
            }
            throw invalid();
        }
    }

    private static BufferedImage resize(BufferedImage src, int maxWidth) {
        int targetW = Math.min(src.getWidth(), maxWidth);
        int type = src.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage current = src;
        if (current.getType() != type && targetW == src.getWidth()) {
            return redraw(current, current.getWidth(), current.getHeight(), type);
        }
        // Halve repeatedly (keeps quality), then a final bicubic step to the exact width.
        while (current.getWidth() / 2 >= targetW && targetW != current.getWidth()) {
            current = redraw(current, current.getWidth() / 2, Math.max(1, current.getHeight() / 2), type);
        }
        if (current.getWidth() != targetW) {
            int h = Math.max(1, Math.round((float) src.getHeight() * targetW / src.getWidth()));
            current = redraw(current, targetW, h, type);
        }
        return current;
    }

    private static BufferedImage redraw(BufferedImage src, int w, int h, int type) {
        BufferedImage out = new BufferedImage(w, h, type);
        var g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(src, 0, 0, w, h, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private static byte[] encode(BufferedImage image) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");
        if (!writers.hasNext()) {
            throw new IllegalStateException("No WebP ImageWriter available");
        }
        ImageWriter writer = writers.next();
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                MemoryCacheImageOutputStream out = new MemoryCacheImageOutputStream(bytes)) {
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionType("Lossy");
            param.setCompressionQuality(QUALITY);
            writer.setOutput(out);
            writer.write(null, new IIOImage(image, null, null), param);
            out.flush();
            return bytes.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    private static boolean hasKnownMagic(byte[] b) {
        boolean jpeg = b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
        boolean png = b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A;
        boolean webp = b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W'
                && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        return jpeg || png || webp;
    }

    private static ApiException invalid() {
        return ApiException.field("file", "IMAGE_INVALID");
    }
}
