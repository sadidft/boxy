import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import id from './id.json';

export const supportedLocales = ['en', 'id'] as const;
export type Locale = (typeof supportedLocales)[number];

export const resources = { en: { translation: en }, id: { translation: id } } as const;

export function detectLocale(preferred: 'auto' | Locale, languages: readonly string[] = typeof navigator !== 'undefined' ? navigator.languages : ['en']): Locale {
  if (preferred !== 'auto') return preferred;
  for (const lang of languages) {
    const base = lang.toLowerCase().split('-')[0];
    if (base === 'id' || base === 'in') return 'id';
    if (base === 'en') return 'en';
  }
  return 'en';
}

export function initI18n(locale: Locale): typeof i18n {
  if (i18n.isInitialized) {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    return i18n;
  }
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: locale,
      fallbackLng: 'en',
      supportedLngs: [...supportedLocales],
      interpolation: { escapeValue: false },
      detection: { order: [], caches: [] },
      returnNull: false,
      saveMissing: import.meta.env.MODE === 'test',
      missingKeyHandler: (_lngs, _ns, key) => {
        if (import.meta.env.MODE === 'test') throw new Error(`Missing i18n key: ${key}`);
      },
    });
  return i18n;
}

export function setLocale(locale: Locale): void {
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

export default i18n;
