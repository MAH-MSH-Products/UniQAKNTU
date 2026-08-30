import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationFA from './locales/fa/translation.json';

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
    fallbackLng: 'fa', // تغییر به فارسی
    lng: localStorage.getItem('i18nextLng') || 'fa', // اجبار به فارسی در لود اولیه
    debug: false,
    interpolation: {
      escapeValue: false 
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;