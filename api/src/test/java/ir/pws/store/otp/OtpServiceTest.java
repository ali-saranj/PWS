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
import java.util.List;
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
}
