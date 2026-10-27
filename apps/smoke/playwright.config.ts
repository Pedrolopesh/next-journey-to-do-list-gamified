import { defineConfig } from '@playwright/test';

// Defaults to a local API; point it at a deployed environment with SMOKE_BASE_URL.
const baseURL = process.env['SMOKE_BASE_URL'] ?? 'http://127.0.0.1:3000';

// API-only: no browser projects, so no browser download is needed.
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL },
});
