package ir.pws.store.otp;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findFirstByMobileAndPurposeOrderByCreatedAtDescIdDesc(String mobile, OtpPurpose purpose);

    long countByMobileAndPurposeAndCreatedAtAfter(String mobile, OtpPurpose purpose, Instant after);
}
