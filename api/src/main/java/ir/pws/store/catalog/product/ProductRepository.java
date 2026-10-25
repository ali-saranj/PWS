package ir.pws.store.catalog.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, long id);

    boolean existsByBrandId(long brandId);

    boolean existsByCategoryId(long categoryId);
}
