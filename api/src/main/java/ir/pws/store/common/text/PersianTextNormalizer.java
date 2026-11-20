package ir.pws.store.common.text;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

public final class PersianTextNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("[\u064B-\u065F\u0670]");
    private static final Pattern MULTI_WHITESPACE = Pattern.compile("\\s+");

    private PersianTextNormalizer() {}

    /**
     * Normalizes text by standardizing Arabic/Persian letter variants, folding alef forms,
     * stripping diacritics, replacing ZWNJ with space, and converting digits to Latin.
     */
    public static String normalize(String input) {
        if (input == null) {
            return null;
        }
        String text = input.trim().toLowerCase();
        if (text.isEmpty()) {
            return "";
        }

        // 1. Convert Persian/Arabic digits to Latin and percent symbol
        text = Digits.toLatin(text).replace('\u066A', '%');

        // 2. Normalize Arabic Yeh to Persian Yeh:
        // \u064A (Arabic yeh ي), \u0649 (alef maksura ى) -> \u06CC (Persian yeh ی)
        text = text.replace('\u064A', '\u06CC')
                   .replace('\u0649', '\u06CC');

        // 3. Normalize Arabic Kaf to Persian Keheh:
        // \u0643 (Arabic kaf ك) -> \u06A9 (Persian keheh ک)
        text = text.replace('\u0643', '\u06A9');

        // 4. Normalize Alef variants to simple Alef:
        // \u0622 (آ), \u0623 (أ), \u0625 (إ), \u0671 (ٱ) -> \u0627 (ا)
        text = text.replace('\u0622', '\u0627')
                   .replace('\u0623', '\u0627')
                   .replace('\u0625', '\u0627')
                   .replace('\u0671', '\u0627');

        // 5. Normalize Heh with hamza above \u06C0 (ۀ) or ta marbuta \u0629 (ة) -> \u0647 (ه)
        text = text.replace('\u06C0', '\u0647')
                   .replace('\u0629', '\u0647');

        // 6. Strip diacritics / harakat
        text = DIACRITICS.matcher(text).replaceAll("");

        // 7. Normalize ZWNJ \u200C to space
        text = text.replace('\u200C', ' ');

        // 8. Collapse whitespace
        text = MULTI_WHITESPACE.matcher(text).replaceAll(" ").trim();

        return text;
    }

    /**
     * Splits query text into normalized tokens, expanding compound ZWNJ variants.
     */
    public static List<String> tokenize(String input) {
        if (input == null || input.isBlank()) {
            return List.of();
        }

        Set<String> tokenSet = new LinkedHashSet<>();

        // Add normalized single tokens from space-separated view
        String normalized = normalize(input);
        if (normalized != null && !normalized.isBlank()) {
            String[] parts = normalized.split("\\s+");
            for (String part : parts) {
                if (!part.isBlank()) {
                    tokenSet.add(part);
                }
            }
        }

        // Expand ZWNJ compound variants (e.g. "هات‌داگ" -> "هاتداگ")
        if (input.contains("\u200C")) {
            for (String rawPart : input.split("\\s+")) {
                if (rawPart.contains("\u200C")) {
                    String joined = normalize(rawPart.replace("\u200C", ""));
                    if (joined != null && !joined.isBlank()) {
                        tokenSet.add(joined);
                    }
                }
            }
        }

        return new ArrayList<>(tokenSet);
    }
}
