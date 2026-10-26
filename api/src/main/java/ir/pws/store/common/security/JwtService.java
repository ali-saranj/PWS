package ir.pws.store.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import ir.pws.store.config.AppProperties;
import ir.pws.store.customer.Customer;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public static final String STAFF_AUDIENCE = "pws-staff";
    public static final String STAFF_CHALLENGE_AUDIENCE = "pws-staff-challenge";
    public static final String CUSTOMER_AUDIENCE = "pws-customer";
    public static final Duration STAFF_ACCESS_TTL = Duration.ofMinutes(15);
    public static final Duration STAFF_CHALLENGE_TTL = Duration.ofMinutes(5);
    public static final Duration CUSTOMER_ACCESS_TTL = Duration.ofMinutes(15);

    private final Clock clock;
    private final SecretKey staffKey;
    private final SecretKey customerKey;

    public JwtService(AppProperties props, Clock clock) {
        this.clock = clock;
        this.staffKey = Keys.hmacShaKeyFor(props.jwt().staffSecret().getBytes(StandardCharsets.UTF_8));
        this.customerKey = Keys.hmacShaKeyFor(props.jwt().customerSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String staffAccessToken(StaffUser user) {
        return base(String.valueOf(user.getId()), STAFF_AUDIENCE, STAFF_ACCESS_TTL, staffKey)
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .compact();
    }

    public Optional<StaffPrincipal> parseStaffAccess(String token) {
        return parse(token, STAFF_AUDIENCE, staffKey).flatMap(c -> {
            try {
                return Optional.of(new StaffPrincipal(
                        Long.parseLong(c.getSubject()),
                        c.get("username", String.class),
                        StaffRole.valueOf(c.get("role", String.class))));
            } catch (RuntimeException e) {
                return Optional.empty();
            }
        });
    }

    public String generateCustomerAccessToken(long customerId, String mobile) {
        return base(String.valueOf(customerId), CUSTOMER_AUDIENCE, CUSTOMER_ACCESS_TTL, customerKey)
                .claim("mobile", mobile)
                .compact();
    }

    public String customerAccessToken(Customer customer) {
        return generateCustomerAccessToken(customer.getId(), customer.getMobile());
    }

    public Optional<CustomerPrincipal> parseCustomerAccess(String token) {
        return parse(token, CUSTOMER_AUDIENCE, customerKey).flatMap(c -> {
            try {
                return Optional.of(new CustomerPrincipal(
                        Long.parseLong(c.getSubject()),
                        c.get("mobile", String.class)));
            } catch (RuntimeException e) {
                return Optional.empty();
            }
        });
    }

    public String staffChallenge(long staffId) {
        return base(String.valueOf(staffId), STAFF_CHALLENGE_AUDIENCE, STAFF_CHALLENGE_TTL, staffKey)
                .compact();
    }

    public Optional<Long> parseStaffChallenge(String token) {
        return parse(token, STAFF_CHALLENGE_AUDIENCE, staffKey).flatMap(c -> {
            try {
                return Optional.of(Long.parseLong(c.getSubject()));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        });
    }

    private io.jsonwebtoken.JwtBuilder base(String subject, String audience, Duration ttl, SecretKey key) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(subject)
                .audience()
                .add(audience)
                .and()
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key, Jwts.SIG.HS256);
    }

    private Optional<Claims> parse(String token, String audience, SecretKey key) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            JwtParser parser = Jwts.parser()
                    .verifyWith(key)
                    .requireAudience(audience)
                    .clock(() -> Date.from(clock.instant()))
                    .build();
            Jws<Claims> jws = parser.parseSignedClaims(token);
            // Pin HS256 and require an expiry: a token that never expires is never valid.
            if (!Jwts.SIG.HS256.getId().equals(jws.getHeader().getAlgorithm())
                    || jws.getPayload().getExpiration() == null) {
                return Optional.empty();
            }
            return Optional.of(jws.getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
