package ir.pws.store.support;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;

public class DbCleaner {

    private final JdbcTemplate jdbc;

    public DbCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Truncates every table in the public schema except Flyway's history table. */
    public void clean() {
        List<String> tables = jdbc.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history'",
                String.class);
        if (tables.isEmpty()) {
            return;
        }
        String list = String.join(", ", tables.stream().map(t -> "\"" + t + "\"").toList());
        jdbc.execute("TRUNCATE TABLE " + list + " RESTART IDENTITY CASCADE");
    }
}
