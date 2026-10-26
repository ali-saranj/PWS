package ir.pws.store.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app")
public record AppProperties(
        @NotNull Cookies cookies,
        @Valid @NotNull Jwt jwt,
        @Valid @NotNull Otp otp,
        Media media,
        Sms sms,
        Bootstrap bootstrap,
        Zarinpal zarinpal) {

    public record Cookies(boolean secure) {}

    public record Jwt(@NotBlank String staffSecret, @NotBlank String customerSecret) {}

    public record Otp(@NotBlank String secret) {}

    public record Media(String dir, @DefaultValue("/media") String baseUrl, boolean serve) {}

    public record Sms(@DefaultValue("logging") String provider, Kavenegar kavenegar) {

        public record Kavenegar(String apiKey, String baseUrl, Templates templates) {}

        public record Templates(
                String otp,
                String orderPaid,
                @DefaultValue("pws-order-approved") String orderApproved,
                String orderShipped) {}
    }

    public record Bootstrap(Owner owner) {

        public record Owner(String username, String password, String mobile) {}
    }

    public record Zarinpal(
            @NotBlank String merchantId,
            @DefaultValue("true") boolean sandbox,
            @NotBlank String callbackUrl,
            String baseUrl) {}
}
