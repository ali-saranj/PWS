package ir.pws.store.common.text;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

public final class HtmlSanitizer {

    private static final Safelist SAFELIST = Safelist.basic().addTags("h2", "h3");

    private HtmlSanitizer() {
    }

    public static String sanitize(String html) {
        if (html == null) {
            return null;
        }
        // Pretty-print stays at jsoup's default (on): block elements are separated by "\n".
        return Jsoup.clean(html, "", SAFELIST, new Document.OutputSettings());
    }
}
