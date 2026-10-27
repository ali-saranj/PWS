package ir.pws.store.customer;

import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.CustomerPrincipal;
import ir.pws.store.common.security.Roles;
import ir.pws.store.customer.dto.CustomerDto;
import ir.pws.store.customer.dto.CustomerOtpRequest;
import ir.pws.store.customer.dto.CustomerVerifyRequest;
import ir.pws.store.customer.dto.UpdateCustomerProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop")
public class ShopAuthController {

    private final CustomerAuthService auth;
    private final AuthCookies cookies;

    public ShopAuthController(CustomerAuthService auth, AuthCookies cookies) {
        this.auth = auth;
        this.cookies = cookies;
    }

    @PostMapping("/auth/otp")
    public ResponseEntity<Void> requestOtp(@Valid @RequestBody CustomerOtpRequest request) {
        auth.issueOtp(request.mobile());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auth/verify")
    public ResponseEntity<CustomerDto> verify(@Valid @RequestBody CustomerVerifyRequest request) {
        return withSession(auth.verify(request.mobile(), request.code()));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<CustomerDto> refresh(
            @CookieValue(name = AuthCookies.CUSTOMER_REFRESH, required = false) String refreshToken) {
        return withSession(auth.refresh(refreshToken));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = AuthCookies.CUSTOMER_REFRESH, required = false) String refreshToken) {
        auth.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.clearCustomerAccess().toString())
                .header(HttpHeaders.SET_COOKIE, cookies.clearCustomerRefresh().toString())
                .build();
    }

    @GetMapping("/auth/me")
    public CustomerDto me(@AuthenticationPrincipal CustomerPrincipal principal) {
        return CustomerDto.from(auth.getMe(principal.customerId()));
    }

    @PutMapping("/customer/profile")
    @PreAuthorize(Roles.CUSTOMER)
    public CustomerDto updateProfile(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @Valid @RequestBody UpdateCustomerProfileRequest request) {
        return CustomerDto.from(auth.updateProfile(principal.customerId(), request));
    }

    private ResponseEntity<CustomerDto> withSession(CustomerAuthService.Session session) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.customerAccess(session.accessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, cookies.customerRefresh(session.refreshToken()).toString())
                .body(CustomerDto.from(session.customer(), session.accessToken()));
    }
}
