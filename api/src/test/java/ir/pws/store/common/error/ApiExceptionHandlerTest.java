package ir.pws.store.common.error;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ir.pws.store.common.web.RequestIdFilter;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

class ApiExceptionHandlerTest {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setFallbackToSystemLocale(false);
        ProblemFactory factory = new ProblemFactory(messages, new com.fasterxml.jackson.databind.ObjectMapper());
        mvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new ApiExceptionHandler(factory))
                .addFilters(new RequestIdFilter())
                .build();
    }

    @Test
    void apiException_rendersProblemWithBothLanguages() throws Exception {
        mvc.perform(get("/throw/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.messages.fa").value(not(emptyString())))
                .andExpect(jsonPath("$.messages.en").value(not(emptyString())))
                .andExpect(jsonPath("$.requestId").exists());
    }

    @Test
    void beanValidation_listsFieldErrors() throws Exception {
        mvc.perform(post("/throw/validate").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
    }

    @Test
    void malformedJson_isValidationFailed() throws Exception {
        mvc.perform(post("/throw/validate").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void optimisticLock_isConflict() throws Exception {
        mvc.perform(get("/throw/optimistic"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void dataIntegrityViolation_isConflict() throws Exception {
        mvc.perform(get("/throw/integrity"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void maxUpload_isFileTooLarge() throws Exception {
        mvc.perform(get("/throw/upload"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("file"))
                .andExpect(jsonPath("$.errors[0].code").value("FILE_TOO_LARGE"));
    }

    @Test
    void unexpected_isInternalErrorWithoutDetails() throws Exception {
        mvc.perform(get("/throw/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(content().string(not(containsString("secret"))));
    }

    @Test
    void fieldMessage_followsAcceptLanguage() throws Exception {
        mvc.perform(get("/throw/field").header("Accept-Language", "en"))
                .andExpect(jsonPath("$.errors[0].message").value("Invalid value"));
        mvc.perform(get("/throw/field"))
                .andExpect(jsonPath("$.errors[0].message").value(not("Invalid value")))
                .andExpect(jsonPath("$.errors[0].message").value(not(emptyString())));
    }

    @Test
    void gatewayDeactivated_rendersPersianMessage() throws Exception {
        mvc.perform(get("/throw/gateway-error"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("PAYMENT_GATEWAY_ERROR"))
                .andExpect(jsonPath("$.messages.fa").value("خطا در برقراری ارتباط با درگاه پرداخت بانکی."))
                .andExpect(jsonPath("$.errors[0].code").value("GATEWAY_DEACTIVATED"))
                .andExpect(jsonPath("$.errors[0].message").value("درگاه پرداخت در حال حاضر غیرفعال است."));
    }

    @Test
    void unsupportedMethod_keepsClientErrorStatus() throws Exception {
        mvc.perform(post("/throw/not-found"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Allow", containsString("GET")));
    }

    @Test
    void unsupportedMediaType_isMapped() throws Exception {
        mvc.perform(post("/throw/validate").contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().exists("Accept"));
    }

    @Test
    void multipartFailure_isValidationFailed() throws Exception {
        mvc.perform(get("/throw/multipart"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("file"));
    }

    @Test
    void constraintViolation_usesLeafPropertyName() throws Exception {
        mvc.perform(get("/throw/constraint"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
    }

    @Test
    void write_usesBootMapperAndKeepsUtf8() throws Exception {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setFallbackToSystemLocale(false);
        ProblemFactory factory = new ProblemFactory(
                messages, org.springframework.http.converter.json.Jackson2ObjectMapperBuilder.json().build());
        org.springframework.mock.web.MockHttpServletResponse response = new org.springframework.mock.web.MockHttpServletResponse();
        org.slf4j.MDC.put(RequestIdFilter.MDC_KEY, "req-1");
        try {
            factory.write(new org.springframework.mock.web.MockHttpServletRequest(), response, ErrorCode.UNAUTHENTICATED);
        } finally {
            org.slf4j.MDC.remove(RequestIdFilter.MDC_KEY);
        }
        String fa = messages.getMessage("error.UNAUTHENTICATED", null, ProblemFactory.FA);
        org.junit.jupiter.api.Assertions.assertEquals(401, response.getStatus());
        org.junit.jupiter.api.Assertions.assertTrue(response.getContentType().startsWith("application/problem+json"));
        String body = response.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        com.jayway.jsonpath.DocumentContext json = com.jayway.jsonpath.JsonPath.parse(body);
        org.junit.jupiter.api.Assertions.assertEquals("UNAUTHENTICATED", json.read("$.code"));
        org.junit.jupiter.api.Assertions.assertEquals(fa, json.read("$.messages.fa"));
        org.junit.jupiter.api.Assertions.assertEquals("req-1", json.read("$.requestId"));
    }

    /** Nested in a test class, so Spring Boot's TestTypeExcludeFilter keeps it out of component scanning. */
    @Controller
    @RequestMapping("/throw")
    @ResponseBody
    static class ThrowingController {

        record Body(@NotBlank String name) {}

        @org.springframework.web.bind.annotation.GetMapping("/not-found")
        String notFound() {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        @PostMapping("/validate")
        String validate(@Valid @RequestBody Body body) {
            return "ok";
        }

        @org.springframework.web.bind.annotation.GetMapping("/optimistic")
        String optimistic() {
            throw new ObjectOptimisticLockingFailureException("Product", 1L);
        }

        @org.springframework.web.bind.annotation.GetMapping("/integrity")
        String integrity() {
            throw new DataIntegrityViolationException("dup");
        }

        @org.springframework.web.bind.annotation.GetMapping("/upload")
        String upload() {
            throw new MaxUploadSizeExceededException(5);
        }

        @org.springframework.web.bind.annotation.GetMapping("/boom")
        String boom() {
            throw new IllegalStateException("secret");
        }

        @org.springframework.web.bind.annotation.GetMapping("/multipart")
        String multipart() {
            throw new org.springframework.web.multipart.MultipartException("bad");
        }

        @org.springframework.web.bind.annotation.GetMapping("/constraint")
        String constraint() {
            var v = jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator().validate(new Body(""));
            throw new jakarta.validation.ConstraintViolationException(v);
        }

        @org.springframework.web.bind.annotation.GetMapping("/field")
        String field() {
            throw ApiException.field("name", "INVALID");
        }

        @org.springframework.web.bind.annotation.GetMapping("/gateway-error")
        String gatewayError() {
            throw new ApiException(
                    ErrorCode.PAYMENT_GATEWAY_ERROR,
                    List.of(new FieldError("gateway", "GATEWAY_DEACTIVATED")));
        }
    }
}
