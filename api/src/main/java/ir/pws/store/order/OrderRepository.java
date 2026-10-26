package ir.pws.store.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByTrackingCode(String trackingCode);

    List<Order> findByStatusAndPlacedAtBefore(OrderStatus status, java.time.Instant before);

    boolean existsByOrderNumber(String orderNumber);

    boolean existsByTrackingCode(String trackingCode);

    Page<Order> findByCustomerIdOrderByPlacedAtDesc(Long customerId, Pageable pageable);
}
