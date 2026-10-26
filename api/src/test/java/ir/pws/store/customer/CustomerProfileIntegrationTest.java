package ir.pws.store.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ir.pws.store.common.security.JwtService;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class CustomerProfileIntegrationTest extends IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JwtService jwtService;

    @Test
    void updateProfile_authenticated_updatesNameAndEmail() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121113355").build());
        String token = jwtService.generateCustomerAccessToken(customer.getId(), customer.getMobile());

        mockMvc.perform(put("/api/shop/customer/profile")
                .cookie(new Cookie("pws_shop_at", token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"علی\",\"lastName\":\"محمدی\",\"email\":\"ali@example.com\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").value("علی"))
            .andExpect(jsonPath("$.lastName").value("محمدی"))
            .andExpect(jsonPath("$.email").value("ali@example.com"));

        Customer updated = customerRepository.findById(customer.getId()).orElseThrow();
        assertThat(updated.getFirstName()).isEqualTo("علی");
        assertThat(updated.getLastName()).isEqualTo("محمدی");
        assertThat(updated.getEmail()).isEqualTo("ali@example.com");
    }

    @Test
    void updateProfile_unauthenticated_returns401() throws Exception {
        mockMvc.perform(put("/api/shop/customer/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"علی\",\"lastName\":\"محمدی\",\"email\":\"ali@example.com\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void updateProfile_invalidEmail_returns400() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121113366").build());
        String token = jwtService.generateCustomerAccessToken(customer.getId(), customer.getMobile());

        mockMvc.perform(put("/api/shop/customer/profile")
                .cookie(new Cookie("pws_shop_at", token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"علی\",\"lastName\":\"محمدی\",\"email\":\"invalid-email-format\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void me_returnsEmail() throws Exception {
        Customer customer = customerRepository.save(
                Customer.builder().mobile("09121113377").firstName("سارا").email("sara@example.com").build());
        String token = jwtService.generateCustomerAccessToken(customer.getId(), customer.getMobile());

        mockMvc.perform(get("/api/shop/auth/me")
                .cookie(new Cookie("pws_shop_at", token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mobile").value("09121113377"))
            .andExpect(jsonPath("$.firstName").value("سارا"))
            .andExpect(jsonPath("$.email").value("sara@example.com"));
    }
}
