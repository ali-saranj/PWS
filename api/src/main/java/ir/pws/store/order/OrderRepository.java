package ir.pws.store.order;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByTrackingCode(String trackingCode);

    Page<Order> findByCustomerIdOrderByPlacedAtDesc(Long customerId, Pageable pageable);
}
