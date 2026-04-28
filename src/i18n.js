import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import ptCommon from './locales/pt/common.json';
import esCommon from './locales/es/common.json';

// Check saved language
const savedLang = localStorage.getItem('i18nextLng');
console.log('🔍 i18n - Saved language:', savedLang);

const resources = {
  en: {
    common: enCommon
  },
  pt: {
    common: ptCommon
  },
  es: {
    common: esCommon
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    ns: ['common'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng) => lng.split('-')[0] // Remove region (e.g., 'en-US' -> 'en')
    }
  });

export default i18n;

// Language names for the switcher
export const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];
