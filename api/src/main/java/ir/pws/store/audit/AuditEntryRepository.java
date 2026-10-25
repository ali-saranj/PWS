package ir.pws.store.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditEntryRepository extends JpaRepository<AuditEntry, Long> {

    @Query("""
            select a from AuditEntry a
            where (:entityType is null or a.entityType = :entityType)
              and (:staffUserId is null or a.staffUserId = :staffUserId)
            """)
    Page<AuditEntry> search(
            @Param("entityType") String entityType, @Param("staffUserId") Long staffUserId, Pageable pageable);
}
