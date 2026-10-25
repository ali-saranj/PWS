package ir.pws.store.catalog.inventory;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByVariantIdOrderByIdAsc(long variantId);

    Page<StockMovement> findByVariantId(long variantId, Pageable pageable);
}
