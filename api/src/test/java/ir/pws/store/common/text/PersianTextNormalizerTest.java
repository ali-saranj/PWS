package ir.pws.store.common.text;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PersianTextNormalizerTest {

    @Test
    @DisplayName("Folds Arabic Kaf and Yeh to standard Persian")
    void foldsArabicKafAndYeh() {
        // Arabic kaf \u0643 -> Persian \u06A9, Arabic yeh \u064A / alef maksura \u0649 -> Persian \u06CC
        assertThat(PersianTextNormalizer.normalize("كالباس")).isEqualTo("کالباس");
        assertThat(PersianTextNormalizer.normalize("پروتئيني")).isEqualTo("پروتئینی");
        assertThat(PersianTextNormalizer.normalize("موسي")).isEqualTo("موسی");
    }

    @Test
    @DisplayName("Folds Alef variants (آ, أ, إ) to simple Alef (ا)")
    void foldsAlefVariants() {
        assertThat(PersianTextNormalizer.normalize("آندره")).isEqualTo("اندره");
        assertThat(PersianTextNormalizer.normalize("أحمد")).isEqualTo("احمد");
        assertThat(PersianTextNormalizer.normalize("إسلامی")).isEqualTo("اسلامی");
    }

    @Test
    @DisplayName("Strips Arabic and Persian diacritics (harakat)")
    void stripsDiacritics() {
        // َ (fatha), ِ (kasra), ُ (damma), ً (tanwin fatha), ّ (tashdid), ْ (sukun)
        assertThat(PersianTextNormalizer.normalize("سوسیسِ مَخصوصّ")).isEqualTo("سوسیس مخصوص");
    }

    @Test
    @DisplayName("Converts Persian and Arabic digits to Latin numbers")
    void convertsDigits() {
        assertThat(PersianTextNormalizer.normalize("ژامبون ۹۰٪")).isEqualTo("ژامبون 90%");
        assertThat(PersianTextNormalizer.normalize("SKU-۱۲۳-٤٥٦")).isEqualTo("sku-123-456");
    }

    @Test
    @DisplayName("Normalizes ZWNJ (half-space) variants in single string")
    void normalizesZwnjInString() {
        // \u200C is zero-width non-joiner
        String withZwnj = "هات\u200Cداگ";
        assertThat(PersianTextNormalizer.normalize(withZwnj)).isEqualTo("هات داگ");
    }

    @Test
    @DisplayName("Handles null and empty strings gracefully")
    void handlesNullAndBlank() {
        assertThat(PersianTextNormalizer.normalize(null)).isNull();
        assertThat(PersianTextNormalizer.normalize("   ")).isEmpty();
    }

    @Test
    @DisplayName("Tokenizes query and expands ZWNJ compound variants")
    void tokenizesAndExpandsVariants() {
        List<String> tokens = PersianTextNormalizer.tokenize("سوسیس هات\u200Cداگ ۹۰ درصد");
        assertThat(tokens).contains("سوسیس", "هات", "داگ", "هاتداگ", "90", "درصد");
    }
}
