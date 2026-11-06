import { defineConfig } from 'vitest/config';

// Pure logic in Node only (HTTP client, screen rules). Components run with jest-expo (Phase 5).
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
