package ir.pws.store.config;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Fails startup when {@code app.cookies.secure=true} (production) and a signing secret is shorter than 32 bytes or
 * still equals the development default shipped in application.yml.
 */
@Component
public class SecretsGuard {

    static final int MIN_SECRET_BYTES = 32;

    /** Must mirror the dev defaults in application.yml. */
    static final Set<String> DEV_DEFAULTS = Set.of(
            "dev-staff-secret-change-me-0123456789abcdef",
            "dev-customer-secret-change-me-0123456789abcdef",
            "dev-otp-secret-change-me-0123456789abcdef");

    private final AppProperties props;

    public SecretsGuard(AppProperties props) {
        this.props = props;
    }

    @PostConstruct
    void validate() {
        if (!props.cookies().secure()) {
            return;
        }
        Map<String, String> secrets = new LinkedHashMap<>();
        secrets.put("app.jwt.staff-secret", props.jwt().staffSecret());
        secrets.put("app.jwt.customer-secret", props.jwt().customerSecret());
        secrets.put("app.otp.secret", props.otp().secret());
        secrets.forEach((name, value) -> {
            if (value == null || value.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
                throw new IllegalStateException(name + " must be at least " + MIN_SECRET_BYTES + " bytes when app.cookies.secure=true");
            }
            if (DEV_DEFAULTS.contains(value)) {
                throw new IllegalStateException(name + " must not use the development default when app.cookies.secure=true");
            }
        });
    }
}
