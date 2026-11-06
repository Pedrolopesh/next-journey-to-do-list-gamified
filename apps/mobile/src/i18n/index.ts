import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './pt-BR.json';

const i18n = createInstance();

// pt-BR in v1; English comes later, as a new resource in this same object.
void i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR } },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export default i18n;
