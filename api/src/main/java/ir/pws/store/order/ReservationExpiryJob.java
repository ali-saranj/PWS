package ir.pws.store.order;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ReservationExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpiryJob.class);

    private final StockReservationRepository reservationRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final Clock clock;

    public ReservationExpiryJob(
            StockReservationRepository reservationRepository,
            OrderRepository orderRepository,
            OrderStatusHistoryRepository statusHistoryRepository,
            Clock clock) {
        this.reservationRepository = reservationRepository;
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.clock = clock;
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void releaseExpiredReservations() {
        Instant now = clock.instant();

        // 1. Expire all ACTIVE reservations that have passed their expiresAt
        List<StockReservation> activeExpired =
                reservationRepository.findByStatusAndExpiresAtBefore(StockReservationStatus.ACTIVE, now);

        if (!activeExpired.isEmpty()) {
            log.info("Expiring {} active stock reservations", activeExpired.size());
            for (StockReservation res : activeExpired) {
                res.setStatus(StockReservationStatus.EXPIRED);
            }
            reservationRepository.saveAll(activeExpired);
        }

        // 2. Cancel PENDING_PAYMENT orders older than 30 minutes where all reservations are expired
        Instant thirtyMinsAgo = now.minus(Duration.ofMinutes(30));
        List<Order> pendingOldOrders =
                orderRepository.findByStatusAndPlacedAtBefore(OrderStatus.PENDING_PAYMENT, thirtyMinsAgo);

        for (Order order : pendingOldOrders) {
            List<StockReservation> reservations = reservationRepository.findByOrderId(order.getId());
            boolean allExpiredOrReleased = !reservations.isEmpty() && reservations.stream()
                    .allMatch(r -> r.getStatus() == StockReservationStatus.EXPIRED
                            || r.getStatus() == StockReservationStatus.RELEASED);

            if (allExpiredOrReleased) {
                log.info("Auto-cancelling expired order {} (placed at {})", order.getOrderNumber(), order.getPlacedAt());
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);
                statusHistoryRepository.save(new OrderStatusHistory(
                        order.getId(),
                        OrderStatus.PENDING_PAYMENT,
                        OrderStatus.CANCELLED,
                        ActorType.SYSTEM,
                        null,
                        "انقضای زمان پرداخت و لغو خودکار سفارش"
                ));
            }
        }
    }
}
