import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zh from './zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

const getInitialLanguage = () => {
  try {
    const stored = localStorage.getItem('tonghua-ui-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.currentLocale) {
        return parsed.state.currentLocale;
      }
    }
  } catch (e) {
    // localStorage not available
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
