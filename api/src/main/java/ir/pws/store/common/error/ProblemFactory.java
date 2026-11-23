package ir.pws.store.common.error;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.common.web.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.MDC;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;

/** Builds RFC 7807 problem details with bilingual messages. Reused by the Spring Security handlers. */
@Component
public class ProblemFactory {

    public static final Locale FA = Locale.forLanguageTag("fa");
    public static final Locale EN = Locale.ENGLISH;
    private static final List<Locale.LanguageRange> SUPPORTED = Locale.LanguageRange.parse("fa,en");

    private final MessageSource messages;
    private final ObjectMapper objectMapper;

    public ProblemFactory(MessageSource messages, ObjectMapper objectMapper) {
        this.messages = messages;
        this.objectMapper = objectMapper;
    }

    /** Picks fa or en from Accept-Language; defaults to fa. Storefront requests (/api/shop/**) always use Persian. */
    public Locale resolveLocale(HttpServletRequest request) {
        if (request != null) {
            String uri = request.getRequestURI();
            if (uri != null && uri.startsWith("/api/shop")) {
                return FA;
            }
            String header = request.getHeader("Accept-Language");
            if (header != null && !header.isBlank()) {
                try {
                    Locale match = Locale.lookup(Locale.LanguageRange.parse(header), List.of(FA, EN));
                    return match != null ? match : FA;
                } catch (IllegalArgumentException ignored) {
                    return FA;
                }
            }
        }
        return FA;
    }

    public ProblemDetail build(ErrorCode code, List<FieldError> errors, Locale locale) {
        ProblemDetail problem = ProblemDetail.forStatus(code.status());
        problem.setProperty("code", code.name());
        Map<String, String> bilingual = new LinkedHashMap<>();
        bilingual.put("fa", message("error." + code.name(), code.name(), FA));
        bilingual.put("en", message("error." + code.name(), code.name(), EN));
        problem.setProperty("messages", bilingual);
        String requestId = MDC.get(RequestIdFilter.MDC_KEY);
        if (requestId != null) {
            problem.setProperty("requestId", requestId);
        }
        if (errors != null && !errors.isEmpty()) {
            String fallback = message("field.INVALID", "INVALID", locale);
            String fallbackFa = message("field.INVALID", "INVALID", FA);
            String fallbackEn = message("field.INVALID", "INVALID", EN);
            problem.setProperty(
                    "errors",
                    errors.stream()
                            .map(e -> {
                                Map<String, Object> err = new LinkedHashMap<>();
                                err.put("field", e.field());
                                err.put("code", e.code());
                                err.put("message", message("field." + e.code(), fallback, locale));
                                Map<String, String> errorBilingual = new LinkedHashMap<>();
                                errorBilingual.put("fa", message("field." + e.code(), fallbackFa, FA));
                                errorBilingual.put("en", message("field." + e.code(), fallbackEn, EN));
                                err.put("messages", errorBilingual);
                                return err;
                            })
                            .toList());
        }
        return problem;
    }

    /** Writes the problem directly, for code outside MVC such as security entry points. */
    public void write(HttpServletRequest request, HttpServletResponse response, ErrorCode code) throws IOException {
        ProblemDetail problem = build(code, List.of(), resolveLocale(request));
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(), problem);
    }

    private String message(String key, String defaultMessage, Locale locale) {
        return messages.getMessage(key, null, defaultMessage, locale);
    }
}
