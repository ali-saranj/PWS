package ir.pws.store.common.text;

public final class Digits {

    private Digits() {
    }

    /** Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII digits. */
    public static String toLatin(String input) {
        if (input == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder(input.length());
        for (char c : input.toCharArray()) {
            if (c >= '۰' && c <= '۹') {
                sb.append((char) ('0' + (c - '۰')));
            } else if (c >= '٠' && c <= '٩') {
                sb.append((char) ('0' + (c - '٠')));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
