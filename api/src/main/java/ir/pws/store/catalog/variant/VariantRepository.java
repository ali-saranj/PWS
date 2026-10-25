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

    /** Locks all given rows in ascending id order (one SELECT ... ORDER BY id FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Variant v where v.id in :ids order by v.id")
    List<Variant> lockAllByIdOrdered(Collection<Long> ids);

    @Query(value = """
            select new ir.pws.store.catalog.inventory.InventoryRowDto(v.id, p.id, p.nameFa, p.nameEn, v.sku,
                   v.flavourFa, v.flavourEn, v.sizeLabel, v.stockOnHand, v.lowStockThreshold, v.active)
            from Variant v, Product p
            where p.id = v.productId
              and (:lowStock = false or v.stockOnHand <= v.lowStockThreshold)
              and (lower(v.sku) like :like escape '\\' or lower(p.nameFa) like :like escape '\\'
                   or lower(coalesce(p.nameEn, '')) like :like escape '\\')
            order by v.stockOnHand asc, v.id asc""",
            countQuery = """
            select count(v) from Variant v, Product p
            where p.id = v.productId
              and (:lowStock = false or v.stockOnHand <= v.lowStockThreshold)
              and (lower(v.sku) like :like escape '\\' or lower(p.nameFa) like :like escape '\\'
                   or lower(coalesce(p.nameEn, '')) like :like escape '\\')""")
    org.springframework.data.domain.Page<ir.pws.store.catalog.inventory.InventoryRowDto> searchInventory(
            String like, boolean lowStock, org.springframework.data.domain.Pageable pageable);

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
