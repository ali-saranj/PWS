package ir.pws.store.order;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.config.AppProperties;
import java.time.Duration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TabapayGatewayClientTest {

    private static WireMockServer wireMockServer;
    private TabapayGatewayClient client;

    @BeforeAll
    static void startWireMock() {
        wireMockServer = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMockServer.start();
    }

    @AfterAll
    static void stopWireMock() {
        if (wireMockServer != null) {
            wireMockServer.stop();
        }
    }

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();

        AppProperties.Tabapay tabapayConfig = new AppProperties.Tabapay(
                "test-merchant-uuid-1234-5678-abcdef",
                true,
                "http://localhost:3000/checkout/callback",
                "http://localhost:" + wireMockServer.port() + "/v1"
        );

        AppProperties props = new AppProperties(
                null,
                null,
                null,
                null,
                null,
                null,
                new AppProperties.Payment("TABAPAY"),
                null,
                tabapayConfig
        );

        client = new TabapayGatewayClient(props, Duration.ofSeconds(2));
    }

    @Test
    @DisplayName("gatewayName returns TABAPAY")
    void gatewayName_returnsTabapay() {
        assertThat(client.gatewayName()).isEqualTo("TABAPAY");
    }

    @Test
    @DisplayName("initiatePayment sends Bearer auth and payload, returns token and paymentUrl")
    void initiatePayment_success() {
        wireMockServer.stubFor(post(urlEqualTo("/v1/create"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "responseCode": 1,
                                  "status": "success",
                                  "token": "05d3f1d4-82e1-11ee-8f0e-d82429616d01",
                                  "url": "https://api.tabapay.ir/sandbox/pay/05d3f1d4-82e1-11ee-8f0e-d82429616d01"
                                }
                                """)));

        PaymentInitiateResult result = client.initiatePayment(
                10_000_000L,
                "Order PI-12345",
                "09123456789",
                "http://localhost:3000/checkout/callback"
        );

        assertThat(result.trackingToken()).isEqualTo("05d3f1d4-82e1-11ee-8f0e-d82429616d01");
        assertThat(result.paymentUrl()).isEqualTo("https://api.tabapay.ir/sandbox/pay/05d3f1d4-82e1-11ee-8f0e-d82429616d01");

        wireMockServer.verify(postRequestedFor(urlEqualTo("/v1/create"))
                .withHeader("Authorization", equalTo("Bearer test-merchant-uuid-1234-5678-abcdef"))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("10000000")))
                .withRequestBody(matchingJsonPath("$.callbackURL", equalTo("http://localhost:3000/checkout/callback")))
                .withRequestBody(matchingJsonPath("$.mobile", equalTo("09123456789")))
                .withRequestBody(matchingJsonPath("$.description", equalTo("Order PI-12345"))));
    }

    @Test
    @DisplayName("initiatePayment with error responseCode throws PAYMENT_GATEWAY_ERROR")
    void initiatePayment_failure_throwsApiException() {
        wireMockServer.stubFor(post(urlEqualTo("/v1/create"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "responseCode": -33,
                                  "status": "error",
                                  "message": "درگاه پرداخت پیدا نشد"
                                }
                                """)));

        assertThatThrownBy(() -> client.initiatePayment(
                10_000_000L,
                "Order PI-12345",
                "09123456789",
                "http://localhost:3000/checkout/callback"
        ))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).code()).isEqualTo(ErrorCode.PAYMENT_GATEWAY_ERROR));
    }

    @Test
    @DisplayName("verifyPayment with valid token returns success result with shaparakRefNumber")
    void verifyPayment_success() {
        wireMockServer.stubFor(post(urlEqualTo("/v1/verify"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "responseCode": 1,
                                  "status": "success",
                                  "message": "تراکنش باموفقیت تایید شد",
                                  "token": "05d3f1d4-82e1-11ee-8f0e-d82429616d01",
                                  "shaparakRefNumber": "111122223333",
                                  "trackingCode": 40,
                                  "amount": 10000000,
                                  "cardNumber": "1234-56**-****-7890"
                                }
                                """)));

        PaymentVerifyResult result = client.verifyPayment(10_000_000L, "05d3f1d4-82e1-11ee-8f0e-d82429616d01");

        assertThat(result.success()).isTrue();
        assertThat(result.refId()).isEqualTo("111122223333");
        assertThat(result.cardPanMasked()).isEqualTo("1234-56**-****-7890");

        wireMockServer.verify(postRequestedFor(urlEqualTo("/v1/verify"))
                .withHeader("Authorization", equalTo("Bearer test-merchant-uuid-1234-5678-abcdef"))
                .withRequestBody(matchingJsonPath("$.token", equalTo("05d3f1d4-82e1-11ee-8f0e-d82429616d01")))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("10000000"))));
    }

    @Test
    @DisplayName("verifyPayment with failure code returns failure PaymentVerifyResult")
    void verifyPayment_failure() {
        wireMockServer.stubFor(post(urlEqualTo("/v1/verify"))
                .willReturn(aResponse()
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "responseCode": -101,
                                  "status": "error",
                                  "message": "تراکنش انجام نشد",
                                  "token": "05d3f1d4-82e1-11ee-8f0e-d82429616d01"
                                }
                                """)));

        PaymentVerifyResult result = client.verifyPayment(10_000_000L, "05d3f1d4-82e1-11ee-8f0e-d82429616d01");

        assertThat(result.success()).isFalse();
        assertThat(result.errorMessage()).contains("تراکنش انجام نشد");
    }
}
