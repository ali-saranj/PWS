package ir.pws.store.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates {@code /api/admin/**} requests from the {@code pws_admin_at} cookie. An invalid or missing token
 * leaves the request anonymous; the authorization rules and entry point then answer 401. Deliberately not a bean,
 * so it is only registered inside the security filter chain.
 */
public class StaffJwtCookieFilter extends OncePerRequestFilter {

    private final JwtService jwt;

    public StaffJwtCookieFilter(JwtService jwt) {
        this.jwt = jwt;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.equals("/api/admin") || path.startsWith("/api/admin/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (AuthCookies.STAFF_ACCESS.equals(cookie.getName())) {
                    jwt.parseStaffAccess(cookie.getValue()).ifPresent(p -> {
                        var auth = UsernamePasswordAuthenticationToken.authenticated(
                                p, null, List.of(new SimpleGrantedAuthority("ROLE_" + p.role().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
                    break;
                }
            }
        }
        chain.doFilter(request, response);
    }
}
