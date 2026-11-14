package ir.pws.store.catalog.image;

import ir.pws.store.config.AppProperties;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Stores media under {@code app.media.dir}; every path is resolved and must stay inside that directory. */
@Component
public class LocalMediaStorage implements MediaStorage {

    private static final Logger log = LoggerFactory.getLogger(LocalMediaStorage.class);

    private final Path root;

    public LocalMediaStorage(AppProperties props) {
        this.root = Path.of(props.media().dir()).toAbsolutePath().normalize();
    }

    @Override
    public void save(String relPath, byte[] bytes) {
        Path target = resolve(relPath);
        try {
            Files.createDirectories(target.getParent());
            Path tmp = target.resolveSibling(target.getFileName() + "." + UUID.randomUUID() + ".tmp");
            try {
                Files.write(tmp, bytes);
                Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
            } finally {
                Files.deleteIfExists(tmp);
            }
        } catch (IOException e) {
            if (e instanceof AccessDeniedException) {
                log.error("Permission denied writing media file '{}' under root '{}'. Check volume permissions and user ownership.",
                        relPath, root, e);
            }
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public void delete(String relPath) {
        Path target = resolve(relPath);
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Could not delete media file {}", relPath, e);
        }
    }

    private Path resolve(String relPath) {
        Path target = root.resolve(relPath).normalize();
        if (!target.startsWith(root) || target.equals(root)) {
            throw new IllegalArgumentException("Media path escapes the media directory");
        }
        return target;
    }
}
