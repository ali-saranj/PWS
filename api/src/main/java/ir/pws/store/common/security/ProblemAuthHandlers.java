package ir.pws.store.common.security;

import ir.pws.store.common.error.ErrorCode;
import ir.pws.store.common.error.ProblemFactory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/** Security failures as problem+json: 401 UNAUTHENTICATED and 403 FORBIDDEN (including CSRF failures). */
@Component
public class ProblemAuthHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ProblemFactory problems;

    public ProblemAuthHandlers(ProblemFactory problems) {
        this.problems = problems;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        problems.write(request, response, ErrorCode.UNAUTHENTICATED);
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {
        problems.write(request, response, ErrorCode.FORBIDDEN);
    }
}
