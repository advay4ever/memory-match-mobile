import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';
import bn from './locales/bn.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import de from './locales/de.json';
import sw from './locales/sw.json';
import ha from './locales/ha.json';
import am from './locales/am.json';
import yo from './locales/yo.json';

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n to react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      zh: { translation: zh },
      hi: { translation: hi },
      ar: { translation: ar },
      bn: { translation: bn },
      pt: { translation: pt },
      ru: { translation: ru },
      ja: { translation: ja },
      de: { translation: de },
      sw: { translation: sw },
      ha: { translation: ha },
      am: { translation: am },
      yo: { translation: yo },
    },
    fallbackLng: 'en', // Default to English if language not supported
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser
      caches: ['localStorage'], // Save user's choice
    },
  });

export default i18n;
