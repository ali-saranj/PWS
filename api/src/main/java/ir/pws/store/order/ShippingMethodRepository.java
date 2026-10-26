package ir.pws.store.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShippingMethodRepository extends JpaRepository<ShippingMethod, Long> {

    List<ShippingMethod> findByActiveTrueOrderBySortOrderAsc();
}
