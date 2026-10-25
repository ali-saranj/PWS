package ir.pws.store.common.web;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ir.pws.store.support.IntegrationTest;
import org.junit.jupiter.api.Test;

class RequestIdFilterTest extends IntegrationTest {

    @Test
    void health_isUp() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void requestId_isEchoedWhenProvided() throws Exception {
        mvc.perform(get("/actuator/health").header("X-Request-Id", "abc-123"))
                .andExpect(header().string("X-Request-Id", "abc-123"));
    }

    @Test
    void requestId_isGeneratedWhenMissing() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(header().string("X-Request-Id", matchesPattern("[0-9a-f\\-]{36}")));
    }
}
