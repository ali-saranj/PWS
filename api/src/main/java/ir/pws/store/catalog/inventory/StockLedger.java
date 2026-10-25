package ir.pws.store.catalog.inventory;

import ir.pws.store.catalog.variant.Variant;
import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.security.StaffPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** The only writer of {@code variant.stock_on_hand}; every change leaves a {@link StockMovement}. */
@Service
public class StockLedger {

    private final EntityManager em;
    private final StockMovementRepository movements;

    public StockLedger(EntityManager em, StockMovementRepository movements) {
        this.em = em;
        this.movements = movements;
    }

    /**
     * Applies {@code delta} to the variant's stock. Joins the caller's transaction (required). The row is locked
     * ({@code PESSIMISTIC_WRITE}) and its state re-read, so concurrent adjustments serialise and never lose updates.
     * {@code v} must be a persisted entity managed by the current transaction; pending changes are flushed first and
     * the instance is refreshed with the locked, current stock. A result below zero throws
     * {@code delta / STOCK_NEGATIVE} (the DB CHECK is the last line of defence).
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void apply(Variant v, int delta, StockMovementReason reason, Long refId, String note) {
        em.flush();
        em.refresh(v, LockModeType.PESSIMISTIC_WRITE);
        long result = (long) v.getStockOnHand() + delta;
        if (result < 0) {
            throw ApiException.field("delta", "STOCK_NEGATIVE");
        }
        v.setStockOnHand((int) result);
        movements.save(new StockMovement(v.getId(), delta, reason, refId, currentStaffId(), note));
        em.flush();
    }

    private static Long currentStaffId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof StaffPrincipal p ? p.id() : null;
    }
}
