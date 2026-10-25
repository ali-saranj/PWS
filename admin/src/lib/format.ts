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
