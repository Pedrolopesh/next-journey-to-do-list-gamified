import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/progression/domain/**/*.ts'],
      exclude: ['**/*.spec.ts'],
      // Spec target: 80% coverage on the business rules (domain/)
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
