package ir.pws.store.customer.dto;

import ir.pws.store.customer.Customer;

public record CustomerDto(Long id, String mobile, String firstName, String lastName) {

    public static CustomerDto from(Customer c) {
        return new CustomerDto(c.getId(), c.getMobile(), c.getFirstName(), c.getLastName());
    }
}
