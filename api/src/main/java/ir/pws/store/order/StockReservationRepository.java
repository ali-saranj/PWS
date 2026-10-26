package ir.pws.store.order;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {

    @Query("SELECT COALESCE(SUM(r.qty), 0) FROM StockReservation r " +
           "WHERE r.variantId = :variantId " +
           "AND r.status = ir.pws.store.order.StockReservationStatus.ACTIVE " +
           "AND r.expiresAt > :now")
    int sumActiveReservedQty(@Param("variantId") Long variantId, @Param("now") Instant now);

    List<StockReservation> findByOrderId(Long orderId);

    List<StockReservation> findByStatusAndExpiresAtBefore(StockReservationStatus status, Instant now);
}
