package ir.pws.store.catalog.variant;

import ir.pws.store.common.error.FieldError;
import java.util.ArrayList;
import java.util.List;

/** Volume-tier pricing rules (spec section 3.1). */
public final class TierPricing {

    private static final String CODE = "TIER_INVALID";

    private TierPricing() {}

    /** Unit price of the tier with the largest {@code minQty <= qty}, else {@code basePrice}. Input order is irrelevant. */
    public static long unitPrice(long basePrice, List<TierDto> tiers, int qty) {
        int bestQty = 0;
        long price = basePrice;
        for (TierDto t : tiers) {
            if (t.minQty() <= qty && t.minQty() > bestQty) {
                bestQty = t.minQty();
                price = t.unitPrice();
            }
        }
        return price;
    }

    /**
     * Every {@code minQty >= 2} and unique; every {@code unitPrice} positive, below {@code basePrice} and strictly
     * below every (valid) tier with a smaller {@code minQty}. Field names are indexed in the given (request) order.
     */
    public static List<FieldError> validate(long basePrice, List<TierDto> tiers) {
        List<FieldError> errors = new ArrayList<>();
        for (int i = 0; i < tiers.size(); i++) {
            TierDto t = tiers.get(i);
            boolean qtyBad = t.minQty() < 2;
            for (int k = 0; k < i && !qtyBad; k++) {
                qtyBad = tiers.get(k).minQty().equals(t.minQty());
            }
            if (qtyBad) {
                errors.add(new FieldError("tiers[" + i + "].minQty", CODE));
            }
            boolean priceBad = t.unitPrice() <= 0 || t.unitPrice() >= basePrice;
            for (int k = 0; k < tiers.size() && !priceBad; k++) {
                TierDto other = tiers.get(k);
                priceBad = other.minQty() >= 2 && other.minQty() < t.minQty() && t.unitPrice() >= other.unitPrice();
            }
            if (priceBad) {
                errors.add(new FieldError("tiers[" + i + "].unitPrice", CODE));
            }
        }
        return errors;
    }
}
