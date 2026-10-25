package ir.pws.store.audit;

import com.fasterxml.jackson.databind.JsonNode;
import ir.pws.store.common.security.Roles;
import ir.pws.store.common.web.PageResponse;
import ir.pws.store.staff.StaffUser;
import ir.pws.store.staff.StaffUserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {

    public record AuditEntryDto(
            long id,
            String staffUsername,
            String action,
            String entityType,
            Long entityId,
            JsonNode before,
            JsonNode after,
            String ip,
            Instant createdAt) {}

    private final AuditEntryRepository entries;
    private final StaffUserRepository staff;

    public AuditController(AuditEntryRepository entries, StaffUserRepository staff) {
        this.entries = entries;
        this.staff = staff;
    }

    @GetMapping
    @PreAuthorize(Roles.OWNER)
    public PageResponse<AuditEntryDto> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long staffUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest request = PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "id"));
        Page<AuditEntry> result = entries.search(
                entityType == null || entityType.isBlank() ? null : entityType, staffUserId, request);
        Set<Long> ids = result.stream()
                .map(AuditEntry::getStaffUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> names = staff.findAllById(ids).stream()
                .collect(Collectors.toMap(StaffUser::getId, StaffUser::getUsername));
        return PageResponse.of(result.map(a -> new AuditEntryDto(
                a.getId(),
                a.getStaffUserId() == null ? null : names.get(a.getStaffUserId()),
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getBefore(),
                a.getAfter(),
                a.getIp(),
                a.getCreatedAt())));
    }
}
