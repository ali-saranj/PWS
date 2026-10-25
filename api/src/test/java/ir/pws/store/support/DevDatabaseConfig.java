package ir.pws.store.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import java.nio.file.Path;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Dev-only database. A TestConfiguration so component scanning skips it; applied only through
 * {@code SpringApplication.from(...).with(DevDatabaseConfig.class)} in DevStoreApplication.
 */
@TestConfiguration(proxyBeanMethods = false)
public class DevDatabaseConfig {

    @Bean(destroyMethod = "close")
    EmbeddedPostgres devPostgres() throws IOException {
        return EmbeddedPostgres.builder()
                .setPort(5433)
                .setDataDirectory(Path.of(".devdb"))
                .setCleanDataDirectory(false)
                .start();
    }

    @Bean
    @Primary
    DataSource devDataSource(EmbeddedPostgres postgres) {
        return postgres.getPostgresDatabase();
    }
}
