package ir.pws.store.config;

import static org.assertj.core.api.Assertions.assertThat;

import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.error.FieldError;
import ir.pws.store.common.error.ProblemFactory;
import ir.pws.store.support.IntegrationTest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ProblemDetail;

class MessageConfigTest extends IntegrationTest {

    @Autowired
    private ProblemFactory problemFactory;

    @Test
    @DisplayName("MessageSource in Spring context resolves Persian error messages and field translations")
    void problemFactory_resolvesPersianMessages() {
        ProblemDetail problem = problemFactory.build(
                ErrorCode.PAYMENT_GATEWAY_ERROR,
                List.of(new FieldError("gateway", "GATEWAY_DEACTIVATED")),
                ProblemFactory.FA);

        assertThat(problem.getProperties()).isNotNull();
        var messages = (java.util.Map<?, ?>) problem.getProperties().get("messages");
        assertThat(messages.get("fa")).isEqualTo("خطا در برقراری ارتباط با درگاه پرداخت بانکی.");
        assertThat(messages.get("en")).isEqualTo("Error communicating with the payment gateway.");

        var errors = (List<?>) problem.getProperties().get("errors");
        assertThat(errors).isNotEmpty();
        var firstError = (java.util.Map<?, ?>) errors.get(0);
        assertThat(firstError.get("code")).isEqualTo("GATEWAY_DEACTIVATED");
        assertThat(firstError.get("message")).isEqualTo("درگاه پرداخت در حال حاضر غیرفعال است.");
    }
}
