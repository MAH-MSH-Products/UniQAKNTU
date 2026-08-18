import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationFA from './locales/fa/translation.json';

/**
 * i18n Configuration - Internationalization Setup
 * 
 * Configures i18next with react-i18next integration.
 * Uses browser language detector with fallback to English.
 * Supports English (LTR) and Persian/Farsi (RTL) languages.
 */

const resources = {
  en: {
    translation: translationEN
  },
  fa: {
    translation: translationFA
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
