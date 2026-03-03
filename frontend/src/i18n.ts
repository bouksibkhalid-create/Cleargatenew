import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../messages/en.json';
import fr from '../messages/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'fr',
    lng: 'fr',
    supportedLngs: ['fr', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'CLEARGATE_LOCALE',
      caches: ['localStorage'],
    },
  });

// Keep <html lang> in sync
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// Set initial <html lang>
document.documentElement.lang = i18n.language;

export default i18n;
