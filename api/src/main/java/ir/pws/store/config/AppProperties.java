package ir.pws.store.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;
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
        Payment payment,
        Zarinpal zarinpal,
        Tabapay tabapay) {

    @ConstructorBinding
    public AppProperties(
            Cookies cookies,
            Jwt jwt,
            Otp otp,
            Media media,
            Sms sms,
            Bootstrap bootstrap,
            Payment payment,
            Zarinpal zarinpal,
            Tabapay tabapay) {
        this.cookies = cookies;
        this.jwt = jwt;
        this.otp = otp;
        this.media = media;
        this.sms = sms;
        this.bootstrap = bootstrap;
        this.payment = payment != null ? payment : new Payment("TABAPAY");
        this.zarinpal = zarinpal;
        this.tabapay = tabapay;
    }

    public AppProperties(
            Cookies cookies,
            Jwt jwt,
            Otp otp,
            Media media,
            Sms sms,
            Bootstrap bootstrap,
            Zarinpal zarinpal) {
        this(cookies, jwt, otp, media, sms, bootstrap, new Payment("TABAPAY"), zarinpal, null);
    }

    public Payment payment() {
        return payment != null ? payment : new Payment("TABAPAY");
    }

    public record Payment(@DefaultValue("TABAPAY") String activeGateway) {}

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

    public record Tabapay(
            @NotBlank String merchantId,
            @DefaultValue("true") boolean sandbox,
            @NotBlank String callbackUrl,
            String baseUrl) {}
}
