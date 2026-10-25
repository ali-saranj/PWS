package ir.pws.store.common.security;

/** SpEL expressions for {@code @PreAuthorize}. */
public final class Roles {

    public static final String CATALOG = "hasAnyRole('OWNER','PRODUCT_MANAGER')";
    public static final String OWNER = "hasRole('OWNER')";

    private Roles() {}
}
