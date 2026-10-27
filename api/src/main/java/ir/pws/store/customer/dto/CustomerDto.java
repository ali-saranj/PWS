package ir.pws.store.customer.dto;

import ir.pws.store.customer.Customer;

public record CustomerDto(Long id, String mobile, String firstName, String lastName, String email, String token) {

    public CustomerDto(Long id, String mobile, String firstName, String lastName) {
        this(id, mobile, firstName, lastName, null, null);
    }

    public CustomerDto(Long id, String mobile, String firstName, String lastName, String email) {
        this(id, mobile, firstName, lastName, email, null);
    }

    public static CustomerDto from(Customer c) {
        return new CustomerDto(c.getId(), c.getMobile(), c.getFirstName(), c.getLastName(), c.getEmail(), null);
    }

    public static CustomerDto from(Customer c, String token) {
        return new CustomerDto(c.getId(), c.getMobile(), c.getFirstName(), c.getLastName(), c.getEmail(), token);
    }
}
