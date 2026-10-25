package ir.pws.store.catalog.variant;

import java.util.Collection;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VariantRepository extends JpaRepository<Variant, Long> {

    /** Row-locking lookup (SELECT ... FOR UPDATE); serialises with StockLedger and other editors of the variant. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Variant v where v.id = :id")
    Optional<Variant> findByIdForUpdate(long id);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, long id);

    boolean existsByProductIdAndActiveTrue(long productId);

    List<Variant> findByProductIdOrderBySortOrderAscIdAsc(long productId);

    List<Variant> findByProductIdInOrderBySortOrderAscIdAsc(Collection<Long> productIds);

    /** Per-product aggregates for the product list: one query for a whole page. */
    @Query("""
            select v.productId as productId, count(v) as variantCount,
                   min(case when v.active = true then v.basePrice end) as minPrice,
                   coalesce(sum(v.stockOnHand), 0) as totalStock
            from Variant v where v.productId in :productIds group by v.productId""")
    List<ProductAggregate> aggregateByProductIds(Collection<Long> productIds);

    interface ProductAggregate {
        Long getProductId();

        Long getVariantCount();

        Long getMinPrice();

        Long getTotalStock();
    }
}
