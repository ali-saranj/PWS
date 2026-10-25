package ir.pws.store.catalog.image;

public interface MediaStorage {

    /** Writes (or replaces) the file at the media-relative path. */
    void save(String relPath, byte[] bytes);

    /** Removes the file if present; never throws for a missing file. */
    void delete(String relPath);
}
