package ir.pws.store.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ZarinpalClient implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(ZarinpalClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AppProperties.Zarinpal config;
    private final RestClient client;
    private final String baseUrl;
    private final String startPayBase;

    @Autowired
    public ZarinpalClient(AppProperties props) {
        this(props, Duration.ofSeconds(10));
    }

    public ZarinpalClient(AppProperties props, Duration timeout) {
        this.config = props.zarinpal();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        this.client = RestClient.builder().requestFactory(factory).build();

        if (config.baseUrl() != null && !config.baseUrl().isBlank()) {
            this.baseUrl = trimTrailingSlash(config.baseUrl());
            if (this.baseUrl.contains("/pg/v4/payment")) {
                this.startPayBase = this.baseUrl.replace("/pg/v4/payment", "/pg/StartPay/");
            } else {
                this.startPayBase = this.baseUrl + "/pg/StartPay/";
            }
        } else if (config.sandbox()) {
            this.baseUrl = "https://sandbox.zarinpal.com/pg/v4/payment";
            this.startPayBase = "https://sandbox.zarinpal.com/pg/StartPay/";
        } else {
            this.baseUrl = "https://payment.zarinpal.com/pg/v4/payment";
            this.startPayBase = "https://payment.zarinpal.com/pg/StartPay/";
        }
    }

    public record PaymentRequestResult(String authority, String paymentUrl) {}

    public record PaymentVerifyResult(
            boolean success,
            int code,
            String refId,
            String cardPanMasked,
            String message) {}

    public PaymentRequestResult requestPayment(long amountRials, String description, String mobile, String callbackUrl) {
        String targetUrl = baseUrl + "/request.json";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("merchant_id", config.merchantId());
        body.put("amount", amountRials);
        body.put("description", description);
        body.put("callback_url", callbackUrl);
        if (mobile != null && !mobile.isBlank()) {
            body.put("metadata", Map.of("mobile", mobile));
        }

        try {
            String jsonBody = MAPPER.writeValueAsString(body);
            String responseString = client.post()
                    .uri(targetUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .exchange((request, response) ->
                            new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = MAPPER.readTree(responseString);
            JsonNode data = root.path("data");
            int code = data.path("code").asInt(-1);
            if (code == 100) {
                String authority = data.path("authority").asText();
                String paymentUrl = startPayBase + authority;
                return new PaymentRequestResult(authority, paymentUrl);
            }
            log.warn("Zarinpal requestPayment returned non-100 code: {} with body: {}", code, responseString);
            throw new ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Zarinpal requestPayment failed", e);
            throw new ApiException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    @Override
    public String gatewayName() {
        return "ZARINPAL";
    }

    @Override
    public PaymentInitiateResult initiatePayment(long amountRials, String description, String mobile, String callbackUrl) {
        PaymentRequestResult res = requestPayment(amountRials, description, mobile, callbackUrl);
        return new PaymentInitiateResult(res.authority(), res.paymentUrl());
    }

    @Override
    public ir.pws.store.order.PaymentVerifyResult verifyPayment(long amountRials, String authority) {
        String targetUrl = baseUrl + "/verify.json";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("merchant_id", config.merchantId());
        body.put("amount", amountRials);
        body.put("authority", authority);

        try {
            String jsonBody = MAPPER.writeValueAsString(body);
            String responseString = client.post()
                    .uri(targetUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .exchange((request, response) ->
                            new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = MAPPER.readTree(responseString);
            JsonNode data = root.path("data");
            int code = data.path("code").asInt(-1);
            if (code == 100 || code == 101) {
                String refId = data.path("ref_id").asText();
                String cardPan = data.hasNonNull("card_pan") ? data.path("card_pan").asText() : null;
                return ir.pws.store.order.PaymentVerifyResult.success(refId, cardPan, responseString);
            }
            String message = data.hasNonNull("message") ? data.path("message").asText() : root.path("errors").toString();
            log.warn("Zarinpal verifyPayment returned failure code: {} with message: {}", code, message);
            return ir.pws.store.order.PaymentVerifyResult.failure(message, responseString);
        } catch (Exception e) {
            log.error("Zarinpal verifyPayment call failed", e);
            return ir.pws.store.order.PaymentVerifyResult.failure(e.getMessage(), null);
        }
    }

    private static String trimTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
