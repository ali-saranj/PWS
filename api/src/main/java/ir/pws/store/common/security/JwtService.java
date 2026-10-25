package ir.pws.store.common.security;

import ir.pws.store.config.AppProperties;
import ir.pws.store.staff.StaffRole;
import ir.pws.store.staff.StaffUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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
    public static final Duration STAFF_ACCESS_TTL = Duration.ofMinutes(15);
    public static final Duration STAFF_CHALLENGE_TTL = Duration.ofMinutes(5);

    private final Clock clock;
    private final SecretKey staffKey;

    public JwtService(AppProperties props, Clock clock) {
        this.clock = clock;
        this.staffKey = Keys.hmacShaKeyFor(props.jwt().staffSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String staffAccessToken(StaffUser user) {
        return base(String.valueOf(user.getId()), STAFF_AUDIENCE, STAFF_ACCESS_TTL)
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .compact();
    }

    public Optional<StaffPrincipal> parseStaffAccess(String token) {
        return parse(token, STAFF_AUDIENCE).flatMap(c -> {
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

    public String staffChallenge(long staffId) {
        return base(String.valueOf(staffId), STAFF_CHALLENGE_AUDIENCE, STAFF_CHALLENGE_TTL)
                .compact();
    }

    public Optional<Long> parseStaffChallenge(String token) {
        return parse(token, STAFF_CHALLENGE_AUDIENCE).flatMap(c -> {
            try {
                return Optional.of(Long.parseLong(c.getSubject()));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        });
    }

    private io.jsonwebtoken.JwtBuilder base(String subject, String audience, Duration ttl) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(subject)
                .audience()
                .add(audience)
                .and()
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(staffKey, Jwts.SIG.HS256);
    }

    private Optional<Claims> parse(String token, String audience) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            JwtParser parser = Jwts.parser()
                    .verifyWith(staffKey)
                    .requireAudience(audience)
                    .clock(() -> Date.from(clock.instant()))
                    .build();
            return Optional.of(parser.parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
