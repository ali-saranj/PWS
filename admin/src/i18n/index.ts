import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from '../lib/format'
import en from './en.json'
import fa from './fa.json'

export const LOCALE_KEY = 'pws.admin.locale'

function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(LOCALE_KEY)
    if (v === 'fa' || v === 'en') return v
  } catch {
    // storage unavailable: fall through to the default
  }
  return 'fa'
}

export function setLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // storage unavailable: the choice just won't persist
  }
  void i18n.changeLanguage(locale)
}

void i18n.use(initReactI18next).init({
  resources: { fa: { translation: fa }, en: { translation: en } },
  lng: readStoredLocale(),
  fallbackLng: 'fa',
  interpolation: { escapeValue: false },
})

export default i18n
