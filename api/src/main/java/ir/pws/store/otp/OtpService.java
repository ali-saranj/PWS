package ir.pws.store.otp;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.config.AppProperties;
import ir.pws.store.notification.SmsException;
import ir.pws.store.notification.SmsSender;
import ir.pws.store.notification.SmsTemplate;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {

    static final Duration TTL = Duration.ofMinutes(2);
    static final Duration RESEND_INTERVAL = Duration.ofMinutes(2);
    static final Duration HOURLY_WINDOW = Duration.ofHours(1);
    static final int MAX_PER_HOUR = 5;
    static final int MAX_ATTEMPTS = 5;

    private final OtpCodeRepository repository;
    private final SmsSender smsSender;
    private final Clock clock;
    private final byte[] secret;
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpCodeRepository repository, SmsSender smsSender, Clock clock, AppProperties props) {
        this.repository = repository;
        this.smsSender = smsSender;
        this.clock = clock;
        this.secret = props.otp().secret().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    public void issue(String normalizedMobile, OtpPurpose purpose) {
        Instant now = clock.instant();
        boolean tooSoon = repository
                .findFirstByMobileAndPurposeOrderByCreatedAtDescIdDesc(normalizedMobile, purpose)
                .filter(last -> last.getCreatedAt().isAfter(now.minus(RESEND_INTERVAL)))
                .isPresent();
        long lastHour = repository.countByMobileAndPurposeAndCreatedAtAfter(
                normalizedMobile, purpose, now.minus(HOURLY_WINDOW));
        if (tooSoon || lastHour >= MAX_PER_HOUR) {
            throw new ApiException(ErrorCode.RATE_LIMITED);
        }

        String code = "%05d".formatted(random.nextInt(100_000));
        repository.save(new OtpCode(normalizedMobile, purpose, hash(normalizedMobile, purpose, code), now,
                now.plus(TTL)));
        try {
            smsSender.send(normalizedMobile, SmsTemplate.OTP, List.of(code));
        } catch (SmsException e) {
            throw new ApiException(ErrorCode.SMS_UNAVAILABLE);
        }
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void verify(String normalizedMobile, OtpPurpose purpose, String code) {
        Instant now = clock.instant();
        OtpCode otp = repository
                .findFirstByMobileAndPurposeOrderByCreatedAtDescIdDesc(normalizedMobile, purpose)
                .orElseThrow(() -> new ApiException(ErrorCode.OTP_INVALID));
        if (otp.getConsumedAt() != null) {
            throw new ApiException(ErrorCode.OTP_INVALID);
        }
        if (otp.getAttempts() >= MAX_ATTEMPTS) {
            throw new ApiException(ErrorCode.OTP_TOO_MANY_ATTEMPTS);
        }
        if (now.isAfter(otp.getExpiresAt())) {
            throw new ApiException(ErrorCode.OTP_EXPIRED);
        }
        byte[] expected = otp.getCodeHash().getBytes(StandardCharsets.UTF_8);
        byte[] actual = hash(normalizedMobile, purpose, code == null ? "" : code).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            otp.incrementAttempts(now);
            throw new ApiException(otp.getAttempts() >= MAX_ATTEMPTS
                    ? ErrorCode.OTP_TOO_MANY_ATTEMPTS
                    : ErrorCode.OTP_INVALID);
        }
        otp.consume(now);
    }

    private String hash(String mobile, OtpPurpose purpose, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(
                    mac.doFinal((mobile + ":" + purpose.name() + ":" + code).getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
