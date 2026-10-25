package ir.pws.store.staff;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.common.text.MobileNumbers;
import ir.pws.store.otp.OtpPurpose;
import ir.pws.store.otp.OtpService;
import ir.pws.store.staff.dto.LoginChallenge;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/** Two-step staff login (password, then SMS code), refresh-token rotation, logout and brute-force lockout. */
@Service
public class StaffAuthService {

    static final String SUBJECT_TYPE = "STAFF";
    static final Duration FAILURE_WINDOW = Duration.ofMinutes(15);
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    static final int MAX_FAILURES = 5;

    /** The authenticated staff member plus the freshly issued raw tokens (the refresh token is never stored raw). */
    public record Session(StaffUser user, String accessToken, String refreshToken) {}

    private final StaffUserRepository staff;
    private final RefreshTokenRepository refreshTokens;
    private final OtpService otp;
    private final JwtService jwt;
    private final PasswordEncoder encoder;
    private final Clock clock;
    private final TransactionTemplate tx;
    private final SecureRandom random = new SecureRandom();
    /** Matched against when the username is unknown so that path costs the same bcrypt work as a wrong password. */
    private final String dummyHash;

    public StaffAuthService(
            StaffUserRepository staff,
            RefreshTokenRepository refreshTokens,
            OtpService otp,
            JwtService jwt,
            PasswordEncoder encoder,
            Clock clock,
            PlatformTransactionManager txManager) {
        this.staff = staff;
        this.refreshTokens = refreshTokens;
        this.otp = otp;
        this.jwt = jwt;
        this.encoder = encoder;
        this.clock = clock;
        this.tx = new TransactionTemplate(txManager);
        this.dummyHash = encoder.encode("dummy-password-for-constant-time-login");
    }

    private enum Outcome { OK, BAD_CREDENTIALS, LOCKED }

    private record Attempt(Outcome outcome, String mobile, long staffId) {}

    /**
     * Not {@code @Transactional}: the password check and lockout bookkeeping run in one short transaction that
     * holds a row lock on the staff user (so parallel guesses are serialised and all counted) and always commits;
     * errors are thrown only after that commit, and the OTP is issued outside it.
     */
    public LoginChallenge login(String username, String password) {
        Attempt attempt = tx.execute(s -> attempt(username == null ? "" : username.trim(), password));
        switch (attempt.outcome()) {
            case LOCKED -> throw new ApiException(ErrorCode.RATE_LIMITED);
            case BAD_CREDENTIALS -> throw new ApiException(ErrorCode.UNAUTHENTICATED);
            default -> {
                otp.issue(attempt.mobile(), OtpPurpose.STAFF_LOGIN);
                return new LoginChallenge(jwt.staffChallenge(attempt.staffId()), MobileNumbers.mask(attempt.mobile()));
            }
        }
    }

    private Attempt attempt(String username, String password) {
        Instant now = clock.instant();
        Optional<StaffUser> found = staff.findForUpdateByUsername(username);
        if (found.isEmpty()) {
            encoder.matches(password, dummyHash);
            return new Attempt(Outcome.BAD_CREDENTIALS, null, 0);
        }
        StaffUser user = found.get();
        if (user.isLocked(now)) {
            return new Attempt(Outcome.LOCKED, null, 0);
        }
        if (!encoder.matches(password, user.getPasswordHash())) {
            user.recordFailedLogin(now, FAILURE_WINDOW, MAX_FAILURES, LOCK_DURATION);
            return new Attempt(Outcome.BAD_CREDENTIALS, null, 0);
        }
        if (!user.isActive()) {
            return new Attempt(Outcome.BAD_CREDENTIALS, null, 0);
        }
        if (user.getFailedLoginCount() > 0 || user.getLockedUntil() != null) {
            user.clearLoginFailures();
        }
        return new Attempt(Outcome.OK, user.getMobile(), user.getId());
    }

    @Transactional
    public Session verify(String challenge, String code) {
        long staffId = jwt.parseStaffChallenge(challenge).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        StaffUser user = staff.findById(staffId)
                .filter(StaffUser::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
        otp.verify(user.getMobile(), OtpPurpose.STAFF_LOGIN, code);
        return newSession(user);
    }

    /** noRollbackFor: revoking every session after refresh-token reuse must commit even though we answer 401. */
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
            revokeAllFor(token.getSubjectId());
            throw new ApiException(ErrorCode.UNAUTHENTICATED);
        }
        if (!token.getExpiresAt().isAfter(now)) {
            throw new ApiException(ErrorCode.UNAUTHENTICATED);
        }
        Optional<StaffUser> user = staff.findById(token.getSubjectId()).filter(StaffUser::isActive);
        if (user.isEmpty()) {
            token.revoke(now);
            throw new ApiException(ErrorCode.UNAUTHENTICATED);
        }
        token.revoke(now);
        return newSession(user.get());
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

    /** Revokes every live refresh token of a staff member (reuse detection; deactivation in Task 9). */
    @Transactional
    public void revokeAllFor(long staffId) {
        refreshTokens.revokeAll(SUBJECT_TYPE, staffId, clock.instant());
    }

    private Session newSession(StaffUser user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokens.save(new RefreshToken(
                SUBJECT_TYPE, user.getId(), sha256Hex(raw), clock.instant().plus(AuthCookies.REFRESH_TTL)));
        return new Session(user, jwt.staffAccessToken(user), raw);
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
