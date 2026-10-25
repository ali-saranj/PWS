package ir.pws.store.notification;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import ir.pws.store.config.AppProperties;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class KavenegarSmsSenderTest {

    private static final String PATH = "/v1/KEY/verify/lookup.json";

    private WireMockServer server;

    @BeforeEach
    void start() {
        server = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        server.start();
    }

    @AfterEach
    void stop() {
        server.stop();
    }

    private KavenegarSmsSender sender(Duration timeout) {
        var kav = new AppProperties.Sms.Kavenegar("KEY", "http://localhost:" + server.port(),
                new AppProperties.Sms.Templates("otp-tpl", "paid-tpl", "shipped-tpl"));
        var props = new AppProperties(null, null, null, null, new AppProperties.Sms("kavenegar", kav), null);
        return new KavenegarSmsSender(props, timeout);
    }

    @Test
    void send_callsVerifyLookupWithTemplateAndTokens() {
        server.stubFor(get(urlPathEqualTo(PATH)).willReturn(okJson("{\"return\":{\"status\":200}}")));

        sender(Duration.ofSeconds(5)).send("09123456789", SmsTemplate.OTP, List.of("12345"));

        server.verify(1, getRequestedFor(urlPathEqualTo(PATH))
                .withQueryParam("receptor", equalTo("09123456789"))
                .withQueryParam("token", equalTo("12345"))
                .withQueryParam("template", equalTo("otp-tpl"))
                .withQueryParam("token2", absent())
                .withQueryParam("token3", absent()));
    }

    @Test
    void send_mapsSecondAndThirdTokens() {
        server.stubFor(get(urlPathEqualTo(PATH)).willReturn(okJson("{\"return\":{\"status\":200}}")));

        sender(Duration.ofSeconds(5)).send("09123456789", SmsTemplate.ORDER_SHIPPED, List.of("a", "b c", "c"));

        server.verify(1, getRequestedFor(urlPathEqualTo(PATH))
                .withQueryParam("token", equalTo("a"))
                .withQueryParam("token2", equalTo("b c"))
                .withQueryParam("token3", equalTo("c"))
                .withQueryParam("template", equalTo("shipped-tpl")));
    }

    @Test
    void providerError_throwsSmsException() {
        server.stubFor(get(urlPathEqualTo(PATH)).willReturn(aResponse().withStatus(418)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"return\":{\"status\":418,\"message\":\"insufficient credit\"}}")));

        assertThatThrownBy(() -> sender(Duration.ofSeconds(5)).send("09123456789", SmsTemplate.OTP, List.of("1")))
                .isInstanceOf(SmsException.class)
                .hasMessageContaining("418")
                .hasMessageContaining("insufficient credit")
                .satisfies(e -> assertThat(e.getMessage()).doesNotContain("KEY"));
    }

    @Test
    void http200WithNonSuccessStatus_throwsSmsException() {
        server.stubFor(get(urlPathEqualTo(PATH)).willReturn(okJson("{\"return\":{\"status\":411,\"message\":\"bad\"}}")));

        assertThatThrownBy(() -> sender(Duration.ofSeconds(5)).send("09123456789", SmsTemplate.OTP, List.of("1")))
                .isInstanceOf(SmsException.class);
    }

    @Test
    void timeout_throwsSmsException() {
        server.stubFor(get(urlPathEqualTo(PATH)).willReturn(okJson("{\"return\":{\"status\":200}}").withFixedDelay(2000)));

        assertThatThrownBy(() -> sender(Duration.ofMillis(500)).send("09123456789", SmsTemplate.OTP, List.of("1")))
                .isInstanceOf(SmsException.class);
    }
}
