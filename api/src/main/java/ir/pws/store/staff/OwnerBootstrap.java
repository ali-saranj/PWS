package ir.pws.store.staff;

import ir.pws.store.common.text.MobileNumbers;
import ir.pws.store.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates the first OWNER from configuration when no staff user exists. The password is never logged. */
@Component
public class OwnerBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OwnerBootstrap.class);

    private final StaffUserRepository staff;
    private final PasswordEncoder encoder;
    private final AppProperties.Bootstrap.Owner owner;

    public OwnerBootstrap(StaffUserRepository staff, PasswordEncoder encoder, AppProperties props) {
        this.staff = staff;
        this.encoder = encoder;
        this.owner = props.bootstrap() == null ? null : props.bootstrap().owner();
    }

    @Override
    public void run(ApplicationArguments args) {
        bootstrap();
    }

    @Transactional
    public void bootstrap() {
        if (staff.count() > 0) {
            return;
        }
        if (owner == null || isBlank(owner.username()) || isBlank(owner.password()) || isBlank(owner.mobile())) {
            log.warn("No staff users exist and app.bootstrap.owner is not fully configured; skipping owner bootstrap");
            return;
        }
        staff.save(new StaffUser(
                owner.username().trim(),
                encoder.encode(owner.password()),
                MobileNumbers.normalize(owner.mobile()),
                "Owner",
                StaffRole.OWNER));
        log.info("Created bootstrap OWNER account '{}'", owner.username().trim());
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
