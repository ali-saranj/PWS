package ir.pws.store.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates {@code /api/shop/**} requests from the {@code Authorization: Bearer <token>} header or the
 * {@code pws_shop_at} cookie. An invalid or missing token leaves the request anonymous; the authorization rules
 * and entry point then answer 401 when authentication is required. Deliberately not a bean, so it is only
 * registered inside the security filter chain.
 */
public class CustomerJwtCookieFilter extends OncePerRequestFilter {

    private final JwtService jwt;

    public CustomerJwtCookieFilter(JwtService jwt) {
        this.jwt = jwt;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.equals("/api/shop") || path.startsWith("/api/shop/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = resolveToken(request, AuthCookies.CUSTOMER_ACCESS);
        if (token != null && !token.isBlank()) {
            jwt.parseCustomerAccess(token).ifPresent(p -> {
                var auth = UsernamePasswordAuthenticationToken.authenticated(
                        p, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request, String cookieName) {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth != null && auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String bearer = auth.substring(7).trim();
            if (!bearer.isEmpty()) {
                return bearer;
            }
        }
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
