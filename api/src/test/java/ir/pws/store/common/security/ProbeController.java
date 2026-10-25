package ir.pws.store.common.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Test-only endpoints (lives in test sources) to verify method-security and CSRF wiring. */
@RestController
@RequestMapping("/api/admin/test-probe")
class ProbeController {

    @GetMapping("/owner-only")
    @PreAuthorize(Roles.OWNER)
    String ownerOnly() {
        return "ok";
    }

    @PostMapping("/echo")
    String echo() {
        return "ok";
    }
}
