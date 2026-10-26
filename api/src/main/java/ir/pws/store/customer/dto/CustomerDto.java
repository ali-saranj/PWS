package ir.pws.store.customer.dto;

import ir.pws.store.customer.Customer;

public record CustomerDto(Long id, String mobile, String firstName, String lastName, String email) {

    public CustomerDto(Long id, String mobile, String firstName, String lastName) {
        this(id, mobile, firstName, lastName, null);
    }

    public static CustomerDto from(Customer c) {
        return new CustomerDto(c.getId(), c.getMobile(), c.getFirstName(), c.getLastName(), c.getEmail());
    }
}
