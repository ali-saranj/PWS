package ir.pws.store.catalog.image;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAscIdAsc(long productId);

    @Query("select coalesce(max(i.sortOrder), -1) from ProductImage i where i.productId = :productId")
    int maxSortOrder(long productId);

    /** The first image (lowest sortOrder, then id) of each given product, in one query. */
    @Query("""
            select i from ProductImage i
            where i.productId in :productIds
              and i.id = (select min(j.id) from ProductImage j
                          where j.productId = i.productId
                            and j.sortOrder = (select min(k.sortOrder) from ProductImage k
                                               where k.productId = i.productId))""")
    List<ProductImage> findFirstImages(Collection<Long> productIds);
}
