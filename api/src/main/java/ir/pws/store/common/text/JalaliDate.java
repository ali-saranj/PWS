package ir.pws.store.common.text;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public final class JalaliDate {

    private static final ZoneId TEHRAN_ZONE = ZoneId.of("Asia/Tehran");

    private final int year;
    private final int month;
    private final int day;

    public JalaliDate(int year, int month, int day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }

    public static JalaliDate from(LocalDate date) {
        int gYear = date.getYear();
        int gMonth = date.getMonthValue();
        int gDay = date.getDayOfMonth();

        int[] gDaysInMonth = {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
        int gy2 = (gMonth > 2) ? (gYear + 1) : gYear;
        int days = 355666 + (365 * gYear) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gDay + gDaysInMonth[gMonth - 1];
        int jy = -1595 + (33 * (days / 12053));
        days %= 12053;
        jy += 4 * (days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += (days - 1) / 365;
            days = (days - 1) % 365;
        }
        int jm;
        int jd;
        if (days < 186) {
            jm = 1 + (days / 31);
            jd = 1 + (days % 31);
        } else {
            jm = 7 + ((days - 186) / 30);
            jd = 1 + ((days - 186) % 30);
        }
        return new JalaliDate(jy, jm, jd);
    }

    public static String formatPersian(Instant instant) {
        if (instant == null) {
            return null;
        }
        ZonedDateTime zdt = instant.atZone(TEHRAN_ZONE);
        JalaliDate jd = from(zdt.toLocalDate());
        String latin = String.format("%04d/%02d/%02d - %02d:%02d",
                jd.year, jd.month, jd.day, zdt.getHour(), zdt.getMinute());
        return Digits.toPersian(latin);
    }

    public int getYear() {
        return year;
    }

    public int getMonth() {
        return month;
    }

    public int getDay() {
        return day;
    }
}
