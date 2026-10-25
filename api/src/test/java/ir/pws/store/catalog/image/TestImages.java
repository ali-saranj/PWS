package ir.pws.store.catalog.image;

import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import javax.imageio.ImageIO;

/** Generates image fixtures in code (no committed binaries). */
public final class TestImages {

    private TestImages() {}

    public static byte[] jpeg(int w, int h) {
        return encode(gradient(w, h, BufferedImage.TYPE_INT_RGB), "jpg");
    }

    public static byte[] png(int w, int h) {
        return encode(gradient(w, h, BufferedImage.TYPE_INT_ARGB), "png");
    }

    public static byte[] notImage() {
        return "this is just text".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    /** Text that merely has a .jpg name; the bytes are not an image. */
    public static byte[] fakeJpg() {
        return "FAKE JPEG CONTENT".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    /** JPEG magic bytes followed by garbage: passes the magic check but cannot be decoded. */
    public static byte[] truncatedJpeg() {
        byte[] ok = jpeg(200, 100);
        return java.util.Arrays.copyOf(ok, 40);
    }

    public static int width(byte[] image) {
        try {
            return ImageIO.read(new ByteArrayInputStream(image)).getWidth();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static BufferedImage gradient(int w, int h, int type) {
        BufferedImage img = new BufferedImage(w, h, type);
        var g = img.createGraphics();
        g.setPaint(new GradientPaint(0, 0, Color.RED, w, h, Color.BLUE));
        g.fillRect(0, 0, w, h);
        g.dispose();
        return img;
    }

    private static byte[] encode(BufferedImage img, String format) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(img, format, out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
