package ir.pws.store.staff;

import ir.pws.store.common.security.Roles;
import ir.pws.store.staff.dto.CreateStaffRequest;
import ir.pws.store.staff.dto.PasswordRequest;
import ir.pws.store.staff.dto.StaffDto;
import ir.pws.store.staff.dto.UpdateStaffRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/staff")
@PreAuthorize(Roles.OWNER)
public class StaffAdminController {

    private final StaffAdminService service;

    public StaffAdminController(StaffAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<StaffDto> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffDto create(@Valid @RequestBody CreateStaffRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public StaffDto update(@PathVariable long id, @Valid @RequestBody UpdateStaffRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable long id, @Valid @RequestBody PasswordRequest request) {
        service.resetPassword(id, request);
    }
}
