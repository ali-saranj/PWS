package ir.pws.store.staff;

import static org.assertj.core.api.Assertions.assertThat;

import ir.pws.store.support.AdminAuth;
import ir.pws.store.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = {
    "app.bootstrap.owner.username=boss",
    "app.bootstrap.owner.password=Sup3r-secret-pass",
    "app.bootstrap.owner.mobile=+989121234567"
})
class OwnerBootstrapTest extends IntegrationTest {

    @Autowired
    OwnerBootstrap bootstrap;

    @Autowired
    StaffUserRepository repo;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    AdminAuth adminAuth;

    @Test
    void createsOwnerWhenNoStaff() {
        bootstrap.bootstrap();

        assertThat(repo.findAll()).hasSize(1);
        StaffUser owner = repo.findByUsername("boss").orElseThrow();
        assertThat(owner.getRole()).isEqualTo(StaffRole.OWNER);
        assertThat(owner.isActive()).isTrue();
        assertThat(owner.getMobile()).isEqualTo("09121234567");
        assertThat(owner.getPasswordHash()).startsWith("$2").isNotEqualTo("Sup3r-secret-pass");
        assertThat(encoder.matches("Sup3r-secret-pass", owner.getPasswordHash())).isTrue();
    }

    @Test
    void doesNothingWhenStaffExists() {
        adminAuth.createStaff(StaffRole.PRODUCT_MANAGER);

        bootstrap.bootstrap();

        assertThat(repo.findAll()).hasSize(1);
        assertThat(repo.findByUsername("boss")).isEmpty();
    }
}
