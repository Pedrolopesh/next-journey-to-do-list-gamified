import react from '@nextjourney/eslint-config/react';
import { defineConfig } from 'eslint/config';

export default defineConfig(react, {
  // Scripts de build podem usar console
  files: ['scripts/**'],
  rules: { 'no-console': 'off' },
});
