package ir.pws.store.support;

import ir.pws.store.common.security.JwtService;
import ir.pws.store.staff.StaffUserRepository;
import java.time.Clock;
import java.time.Instant;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@TestConfiguration(proxyBeanMethods = false)
public class TestConfig {

    @Bean
    @Primary
    MutableClock mutableClock() {
        return new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
    }

    @Bean
    DbCleaner dbCleaner(JdbcTemplate jdbc) {
        return new DbCleaner(jdbc);
    }

    @Bean
    AdminAuth adminAuth(StaffUserRepository staff, PasswordEncoder encoder, JwtService jwt) {
        return new AdminAuth(staff, encoder, jwt);
    }
}
