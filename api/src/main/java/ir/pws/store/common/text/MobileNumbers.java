package ir.pws.store.common.text;

import ir.pws.store.common.error.ApiException;
import java.util.regex.Pattern;

public final class MobileNumbers {

    private static final Pattern VALID = Pattern.compile("^09\\d{9}$");
    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\-()]");

    private MobileNumbers() {
    }

    /** Returns the number as {@code 09xxxxxxxxx} or throws MOBILE_INVALID. */
    public static String normalize(String input) {
        if (input == null) {
            throw invalid();
        }
        String s = SEPARATORS.matcher(Digits.toLatin(input)).replaceAll("");
        if (s.startsWith("+98")) {
            s = "0" + s.substring(3);
        } else if (s.startsWith("0098")) {
            s = "0" + s.substring(4);
        } else if (s.startsWith("98") && s.length() == 12) {
            s = "0" + s.substring(2);
        } else if (s.startsWith("9") && s.length() == 10) {
            s = "0" + s;
        }
        if (!VALID.matcher(s).matches()) {
            throw invalid();
        }
        return s;
    }

    /** Masks a normalised number as {@code 0912***6789}. */
    public static String mask(String normalized) {
        return normalized.substring(0, 4) + "***" + normalized.substring(7);
    }

    private static ApiException invalid() {
        return ApiException.field("mobile", "MOBILE_INVALID");
    }
}
