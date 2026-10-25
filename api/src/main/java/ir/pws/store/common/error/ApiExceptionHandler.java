package ir.pws.store.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    private final ProblemFactory problems;

    public ApiExceptionHandler(ProblemFactory problems) {
        this.problems = problems;
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ProblemDetail> handleApi(ApiException ex, HttpServletRequest request) {
        return respond(ex.code(), ex.errors(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ProblemDetail> handleBeanValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<FieldError> errors = new ArrayList<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(fe -> errors.add(new FieldError(fe.getField(), codeOrInvalid(fe.getCode()))));
        ex.getBindingResult()
                .getGlobalErrors()
                .forEach(ge -> errors.add(new FieldError(ge.getObjectName(), codeOrInvalid(ge.getCode()))));
        return respond(ErrorCode.VALIDATION_FAILED, errors, request);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ProblemDetail> handleMethodValidation(HandlerMethodValidationException ex, HttpServletRequest request) {
        List<FieldError> errors = new ArrayList<>();
        ex.getParameterValidationResults().forEach(result -> {
            String param = result.getMethodParameter().getParameterName();
            if (result instanceof ParameterErrors pe) {
                pe.getFieldErrors().forEach(fe -> errors.add(new FieldError(fe.getField(), codeOrInvalid(fe.getCode()))));
            } else {
                for (MessageSourceResolvable error : result.getResolvableErrors()) {
                    String code = error instanceof DefaultMessageSourceResolvable d ? d.getCode() : null;
                    errors.add(new FieldError(param == null ? "" : param, codeOrInvalid(code)));
                }
            }
        });
        return respond(ErrorCode.VALIDATION_FAILED, errors, request);
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class
    })
    ResponseEntity<ProblemDetail> handleBadRequest(Exception ex, HttpServletRequest request) {
        return respond(ErrorCode.VALIDATION_FAILED, List.of(), request);
    }

    @ExceptionHandler({ObjectOptimisticLockingFailureException.class, DataIntegrityViolationException.class})
    ResponseEntity<ProblemDetail> handleConflict(Exception ex, HttpServletRequest request) {
        log.warn("Conflict: {}", ex.getClass().getSimpleName());
        return respond(ErrorCode.CONFLICT, List.of(), request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ProblemDetail> handleUploadTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return respond(ErrorCode.VALIDATION_FAILED, List.of(new FieldError("file", "FILE_TOO_LARGE")), request);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<ProblemDetail> handleMissingPart(MissingServletRequestPartException ex, HttpServletRequest request) {
        return respond(ErrorCode.VALIDATION_FAILED, List.of(new FieldError(ex.getRequestPartName(), "REQUIRED")), request);
    }

    @ExceptionHandler(MultipartException.class)
    ResponseEntity<ProblemDetail> handleMultipart(MultipartException ex, HttpServletRequest request) {
        return respond(ErrorCode.VALIDATION_FAILED, List.of(new FieldError("file", "INVALID")), request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        List<FieldError> errors = ex.getConstraintViolations().stream()
                .map(v -> {
                    String field = null;
                    for (Path.Node node : v.getPropertyPath()) {
                        field = node.getName();
                    }
                    String code = v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName();
                    return new FieldError(field == null ? "" : field, code);
                })
                .toList();
        return respond(ErrorCode.VALIDATION_FAILED, errors, request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ProblemDetail> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return respond(ErrorCode.NOT_FOUND, List.of(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, HttpServletRequest request) throws Exception {
        // Security exceptions belong to Spring Security's own handlers.
        if (ex instanceof AccessDeniedException || ex instanceof AuthenticationException) {
            throw ex;
        }
        if (ex instanceof ErrorResponse er && er.getStatusCode().is4xxClientError()) {
            ErrorCode code = switch (er.getStatusCode().value()) {
                case 404 -> ErrorCode.NOT_FOUND;
                case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
                case 415 -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
                default -> ErrorCode.VALIDATION_FAILED;
            };
            ResponseEntity<ProblemDetail> response = respond(code, List.of(), request);
            ProblemDetail problem = response.getBody();
            if (code == ErrorCode.VALIDATION_FAILED && problem != null) {
                problem.setStatus(er.getStatusCode().value());
            }
            return ResponseEntity.status(er.getStatusCode())
                    .headers(er.getHeaders())
                    .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                    .body(problem);
        }
        log.error("Unhandled exception", ex);
        return respond(ErrorCode.INTERNAL_ERROR, List.of(), request);
    }

    private ResponseEntity<ProblemDetail> respond(ErrorCode code, List<FieldError> errors, HttpServletRequest request) {
        ProblemDetail problem = problems.build(code, errors, problems.resolveLocale(request));
        return ResponseEntity.status(code.status())
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    private static String codeOrInvalid(String code) {
        return code == null ? "INVALID" : code;
    }
}
