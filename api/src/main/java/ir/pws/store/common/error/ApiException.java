package ir.pws.store.common.error;

import java.util.List;

public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final List<FieldError> errors;

    public ApiException(ErrorCode code) {
        this(code, List.of());
    }

    public ApiException(ErrorCode code, List<FieldError> errors) {
        super(code.name());
        this.code = code;
        this.errors = List.copyOf(errors);
    }

    public static ApiException field(String field, String fieldCode) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, List.of(new FieldError(field, fieldCode)));
    }

    public ErrorCode code() {
        return code;
    }

    public List<FieldError> errors() {
        return errors;
    }
}
