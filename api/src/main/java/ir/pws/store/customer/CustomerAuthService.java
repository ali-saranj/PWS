package ir.pws.store.customer;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.common.text.MobileNumbers;
import ir.pws.store.customer.dto.UpdateCustomerProfileRequest;
import ir.pws.store.otp.OtpPurpose;
import ir.pws.store.otp.OtpService;
import ir.pws.store.staff.RefreshToken;
import ir.pws.store.staff.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerAuthService {

    public static final String SUBJECT_TYPE = "CUSTOMER";

    public record Session(Customer customer, String accessToken, String refreshToken) {}

    private final CustomerRepository customerRepository;
    private final RefreshTokenRepository refreshTokens;
    private final OtpService otp;
    private final JwtService jwt;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public CustomerAuthService(
            CustomerRepository customerRepository,
            RefreshTokenRepository refreshTokens,
            OtpService otp,
            JwtService jwt,
            Clock clock) {
        this.customerRepository = customerRepository;
        this.refreshTokens = refreshTokens;
        this.otp = otp;
        this.jwt = jwt;
        this.clock = clock;
    }

    public void issueOtp(String rawMobile) {
        String mobile = MobileNumbers.normalize(rawMobile);
        otp.issue(mobile, OtpPurpose.CUSTOMER_LOGIN);
    }

    @Transactional
    public Session verify(String rawMobile, String code) {
        String mobile = MobileNumbers.normalize(rawMobile);
        otp.verify(mobile, OtpPurpose.CUSTOMER_LOGIN, code);

        Customer customer = customerRepository.findByMobile(mobile).orElseGet(() -> customerRepository.save(new Customer(mobile)));
        if (customer.isBlocked()) {
            throw new ApiException(ErrorCode.ACCOUNT_BLOCKED);
        }
        customer.setLastLoginAt(clock.instant());
        customerRepository.save(customer);
        return newSession(customer);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public Session refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED);
        }
        Instant now = clock.instant();
        RefreshToken token = refreshTokens
                .findForUpdateByTokenHash(sha256Hex(rawToken))
                .filter(t -> SUBJECT_TYPE.equals(t.getSubjectType()))
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        if (token.getRevokedAt() != null) {
            refreshTokens.revokeAll(SUBJECT_TYPE, token.getSubjectId(), now);
            throw new ApiException(ErrorCode.UNAUTHENTICATED);
        }
        if (!token.getExpiresAt().isAfter(now)) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED);
        }
        Customer customer = customerRepository.findById(token.getSubjectId())
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        if (customer.isBlocked()) {
            token.revoke(now);
            throw new ApiException(ErrorCode.ACCOUNT_BLOCKED);
        }
        token.revoke(now);
        return newSession(customer);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokens.findByTokenHash(sha256Hex(rawToken))
                .filter(t -> SUBJECT_TYPE.equals(t.getSubjectType()) && t.getRevokedAt() == null)
                .ifPresent(t -> t.revoke(clock.instant()));
    }

    public Customer getMe(long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        if (customer.isBlocked()) {
            throw new ApiException(ErrorCode.ACCOUNT_BLOCKED);
        }
        return customer;
    }

    @Transactional
    public Customer updateProfile(long customerId, UpdateCustomerProfileRequest req) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        if (customer.isBlocked()) {
            throw new ApiException(ErrorCode.ACCOUNT_BLOCKED);
        }
        if (req != null) {
            customer.setFirstName(req.firstName());
            customer.setLastName(req.lastName());
            customer.setEmail(req.email() != null && req.email().isBlank() ? null : req.email());
        }
        return customerRepository.save(customer);
    }

    private Session newSession(Customer customer) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokens.save(new RefreshToken(
                SUBJECT_TYPE, customer.getId(), sha256Hex(raw), clock.instant().plus(AuthCookies.CUSTOMER_REFRESH_TTL)));
        return new Session(customer, jwt.customerAccessToken(customer), raw);
    }

    private static String sha256Hex(String value) {
        try {
            return HexFormat.of()
                    .formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
