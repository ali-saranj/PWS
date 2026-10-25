package ir.pws.store.staff;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StaffUserRepository extends JpaRepository<StaffUser, Long> {

    Optional<StaffUser> findByUsername(String username);

    /** SELECT ... FOR UPDATE, serialising concurrent login attempts for one account. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from StaffUser u where u.username = :username")
    Optional<StaffUser> findForUpdateByUsername(@Param("username") String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByMobile(String mobile);

    boolean existsByMobileAndIdNot(String mobile, Long id);

    /** Locks every active owner row (FOR UPDATE) so concurrent demotions are serialised before counting. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from StaffUser u where u.role = ir.pws.store.staff.StaffRole.OWNER and u.active = true order by u.id")
    java.util.List<StaffUser> lockActiveOwners();
}
