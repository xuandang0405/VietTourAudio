import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locales
import viTranslation from './locales/vi.json';
import enTranslation from './locales/en.json';
import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';
import zhTranslation from './locales/zh.json';

const resources = {
  vi: { translation: viTranslation },
  en: { translation: enTranslation },
  ja: { translation: jaTranslation },
  ko: { translation: koTranslation },
  zh: { translation: zhTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    debug: true,
    lng: localStorage.getItem('admin_lang') || 'vi',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'admin_lang',
      caches: ['localStorage'],
    },
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

export default i18n;
