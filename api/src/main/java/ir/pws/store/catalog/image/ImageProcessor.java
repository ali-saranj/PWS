package ir.pws.store.catalog.image;

import ir.pws.store.common.error.ApiException;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Iterator;
import java.util.function.Supplier;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Validates an uploaded JPEG/PNG/WebP and produces the 1600 px and 400 px WebP renditions (never upscaled). */
@Component
public class ImageProcessor {

    static final int LARGE_WIDTH = 1600;
    static final int THUMB_WIDTH = 400;
    static final long MAX_PIXELS = 40_000_000L;
    private static final float QUALITY = 0.82f;

    private final Supplier<ImageWriter> writerSupplier;

    @Autowired
    public ImageProcessor() {
        this(() -> {
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");
            if (!writers.hasNext()) {
                throw new IllegalStateException("No WebP ImageWriter available");
            }
            return writers.next();
        });
    }

    /** Test seam: supplies the WebP writer. */
    ImageProcessor(Supplier<ImageWriter> writerSupplier) {
        this.writerSupplier = writerSupplier;
    }

    public ProcessedImage process(byte[] input) {
        if (input == null || !hasKnownMagic(input)) {
            throw invalid();
        }
        int orientation = exifOrientation(input);
        BufferedImage source = decode(input);
        // Failures from here on are server faults, not bad input: let them propagate (logged as INTERNAL_ERROR).
        try {
            return new ProcessedImage(encode(render(source, orientation, LARGE_WIDTH)),
                    encode(render(source, orientation, THUMB_WIDTH)));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Resizes so the final (post-orientation) width is min(width, maxWidth), then applies the orientation. */
    private static BufferedImage render(BufferedImage src, int orientation, int maxWidth) {
        boolean swap = orientation >= 5;
        int orientedW = swap ? src.getHeight() : src.getWidth();
        double scale = Math.min(1.0, (double) maxWidth / orientedW);
        int srcTargetW = scale >= 1.0 ? src.getWidth() : Math.max(1, (int) Math.round(src.getWidth() * scale));
        BufferedImage resized = resize(src, srcTargetW);
        return orientation <= 1 ? resized : orient(resized, orientation);
    }

    private static BufferedImage orient(BufferedImage img, int orientation) {
        int w = img.getWidth();
        int h = img.getHeight();
        boolean swap = orientation >= 5;
        AffineTransform t = switch (orientation) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0);
            case 3 -> new AffineTransform(-1, 0, 0, -1, w, h);
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, h);
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);
            case 6 -> new AffineTransform(0, 1, -1, 0, h, 0);
            case 7 -> new AffineTransform(0, -1, -1, 0, h, w);
            case 8 -> new AffineTransform(0, -1, 1, 0, 0, w);
            default -> new AffineTransform();
        };
        BufferedImage out = new BufferedImage(swap ? h : w, swap ? w : h, img.getType() == 0
                ? BufferedImage.TYPE_INT_ARGB : img.getType());
        var g = out.createGraphics();
        try {
            g.drawImage(img, t, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    /** EXIF Orientation (1-8) of a JPEG, or 1 when absent/unreadable/not a JPEG. */
    static int exifOrientation(byte[] b) {
        if (b.length < 4 || (b[0] & 0xFF) != 0xFF || (b[1] & 0xFF) != 0xD8) {
            return 1;
        }
        int pos = 2;
        while (pos + 4 <= b.length && (b[pos] & 0xFF) == 0xFF) {
            int marker = b[pos + 1] & 0xFF;
            if (marker == 0xDA || marker == 0xD9) {
                break;
            }
            int len = ((b[pos + 2] & 0xFF) << 8) | (b[pos + 3] & 0xFF);
            if (len < 2) {
                break;
            }
            int start = pos + 4;
            if (marker == 0xE1 && start + 14 <= b.length && b[start] == 'E' && b[start + 1] == 'x'
                    && b[start + 2] == 'i' && b[start + 3] == 'f' && b[start + 4] == 0 && b[start + 5] == 0) {
                return tiffOrientation(b, start + 6, Math.min(b.length, pos + 2 + len));
            }
            pos += 2 + len;
        }
        return 1;
    }

    private static int tiffOrientation(byte[] b, int tiff, int end) {
        if (tiff + 8 > end) {
            return 1;
        }
        boolean le = b[tiff] == 'I' && b[tiff + 1] == 'I';
        if (!le && !(b[tiff] == 'M' && b[tiff + 1] == 'M')) {
            return 1;
        }
        long ifd = u32(b, tiff + 4, le);
        long entries = ifd + 2 <= Integer.MAX_VALUE && tiff + ifd + 2 <= end ? u16(b, (int) (tiff + ifd), le) : 0;
        for (int i = 0; i < entries; i++) {
            long e = tiff + ifd + 2 + 12L * i;
            if (e + 12 > end) {
                break;
            }
            if (u16(b, (int) e, le) == 0x0112) {
                int v = u16(b, (int) e + 8, le);
                return v >= 1 && v <= 8 ? v : 1;
            }
        }
        return 1;
    }

    private static int u16(byte[] b, int o, boolean le) {
        return le ? (b[o] & 0xFF) | ((b[o + 1] & 0xFF) << 8) : ((b[o] & 0xFF) << 8) | (b[o + 1] & 0xFF);
    }

    private static long u32(byte[] b, int o, boolean le) {
        return le ? (u16(b, o, true) | ((long) u16(b, o + 2, true) << 16))
                : (((long) u16(b, o, false) << 16) | u16(b, o + 2, false));
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

    private static BufferedImage resize(BufferedImage src, int targetW) {
        int type = src.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        if (targetW >= src.getWidth()) {
            return src.getType() == type ? src : redraw(src, src.getWidth(), src.getHeight(), type);
        }
        BufferedImage current = src;
        // Halve repeatedly (keeps quality), then a final bicubic step to the exact width.
        while (current.getWidth() / 2 >= targetW) {
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

    private byte[] encode(BufferedImage image) throws IOException {
        ImageWriter writer = writerSupplier.get();
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
