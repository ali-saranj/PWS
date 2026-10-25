package ir.pws.store.catalog.variant;

import static org.assertj.core.api.Assertions.assertThat;

import ir.pws.store.common.error.FieldError;
import java.util.List;
import org.junit.jupiter.api.Test;

class TierPricingTest {

    private final long base = 2_000_000;
    private final List<TierDto> tiers = List.of(new TierDto(10, 1_850_000), new TierDto(50, 1_700_000));

    @Test
    void unitPrice_picksLargestQualifyingTier() {
        assertThat(TierPricing.unitPrice(base, tiers, 1)).isEqualTo(2_000_000);
        assertThat(TierPricing.unitPrice(base, tiers, 9)).isEqualTo(2_000_000);
        assertThat(TierPricing.unitPrice(base, tiers, 10)).isEqualTo(1_850_000);
        assertThat(TierPricing.unitPrice(base, tiers, 49)).isEqualTo(1_850_000);
        assertThat(TierPricing.unitPrice(base, tiers, 500)).isEqualTo(1_700_000);
        assertThat(TierPricing.unitPrice(base, List.of(new TierDto(50, 1_700_000), new TierDto(10, 1_850_000)), 20))
                .isEqualTo(1_850_000);
    }

    @Test
    void validate_acceptsValidTiers() {
        assertThat(TierPricing.validate(base, tiers)).isEmpty();
        assertThat(TierPricing.validate(base, List.of())).isEmpty();
    }

    @Test
    void validate_rejectsBadTiers() {
        assertThat(TierPricing.validate(base, List.of(new TierDto(1, 1_900_000)))).extracting(FieldError::code)
                .containsExactly("TIER_INVALID");
        assertThat(TierPricing.validate(base, List.of(new TierDto(10, 2_000_000)))).isNotEmpty();
        assertThat(TierPricing.validate(base, List.of(new TierDto(10, 1_800_000), new TierDto(50, 1_850_000))))
                .isNotEmpty();
        assertThat(TierPricing.validate(base, List.of(new TierDto(10, 1_800_000), new TierDto(10, 1_700_000))))
                .isNotEmpty();
    }

    @Test
    void validate_namesFieldsByRequestIndex() {
        // request order is unsorted: index 0 is the larger quantity
        var errors = TierPricing.validate(base, List.of(new TierDto(50, 1_850_000), new TierDto(10, 1_800_000)));
        assertThat(errors).containsExactly(new FieldError("tiers[0].unitPrice", "TIER_INVALID"));
        assertThat(TierPricing.validate(base, List.of(new TierDto(10, 1_800_000), new TierDto(1, 1_700_000))))
                .containsExactly(new FieldError("tiers[1].minQty", "TIER_INVALID"));
    }
}
