package ir.pws.store;

import static org.assertj.core.api.Assertions.assertThat;

import ir.pws.store.catalog.variant.TierDto;
import ir.pws.store.catalog.variant.TierPricing;
import ir.pws.store.support.IntegrationTest;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;



@ActiveProfiles({"test", "dev"})
class DevSeedTest extends IntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DataSource dataSource;

    /**
     * IntegrationTest's cleaner truncates every table before each test (including the Flyway-applied seed), so
     * re-apply the very same seed script on the clean schema. Flyway applying V1000 at context start proves the
     * migration runs; this proves its content.
     */
    @BeforeEach
    void applySeed() {
        new ResourceDatabasePopulator(new ClassPathResource("db/dev/V1000__dev_seed.sql")).execute(dataSource);
    }

    private long count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM " + table, Long.class);
    }

    @Test
    void seedsExpectedCounts() {
        assertThat(count("category")).isEqualTo(9);
        assertThat(count("category WHERE parent_id IS NOT NULL")).isEqualTo(2);
        assertThat(count("brand")).isEqualTo(5);
        assertThat(count("product")).isEqualTo(3);
        assertThat(count("variant")).isEqualTo(4);
        assertThat(count("volume_tier")).isGreaterThan(0);
        assertThat(count("product_image")).isZero();
    }

    @Test
    void activeProductsHaveAnActiveVariantAndLedgerReconciles() {
        assertThat(count("product p WHERE status = 'ACTIVE' AND NOT EXISTS "
                        + "(SELECT 1 FROM variant v WHERE v.product_id = p.id AND v.active)"))
                .isZero();
        assertThat(count("variant v WHERE stock_on_hand <> "
                        + "COALESCE((SELECT sum(delta) FROM stock_movement m WHERE m.variant_id = v.id), 0)"))
                .isZero();
    }

    @Test
    void everySeededTierSetIsValid() {
        List<Long> variantIds = jdbc.queryForList("SELECT id FROM variant", Long.class);
        for (Long id : variantIds) {
            long base = jdbc.queryForObject("SELECT base_price FROM variant WHERE id = ?", Long.class, id);
            List<TierDto> tiers = jdbc.query(
                    "SELECT min_qty, unit_price FROM volume_tier WHERE variant_id = ? ORDER BY min_qty",
                    (rs, i) -> new TierDto(rs.getInt("min_qty"), rs.getLong("unit_price")),
                    id);
            assertThat(TierPricing.validate(base, tiers)).as("variant %d", id).isEmpty();
        }
    }
}
