package ir.pws.store.otp;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findFirstByMobileAndPurposeOrderByCreatedAtDescIdDesc(String mobile, OtpPurpose purpose);

    /** Same lookup as above but takes a row lock (SELECT ... FOR UPDATE) to serialise concurrent verifies. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<OtpCode> findFirstForUpdateByMobileAndPurposeOrderByCreatedAtDescIdDesc(String mobile, OtpPurpose purpose);

    long countByMobileAndPurposeAndCreatedAtAfter(String mobile, OtpPurpose purpose, Instant after);
}
