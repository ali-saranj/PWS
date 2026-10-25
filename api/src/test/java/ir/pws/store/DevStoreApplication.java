package ir.pws.store;

import ir.pws.store.support.DevDatabaseConfig;
import org.springframework.boot.SpringApplication;

/** Local dev entry point (no Docker): runs the app against a persistent embedded Postgres on port 5433. */
public class DevStoreApplication {

    public static void main(String[] args) {
        SpringApplication.from(StoreApplication::main)
                .with(DevDatabaseConfig.class)
                .withAdditionalProfiles("dev")
                .run(args);
    }
}
