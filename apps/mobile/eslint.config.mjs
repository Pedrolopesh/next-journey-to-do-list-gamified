import common from '@nextjourney/eslint-config/common';
import { defineConfig } from 'eslint/config';
import expo from 'eslint-config-expo/flat.js';

export default defineConfig(expo, common, {
  ignores: ['dist/**', '.expo/**', 'expo-env.d.ts'],
});
