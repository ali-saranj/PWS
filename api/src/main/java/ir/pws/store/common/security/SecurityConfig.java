package ir.pws.store.common.security;

import ir.pws.store.config.AppProperties;
import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /** Explicit empty user store: stops Boot generating a default user and "generated security password". */
    @Bean
    UserDetailsService noUserDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("No user store");
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http, JwtService jwt, ProblemAuthHandlers handlers, AppProperties props) throws Exception {
        boolean secureCookies = props.cookies().secure();
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepository.setCookieCustomizer(c -> c.sameSite("Lax").secure(secureCookies));
        return http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(c -> c.csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        .ignoringRequestMatchers("/api/shop/**"))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e.authenticationEntryPoint(handlers).accessDeniedHandler(handlers))
                .addFilterBefore(new StaffJwtCookieFilter(jwt), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new CustomerJwtCookieFilter(jwt), UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(a -> a.dispatcherTypeMatchers(DispatcherType.ERROR)
                        .permitAll() // container-level errors keep their real status instead of becoming 401
                        .requestMatchers("/actuator/health", "/actuator/health/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/media/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/auth/csrf")
                        .permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/admin/auth/login",
                                "/api/admin/auth/verify",
                                "/api/admin/auth/refresh",
                                "/api/admin/auth/logout")
                        .permitAll()
                        .requestMatchers("/api/admin/**")
                        .authenticated()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/shop/auth/otp",
                                "/api/shop/auth/verify",
                                "/api/shop/auth/refresh",
                                "/api/shop/auth/logout")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/shop/catalog/**")
                        .permitAll()
                        .requestMatchers("/api/shop/auth/me", "/api/shop/customer/**")
                        .authenticated()
                        .anyRequest()
                        .denyAll())
                .build();
    }
}
