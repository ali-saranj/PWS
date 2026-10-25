package ir.pws.store.common.text;

import java.util.regex.Pattern;

public final class Slugs {

    private static final int MAX_LENGTH = 120;
    private static final Pattern SLUG = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

    private Slugs() {
    }

    public static boolean isValid(String slug) {
        return slug != null && slug.length() <= MAX_LENGTH && SLUG.matcher(slug).matches();
    }
}
