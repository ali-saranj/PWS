package ir.pws.store.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.error.FieldError;
import ir.pws.store.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TabapayGatewayClient implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(TabapayGatewayClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AppProperties.Tabapay config;
    private final RestClient client;
    private final String baseUrl;

    @Autowired
    public TabapayGatewayClient(AppProperties props) {
        this(props, Duration.ofSeconds(10));
    }

    public TabapayGatewayClient(AppProperties props, Duration timeout) {
        this.config = props.tabapay();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        this.client = RestClient.builder().requestFactory(factory).build();

        if (config != null && config.baseUrl() != null && !config.baseUrl().isBlank()) {
            this.baseUrl = trimTrailingSlash(config.baseUrl());
        } else if (config != null && config.sandbox()) {
            this.baseUrl = "https://api.tabapay.ir/v1/sandbox";
        } else {
            this.baseUrl = "https://api.tabapay.ir/v1";
        }
    }

    String getBaseUrl() {
        return baseUrl;
    }

    @Override
    public String gatewayName() {
        return "TABAPAY";
    }

    @Override
    public PaymentInitiateResult initiatePayment(long amountRials, String description, String mobile, String callbackUrl) {
        String targetUrl = baseUrl + "/create";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountRials);
        body.put("callbackURL", callbackUrl);
        if (mobile != null && !mobile.isBlank()) {
            body.put("mobile", mobile);
        }
        if (description != null && !description.isBlank()) {
            body.put("description", description);
        }

        try {
            String jsonBody = MAPPER.writeValueAsString(body);
            String responseString = client.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + config.merchantId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .exchange((request, response) ->
                            new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = MAPPER.readTree(responseString);
            int code = root.path("responseCode").asInt(-1);
            String status = root.path("status").asText();
            String upstreamMessage = root.hasNonNull("message") ? root.path("message").asText() : "";

            if (code == 1 && "success".equalsIgnoreCase(status)) {
                String token = root.path("token").asText();
                String paymentUrl = root.hasNonNull("url") ? root.path("url").asText() : defaultPaymentUrl(token);
                return new PaymentInitiateResult(token, paymentUrl);
            }

            log.warn("Tabapay create returned failure code: {} with message: '{}', body: {}", code, upstreamMessage, responseString);
            if (code == -29) {
                throw new ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR, List.of(new FieldError("gateway", "GATEWAY_DEACTIVATED")));
            } else if (code == -27) {
                throw new ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR, List.of(new FieldError("gateway", "GATEWAY_DOMAIN_MISMATCH")));
            }
            throw new ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Tabapay initiatePayment failed", e);
            throw new ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    @Override
    public PaymentVerifyResult verifyPayment(long amountRials, String token) {
        String targetUrl = baseUrl + "/verify";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("token", token);
        body.put("amount", amountRials);

        try {
            String jsonBody = MAPPER.writeValueAsString(body);
            String responseString = client.post()
                    .uri(targetUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + config.merchantId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .exchange((request, response) ->
                            new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = MAPPER.readTree(responseString);
            int code = root.path("responseCode").asInt(-1);
            String status = root.path("status").asText();

            if (code == 1 && "success".equalsIgnoreCase(status)) {
                String refId = root.hasNonNull("shaparakRefNumber")
                        ? root.path("shaparakRefNumber").asText()
                        : root.path("trackingCode").asText();
                String cardPan = root.hasNonNull("cardNumber") ? root.path("cardNumber").asText() : null;
                return PaymentVerifyResult.success(refId, cardPan, responseString);
            }

            String message = root.hasNonNull("message") ? root.path("message").asText() : "TabaPay verify failed";
            log.warn("Tabapay verifyPayment returned failure code: {} with message: {}", code, message);
            return PaymentVerifyResult.failure(message, responseString);
        } catch (Exception e) {
            log.error("Tabapay verifyPayment call failed", e);
            return PaymentVerifyResult.failure(e.getMessage(), null);
        }
    }

    private String defaultPaymentUrl(String token) {
        if (config != null && config.sandbox()) {
            return "https://api.tabapay.ir/sandbox/pay/" + token;
        }
        return "https://api.tabapay.ir/pay/" + token;
    }

    private static String trimTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
