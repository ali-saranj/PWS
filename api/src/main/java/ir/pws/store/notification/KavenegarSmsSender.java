package ir.pws.store.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.config.AppProperties;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "kavenegar")
public class KavenegarSmsSender implements SmsSender {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AppProperties.Sms.Kavenegar config;
    private final RestClient client;

    @Autowired
    public KavenegarSmsSender(AppProperties props) {
        this(props, Duration.ofSeconds(10));
    }

    KavenegarSmsSender(AppProperties props, Duration timeout) {
        this.config = props.sms().kavenegar();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    @Override
    public void send(String mobile, SmsTemplate template, List<String> tokens) {
        URI uri = buildUri(mobile, template, tokens);
        try {
            client.get().uri(uri).exchange((request, response) -> {
                int http = response.getStatusCode().value();
                String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                int status = -1;
                String message = null;
                try {
                    JsonNode ret = MAPPER.readTree(body).path("return");
                    status = ret.path("status").asInt(-1);
                    message = ret.path("message").asText(null);
                } catch (Exception ignored) {
                    // non-JSON body: treated as failure below
                }
                if (http != 200 || status != 200) {
                    throw new SmsException("Kavenegar failure: http=" + http + " status=" + status
                            + (message == null ? "" : " message=" + message));
                }
                return null;
            });
        } catch (SmsException e) {
            throw e;
        } catch (Exception e) {
            throw new SmsException("Kavenegar request failed: " + e.getClass().getSimpleName());
        }
    }

    private URI buildUri(String mobile, SmsTemplate template, List<String> tokens) {
        StringBuilder sb = new StringBuilder(trimTrailingSlash(config.baseUrl()))
                .append("/v1/").append(enc(config.apiKey())).append("/verify/lookup.json")
                .append("?receptor=").append(enc(mobile));
        String[] names = {"token", "token2", "token3"};
        for (int i = 0; i < tokens.size() && i < names.length; i++) {
            sb.append('&').append(names[i]).append('=').append(enc(tokens.get(i)));
        }
        sb.append("&template=").append(enc(templateName(template)));
        return URI.create(sb.toString());
    }

    private String templateName(SmsTemplate template) {
        var t = config.templates();
        return switch (template) {
            case OTP -> t.otp();
            case ORDER_PAID -> t.orderPaid();
            case ORDER_APPROVED -> t.orderApproved();
            case ORDER_SHIPPED -> t.orderShipped();
        };
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String trimTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
