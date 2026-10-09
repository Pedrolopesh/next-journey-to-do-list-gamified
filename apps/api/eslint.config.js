import node from '@nextjourney/eslint-config/node';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  node,
  { ignores: ['src/generated/**'] },
  {
    // Nos e2e, `response.body` do supertest é `any` por natureza
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
);
