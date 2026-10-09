import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// Regras que não dependem do plugin do typescript-eslint. Usadas pela base e pelo app Expo
// (o eslint-config-expo traz a própria instância do typescript-eslint, e duas instâncias conflitam).
export default defineConfig(
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/.turbo/**', '**/node_modules/**'],
  },
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-console': 'error',
    },
  },
  prettier,
);
