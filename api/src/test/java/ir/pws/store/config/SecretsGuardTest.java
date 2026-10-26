package ir.pws.store.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SecretsGuardTest {

    private static final String GOOD = "a-real-production-secret-0123456789-XYZ";

    private static SecretsGuard guard(boolean secure, String staff, String customer, String otp) {
        return new SecretsGuard(new AppProperties(
                new AppProperties.Cookies(secure),
                new AppProperties.Jwt(staff, customer),
                new AppProperties.Otp(otp),
                null,
                null,
                null,
                null));
    }

    @Test
    void secureWithStrongSecrets_passes() {
        assertThatCode(() -> guard(true, GOOD, GOOD + "1", GOOD + "2").validate()).doesNotThrowAnyException();
    }

    @Test
    void insecureWithDevDefaults_passes() {
        assertThatCode(() -> guard(false, "short", "short", "short").validate()).doesNotThrowAnyException();
    }

    @Test
    void secureWithShortSecret_fails() {
        assertThatThrownBy(() -> guard(true, GOOD, "too-short", GOOD).validate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.jwt.customer-secret");
    }

    @Test
    void secureWithDevDefault_fails() {
        for (String dev : SecretsGuard.DEV_DEFAULTS) {
            assertThatThrownBy(() -> guard(true, dev, GOOD, GOOD).validate()).isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> guard(true, GOOD, dev, GOOD).validate()).isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> guard(true, GOOD, GOOD, dev).validate()).isInstanceOf(IllegalStateException.class);
        }
    }

    @Test
    void devDefaultsMirrorApplicationYml() throws Exception {
        String yml = new String(getClass().getResourceAsStream("/application.yml").readAllBytes());
        for (String dev : SecretsGuard.DEV_DEFAULTS) {
            org.assertj.core.api.Assertions.assertThat(yml).contains(dev);
        }
    }
}
