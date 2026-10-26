package ir.pws.store.common.security;

import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * Authentication principal for a customer, carrying their id and mobile.
 */
public record CustomerPrincipal(long customerId, String mobile) implements AuthenticatedPrincipal {

    public long id() {
        return customerId;
    }

    @Override
    public String getName() {
        return mobile;
    }
}
