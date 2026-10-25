package ir.pws.store.support;

import static io.zonky.test.db.AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = ZONKY)
@ActiveProfiles("test")
@Import(TestConfig.class)
public abstract class IntegrationTest {

    /** One temp media directory per JVM so tests never write into api/.media. */
    private static final Path MEDIA_DIR = createMediaDir();

    private static Path createMediaDir() {
        try {
            Path dir = Files.createTempDirectory("pws-media-test");
            dir.toFile().deleteOnExit();
            return dir;
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void mediaProperties(DynamicPropertyRegistry registry) {
        registry.add("app.media.dir", MEDIA_DIR::toString);
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected MutableClock clock;

    @Autowired
    private DbCleaner dbCleaner;

    @BeforeEach
    void resetState() {
        dbCleaner.clean();
        clock.setInstant(Instant.parse("2026-01-01T00:00:00Z"));
    }
}
