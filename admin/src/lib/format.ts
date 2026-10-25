export type Locale = 'fa' | 'en'

const BIDI_MARKS = /[‎‏؜]/g
const GROUP_SEPARATORS = /[,٬\s]/g

/** Converts Persian (U+06F0..) and Arabic-Indic (U+0660..) digits to Latin digits. */
export function toLatinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
}

/** Parses an integer typed in either digit set, tolerating thousands separators. Null when empty or invalid. */
export function parseLocalizedInt(s: string): number | null {
  const cleaned = toLatinDigits(s).replace(GROUP_SEPARATORS, '')
  if (!/^-?\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isSafeInteger(n) ? n : null
}

/** Like parseLocalizedInt but also accepts a leading + or - (ASCII or U+2212 minus). Null when empty or invalid. */
export function parseLocalizedSignedInt(s: string): number | null {
  const cleaned = toLatinDigits(s).replace(GROUP_SEPARATORS, '').replace(/^−/, '-')
  if (!/^[+-]?\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isSafeInteger(n) ? n + 0 : null
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Shows digits of `s` in Persian for fa, Latin otherwise. */
export function localizeDigits(s: string, locale: string): string {
  const latin = toLatinDigits(s)
  return locale === 'fa' ? latin.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]) : latin
}

const numberFormats: Record<Locale, Intl.NumberFormat> = {
  fa: new Intl.NumberFormat('fa-IR'),
  en: new Intl.NumberFormat('en-US'),
}

export function formatNumber(n: number, locale: Locale): string {
  return numberFormats[locale].format(n)
}

export function rialsToToman(rials: number): number {
  return rials / 10
}

export function tomanToRials(toman: number): number {
  return toman * 10
}

export function formatToman(rials: number, locale: Locale): string {
  const amount = formatNumber(rialsToToman(rials), locale)
  return locale === 'fa' ? `${amount} تومان` : `${amount} Toman`
}

const dateFormats: Record<Locale, Intl.DateTimeFormat> = {
  fa: new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Tehran',
  }),
}

export function formatDate(iso: string, locale: Locale): string {
  return dateFormats[locale].format(new Date(iso)).replace(BIDI_MARKS, '')
}

const dateTimeFormats: Record<Locale, Intl.DateTimeFormat> = {
  fa: new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
  en: new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
}

/** Date plus time in Tehran time (Jalali for fa). */
export function formatDateTime(iso: string, locale: Locale): string {
  return dateTimeFormats[locale].format(new Date(iso)).replace(BIDI_MARKS, '')
}
