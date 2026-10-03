import { defineConfig } from 'eslint/config';
import globals from 'globals';

import base from './base.js';

// Para código com DOM (banner). O app Expo estende eslint-config-expo por cima da base.
export default defineConfig(base, {
  languageOptions: { globals: globals.browser },
});
