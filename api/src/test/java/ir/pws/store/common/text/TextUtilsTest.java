package ir.pws.store.common.text;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ir.pws.store.common.error.ApiException;
import ir.pws.store.common.error.FieldError;
import org.junit.jupiter.api.Test;

class TextUtilsTest {

    @Test
    void digitsConvertPersianAndArabicIndic() {
        assertThat(Digits.toLatin("۰۹۱۲٣٤٥")).isEqualTo("0912345");
    }

    @Test
    void mobileNormalisesAcceptedFormats() {
        assertThat(MobileNumbers.normalize("۰۹۱۲ ۳۴۵ ۶۷۸۹")).isEqualTo("09123456789");
        assertThat(MobileNumbers.normalize("+989123456789")).isEqualTo("09123456789");
        assertThat(MobileNumbers.normalize("00989123456789")).isEqualTo("09123456789");
        assertThat(MobileNumbers.normalize("989123456789")).isEqualTo("09123456789");
        assertThat(MobileNumbers.normalize("9123456789")).isEqualTo("09123456789");
        assertThat(MobileNumbers.normalize("0912-345 (6789)")).isEqualTo("09123456789");
    }

    @Test
    void mobileRejectsInvalid() {
        assertThatThrownBy(() -> MobileNumbers.normalize("0812345678")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> MobileNumbers.normalize("0912345678")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> MobileNumbers.normalize(null))
                .isInstanceOfSatisfying(ApiException.class, e ->
                        assertThat(e.errors()).containsExactly(new FieldError("mobile", "MOBILE_INVALID")));
    }

    @Test
    void mobileMask() {
        assertThat(MobileNumbers.mask("09123456789")).isEqualTo("0912***6789");
    }

    @Test
    void slugValidation() {
        assertThat(Slugs.isValid("whey-isolate-2kg")).isTrue();
        assertThat(Slugs.isValid("Whey")).isFalse();
        assertThat(Slugs.isValid("a--b")).isFalse();
        assertThat(Slugs.isValid("-a")).isFalse();
        assertThat(Slugs.isValid(null)).isFalse();
        assertThat(Slugs.isValid("a".repeat(120))).isTrue();
        assertThat(Slugs.isValid("a".repeat(121))).isFalse();
    }

    @Test
    void htmlSanitizerStripsUnsafeAndKeepsAllowed() {
        assertThat(HtmlSanitizer.sanitize("<h2>T</h2><p onclick=x>a<script>b</script></p>"))
                .isEqualTo("<h2>T</h2>\n<p>a</p>");
        assertThat(HtmlSanitizer.sanitize(null)).isNull();
    }
}
