package ir.pws.store.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import ir.pws.store.common.security.AuthCookies;
import ir.pws.store.common.security.JwtService;
import ir.pws.store.customer.dto.AddressRequest;
import ir.pws.store.support.IntegrationTest;
import jakarta.servlet.http.Cookie;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class CustomerAddressManagementIntegrationTest extends IntegrationTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private Cookie createAuthCookie(Customer customer) {
        String token = jwtService.generateCustomerAccessToken(customer.getId(), customer.getMobile());
        return new Cookie(AuthCookies.CUSTOMER_ACCESS, token);
    }

    @Test
    void updateAddress_authenticated_updatesAllFields() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110001").build());
        Address address = addressRepository.save(new Address(
                customer.getId(),
                "Tehran",
                "Tehran",
                "Old Line",
                "1111111111",
                "Old Name",
                "09121110001",
                true));

        AddressRequest updateReq = new AddressRequest(
                "فارس",
                "شیراز",
                "خیابان ارم، پلاک ۱۰",
                "7134512345",
                "رضا رضایی",
                "09171234567",
                null);

        mvc.perform(put("/api/shop/customer/addresses/" + address.getId())
                        .cookie(createAuthCookie(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(address.getId()))
                .andExpect(jsonPath("$.province").value("فارس"))
                .andExpect(jsonPath("$.city").value("شیراز"))
                .andExpect(jsonPath("$.line").value("خیابان ارم، پلاک ۱۰"))
                .andExpect(jsonPath("$.postalCode").value("7134512345"))
                .andExpect(jsonPath("$.recipientName").value("رضا رضایی"))
                .andExpect(jsonPath("$.recipientMobile").value("09171234567"))
                .andExpect(jsonPath("$.isDefault").value(true));

        Address reloaded = addressRepository.findById(address.getId()).orElseThrow();
        assertThat(reloaded.getProvince()).isEqualTo("فارس");
        assertThat(reloaded.getCity()).isEqualTo("شیراز");
        assertThat(reloaded.getLine()).isEqualTo("خیابان ارم، پلاک ۱۰");
        assertThat(reloaded.getPostalCode()).isEqualTo("7134512345");
        assertThat(reloaded.getRecipientName()).isEqualTo("رضا رضایی");
        assertThat(reloaded.getRecipientMobile()).isEqualTo("09171234567");
        assertThat(reloaded.isDefault()).isTrue();
    }

    @Test
    void updateAddress_withIsDefaultTrue_promotesToDefaultAndUnsetsPrevious() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110099").build());
        Address addr1 = addressRepository.save(new Address(
                customer.getId(), "Tehran", "Tehran", "Line 1", "1111111111", "Name 1", "09121110099", true));
        Address addr2 = addressRepository.save(new Address(
                customer.getId(), "Isfahan", "Isfahan", "Line 2", "2222222222", "Name 2", "09121110099", false));

        AddressRequest updateReq = new AddressRequest(
                "Isfahan", "Isfahan", "Line 2 Updated", "2222222222", "Name 2", "09121110099", true);

        mvc.perform(put("/api/shop/customer/addresses/" + addr2.getId())
                        .cookie(createAuthCookie(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(addr2.getId()))
                .andExpect(jsonPath("$.line").value("Line 2 Updated"))
                .andExpect(jsonPath("$.isDefault").value(true));

        Address addr1Reloaded = addressRepository.findById(addr1.getId()).orElseThrow();
        Address addr2Reloaded = addressRepository.findById(addr2.getId()).orElseThrow();
        assertThat(addr1Reloaded.isDefault()).isFalse();
        assertThat(addr2Reloaded.isDefault()).isTrue();
    }

    @Test
    void deleteAddress_nonDefaultAddress_deletesSuccessfully() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110002").build());
        Address addr1 = addressRepository.save(new Address(
                customer.getId(), "Tehran", "Tehran", "Line 1", "1111111111", "Name 1", "09121110002", true));
        Address addr2 = addressRepository.save(new Address(
                customer.getId(), "Isfahan", "Isfahan", "Line 2", "2222222222", "Name 2", "09121110002", false));

        mvc.perform(delete("/api/shop/customer/addresses/" + addr2.getId())
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isNoContent());

        assertThat(addressRepository.findById(addr2.getId())).isEmpty();
        Address addr1Reloaded = addressRepository.findById(addr1.getId()).orElseThrow();
        assertThat(addr1Reloaded.isDefault()).isTrue();
    }

    @Test
    void deleteAddress_defaultAddress_autoPromotesLatestRemainingAddress() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110003").build());

        // Save addr1
        Address addr1 = addressRepository.saveAndFlush(new Address(
                customer.getId(), "Tehran", "Tehran", "Line 1", "1111111111", "Name 1", "09121110003", false));

        Thread.sleep(20);
        Address addr2 = addressRepository.saveAndFlush(new Address(
                customer.getId(), "Isfahan", "Isfahan", "Line 2", "2222222222", "Name 2", "09121110003", false));

        Thread.sleep(20);
        Address addr3 = addressRepository.saveAndFlush(new Address(
                customer.getId(), "Shiraz", "Shiraz", "Line 3", "3333333333", "Name 3", "09121110003", true));

        // Delete addr3 (which was default)
        mvc.perform(delete("/api/shop/customer/addresses/" + addr3.getId())
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isNoContent());

        assertThat(addressRepository.findById(addr3.getId())).isEmpty();

        // addr2 was created after addr1, so addr2 must be auto-promoted to default
        Address addr2Reloaded = addressRepository.findById(addr2.getId()).orElseThrow();
        assertThat(addr2Reloaded.isDefault()).isTrue();

        Address addr1Reloaded = addressRepository.findById(addr1.getId()).orElseThrow();
        assertThat(addr1Reloaded.isDefault()).isFalse();
    }

    @Test
    void deleteAddress_onlyAddress_deletesWithoutPromotion() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110004").build());
        Address addr = addressRepository.save(new Address(
                customer.getId(), "Tehran", "Tehran", "Line 1", "1111111111", "Name 1", "09121110004", true));

        mvc.perform(delete("/api/shop/customer/addresses/" + addr.getId())
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isNoContent());

        assertThat(addressRepository.findById(addr.getId())).isEmpty();
        List<Address> remaining = addressRepository.findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(customer.getId());
        assertThat(remaining).isEmpty();
    }

    @Test
    void setDefaultAddress_setsTargetAndUnsetsPreviousDefault() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110005").build());
        Address addr1 = addressRepository.save(new Address(
                customer.getId(), "Tehran", "Tehran", "Line 1", "1111111111", "Name 1", "09121110005", true));
        Address addr2 = addressRepository.save(new Address(
                customer.getId(), "Isfahan", "Isfahan", "Line 2", "2222222222", "Name 2", "09121110005", false));

        mvc.perform(put("/api/shop/customer/addresses/" + addr2.getId() + "/default")
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(addr2.getId()))
                .andExpect(jsonPath("$.isDefault").value(true));

        Address addr1Reloaded = addressRepository.findById(addr1.getId()).orElseThrow();
        Address addr2Reloaded = addressRepository.findById(addr2.getId()).orElseThrow();
        assertThat(addr1Reloaded.isDefault()).isFalse();
        assertThat(addr2Reloaded.isDefault()).isTrue();
    }

    @Test
    void customerIsolation_cannotUpdateOrDeleteOrSetDefaultOtherCustomerAddress() throws Exception {
        Customer customerA = customerRepository.save(Customer.builder().mobile("09121110006").build());
        Customer customerB = customerRepository.save(Customer.builder().mobile("09121110007").build());

        Address addrA = addressRepository.save(new Address(
                customerA.getId(), "Tehran", "Tehran", "Line A", "1111111111", "Name A", "09121110006", true));

        AddressRequest updateReq = new AddressRequest(
                "Tabriz", "Tabriz", "New Line", "5555555555", "Hacker", "09129999999", false);

        // Customer B tries to update Customer A's address -> 404
        mvc.perform(put("/api/shop/customer/addresses/" + addrA.getId())
                        .cookie(createAuthCookie(customerB))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        // Customer B tries to set Customer A's address as default -> 404
        mvc.perform(put("/api/shop/customer/addresses/" + addrA.getId() + "/default")
                        .cookie(createAuthCookie(customerB)))
                .andExpect(status().isNotFound());

        // Customer B tries to delete Customer A's address -> 404
        mvc.perform(delete("/api/shop/customer/addresses/" + addrA.getId())
                        .cookie(createAuthCookie(customerB)))
                .andExpect(status().isNotFound());

        // Verify Customer A's address is intact
        Address addrAReloaded = addressRepository.findById(addrA.getId()).orElseThrow();
        assertThat(addrAReloaded.getLine()).isEqualTo("Line A");
        assertThat(addrAReloaded.isDefault()).isTrue();
    }

    @Test
    void unauthenticatedRequests_return401() throws Exception {
        AddressRequest updateReq = new AddressRequest(
                "Tehran", "Tehran", "Line", "1111111111", "Name", "09121110000", false);

        mvc.perform(put("/api/shop/customer/addresses/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isUnauthorized());

        mvc.perform(delete("/api/shop/customer/addresses/999"))
                .andExpect(status().isUnauthorized());

        mvc.perform(put("/api/shop/customer/addresses/999/default"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addressNotFound_returns404() throws Exception {
        Customer customer = customerRepository.save(Customer.builder().mobile("09121110008").build());

        AddressRequest updateReq = new AddressRequest(
                "Tehran", "Tehran", "Line", "1111111111", "Name", "09121110000", false);

        mvc.perform(put("/api/shop/customer/addresses/999999")
                        .cookie(createAuthCookie(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/shop/customer/addresses/999999")
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isNotFound());

        mvc.perform(put("/api/shop/customer/addresses/999999/default")
                        .cookie(createAuthCookie(customer)))
                .andExpect(status().isNotFound());
    }
}
