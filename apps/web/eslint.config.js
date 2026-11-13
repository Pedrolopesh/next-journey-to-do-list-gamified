import react from '@nextjourney/eslint-config/react';
import { defineConfig } from 'eslint/config';

export default defineConfig(react, {
  // Build scripts may use console
  files: ['scripts/**'],
  rules: { 'no-console': 'off' },
});
