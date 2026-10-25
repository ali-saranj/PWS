package ir.pws.store.catalog.image;

/** WebP bytes of the 1600 px and 400 px renditions. */
public record ProcessedImage(byte[] large, byte[] thumb) {}
