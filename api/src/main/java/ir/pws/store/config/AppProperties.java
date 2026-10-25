package ir.pws.store.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("app")
public record AppProperties(
        Cookies cookies,
        Jwt jwt,
        Otp otp,
        Media media,
        Sms sms,
        Bootstrap bootstrap) {

    public record Cookies(boolean secure) {}

    public record Jwt(String staffSecret, String customerSecret) {}

    public record Otp(String secret) {}

    public record Media(String dir, @DefaultValue("/media") String baseUrl, boolean serve) {}

    public record Sms(@DefaultValue("logging") String provider, Kavenegar kavenegar) {

        public record Kavenegar(String apiKey, String baseUrl, Templates templates) {}

        public record Templates(String otp, String orderPaid, String orderShipped) {}
    }

    public record Bootstrap(Owner owner) {

        public record Owner(String username, String password, String mobile) {}
    }
}
