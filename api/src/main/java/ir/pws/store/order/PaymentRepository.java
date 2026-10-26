package ir.pws.store.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAuthority(String authority);

    List<Payment> findByOrderId(Long orderId);
}
