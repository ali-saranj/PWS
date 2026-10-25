package ir.pws.store.catalog.variant;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VolumeTierRepository extends JpaRepository<VolumeTier, Long> {

    List<VolumeTier> findByVariantIdOrderByMinQtyAsc(long variantId);

    List<VolumeTier> findByVariantIdInOrderByMinQtyAsc(Collection<Long> variantIds);

    void deleteByVariantId(long variantId);
}
