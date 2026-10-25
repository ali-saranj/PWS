package ir.pws.store.otp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.notification.LoggingSmsSender;
import ir.pws.store.notification.SmsException;
import ir.pws.store.notification.SmsTemplate;
import ir.pws.store.support.IntegrationTest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.jdbc.core.JdbcTemplate;

class OtpServiceTest extends IntegrationTest {

    private static final String MOBILE = "09121234567";
    private static final OtpPurpose P = OtpPurpose.STAFF_LOGIN;

    @Autowired
    OtpService otp;

    @MockitoSpyBean
    LoggingSmsSender sms;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void clearSms() {
        sms.clear();
    }

    private String lastCode() {
        List<LoggingSmsSender.SentSms> sent = sms.sent();
        LoggingSmsSender.SentSms last = sent.get(sent.size() - 1);
        assertThat(last.template()).isEqualTo(SmsTemplate.OTP);
        assertThat(last.tokens()).hasSize(1);
        return last.tokens().get(0);
    }

    private String wrongCode(String code) {
        return code.equals("00000") ? "00001" : "00000";
    }

    private void assertCode(Runnable r, ErrorCode expected) {
        assertThatThrownBy(r::run).isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo(expected));
    }

    @Test
    void issueThenVerify_succeedsOnce() {
        otp.issue(MOBILE, P);
        String code = lastCode();
        otp.verify(MOBILE, P, code);
        assertCode(() -> otp.verify(MOBILE, P, code), ErrorCode.OTP_INVALID);
    }

    @Test
    void code_isFiveDigits() {
        otp.issue(MOBILE, P);
        assertThat(lastCode()).matches("\\d{5}");
    }

    @Test
    void wrongCode_isInvalid_andCountsAttempt() {
        otp.issue(MOBILE, P);
        String code = lastCode();
        assertCode(() -> otp.verify(MOBILE, P, wrongCode(code)), ErrorCode.OTP_INVALID);
        assertThat(jdbc.queryForObject("SELECT attempts FROM otp_code", Integer.class)).isEqualTo(1);
    }

    @Test
    void fifthWrongAttempt_locksCode() {
        otp.issue(MOBILE, P);
        String code = lastCode();
        for (int i = 0; i < 4; i++) {
            assertCode(() -> otp.verify(MOBILE, P, wrongCode(code)), ErrorCode.OTP_INVALID);
        }
        assertCode(() -> otp.verify(MOBILE, P, wrongCode(code)), ErrorCode.OTP_TOO_MANY_ATTEMPTS);
        assertCode(() -> otp.verify(MOBILE, P, code), ErrorCode.OTP_TOO_MANY_ATTEMPTS);
    }

    @Test
    void expiredAfterTwoMinutes() {
        otp.issue(MOBILE, P);
        String code = lastCode();
        clock.advance(Duration.ofSeconds(121));
        assertCode(() -> otp.verify(MOBILE, P, code), ErrorCode.OTP_EXPIRED);
    }

    @Test
    void reissueWithinTwoMinutes_isRateLimited() {
        otp.issue(MOBILE, P);
        clock.advance(Duration.ofSeconds(60));
        assertCode(() -> otp.issue(MOBILE, P), ErrorCode.RATE_LIMITED);
    }

    @Test
    void sixthIssueWithinHour_isRateLimited() {
        for (int i = 0; i < 5; i++) {
            otp.issue(MOBILE, P);
            clock.advance(Duration.ofSeconds(121));
        }
        assertCode(() -> otp.issue(MOBILE, P), ErrorCode.RATE_LIMITED);
    }

    @Test
    void newIssue_invalidatesPreviousCode() {
        otp.issue(MOBILE, P);
        String a = lastCode();
        clock.advance(Duration.ofSeconds(121));
        otp.issue(MOBILE, P);
        String b = lastCode();
        if (a.equals(b)) {
            // Astronomically unlikely collision; the invalidation property is then unobservable.
            return;
        }
        assertCode(() -> otp.verify(MOBILE, P, a), ErrorCode.OTP_INVALID);
        otp.verify(MOBILE, P, b);
    }

    @Test
    void purposesAreIsolated() {
        otp.issue(MOBILE, OtpPurpose.STAFF_LOGIN);
        String code = lastCode();
        assertCode(() -> otp.verify(MOBILE, OtpPurpose.CUSTOMER_LOGIN, code), ErrorCode.OTP_INVALID);
    }

    @Test
    void smsFailure_isSmsUnavailable_andDoesNotConsumeRateLimit() {
        doThrow(new SmsException("down")).when(sms).send(eq(MOBILE), eq(SmsTemplate.OTP), any());
        assertCode(() -> otp.issue(MOBILE, P), ErrorCode.SMS_UNAVAILABLE);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM otp_code", Integer.class)).isZero();
        org.mockito.Mockito.reset(sms);
        otp.issue(MOBILE, P);
        assertThat(sms.sent()).hasSize(1);
    }

    @Test
    void codeIsNotStoredInPlaintext() {
        otp.issue(MOBILE, P);
        String code = lastCode();
        String stored = jdbc.queryForObject("SELECT code_hash FROM otp_code", String.class);
        assertThat(stored).isNotEqualTo(code).hasSize(64);
    }

    /** Runs the action on n threads released simultaneously; returns the error code (or null on success) per call. */
    private List<ErrorCode> concurrently(int n, Runnable action) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        try {
            CountDownLatch ready = new CountDownLatch(n);
            CountDownLatch start = new CountDownLatch(1);
            List<Future<ErrorCode>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        action.run();
                        return null;
                    } catch (ApiException e) {
                        return e.code();
                    }
                }));
            }
            ready.await();
            start.countDown();
            List<ErrorCode> results = new ArrayList<>();
            for (Future<ErrorCode> f : futures) {
                results.add(f.get());
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void concurrentWrongGuesses_cannotBypassAttemptCap() throws Exception {
        otp.issue(MOBILE, P);
        String code = lastCode();
        String wrong = wrongCode(code);
        List<ErrorCode> results = concurrently(10, () -> otp.verify(MOBILE, P, wrong));
        // Increments stop at the cap: exactly 5 guesses are counted, the rest are rejected up front.
        assertThat(jdbc.queryForObject("SELECT attempts FROM otp_code", Integer.class)).isEqualTo(5);
        assertThat(results).doesNotContainNull();
        assertThat(results.stream().filter(c -> c == ErrorCode.OTP_INVALID).count()).isEqualTo(4);
        assertThat(results.stream().filter(c -> c == ErrorCode.OTP_TOO_MANY_ATTEMPTS).count()).isEqualTo(6);
        assertCode(() -> otp.verify(MOBILE, P, code), ErrorCode.OTP_TOO_MANY_ATTEMPTS);
    }

    @Test
    void concurrentCorrectVerifies_succeedExactlyOnce() throws Exception {
        otp.issue(MOBILE, P);
        String code = lastCode();
        List<ErrorCode> results = concurrently(5, () -> otp.verify(MOBILE, P, code));
        assertThat(results.stream().filter(c -> c == null).count()).isEqualTo(1);
        assertThat(results.stream().filter(c -> c == ErrorCode.OTP_INVALID).count()).isEqualTo(4);
    }
}
