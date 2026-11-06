import path from 'node:path';

import common from '@nextjourney/eslint-config/common';
import { defineConfig } from 'eslint/config';
import expo from 'eslint-config-expo/flat.js';

export default defineConfig(
  expo,
  common,
  // .maestro/scripts runs in the Maestro engine (its own globals: http, json), not in Node
  { ignores: ['dist/**', '.expo/**', 'expo-env.d.ts', '.maestro/scripts/**'] },
  {
    // O lint-staged roda da raiz do monorepo: o resolver precisa do tsconfig do app por caminho
    // absoluto para entender o alias `@/`.
    settings: {
      'import/resolver': {
        typescript: { project: path.join(import.meta.dirname, 'tsconfig.json') },
      },
    },
  },
);
