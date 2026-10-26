package ir.pws.store.customer;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(Long customerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Address a set a.isDefault = false, a.updatedAt = :now where a.customerId = :customerId and a.isDefault = true")
    void unsetDefaultForCustomer(@Param("customerId") Long customerId, @Param("now") Instant now);
}
