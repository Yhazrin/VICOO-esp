import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const getInitialLanguage = () => {
  try {
    const stored = localStorage.getItem('vicoo-ui-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.currentLocale) {
        return parsed.state.currentLocale;
      }
    }
  } catch {
    // localStorage not available
  }
  return 'en';
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    // Only load current language + fallback on init
    preload: [getInitialLanguage(), 'en'],
  });

export default i18n;
