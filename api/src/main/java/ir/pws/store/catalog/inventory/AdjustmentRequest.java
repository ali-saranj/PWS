package ir.pws.store.catalog.inventory;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.util.List;

/** Batch of stock adjustments; an empty or missing list is rejected by the service as {@code adjustments/REQUIRED}. */
public record AdjustmentRequest(List<@NotNull @Valid Item> adjustments) {

    public record Item(
            @NotNull @JsonDeserialize(using = StrictLong.class) Long variantId,
            @NotNull @JsonDeserialize(using = StrictInt.class) Integer delta,
            @Size(max = 500) String note) {}

    /**
     * Accepts JSON numbers only. Jackson would otherwise coerce the string "۵" (Persian digit) through
     * {@code Integer.parseInt}, which accepts any Unicode digit; the contract is that the UI converts digits first.
     */
    static class StrictInt extends StdDeserializer<Integer> {

        StrictInt() {
            super(Integer.class);
        }

        @Override
        public Integer deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            if (p.currentToken() != JsonToken.VALUE_NUMBER_INT) {
                return (Integer) ctxt.handleUnexpectedToken(Integer.class, p);
            }
            return p.getIntValue();
        }
    }

    static class StrictLong extends StdDeserializer<Long> {

        StrictLong() {
            super(Long.class);
        }

        @Override
        public Long deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            if (p.currentToken() != JsonToken.VALUE_NUMBER_INT) {
                return (Long) ctxt.handleUnexpectedToken(Long.class, p);
            }
            return p.getLongValue();
        }
    }
}
