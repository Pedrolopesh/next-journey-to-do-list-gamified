import { defineConfig } from '@playwright/test';

const baseURL = process.env['SMOKE_BASE_URL'];
if (!baseURL) {
  throw new Error('Set SMOKE_BASE_URL to the API base URL, for example https://api.example.com');
}

// API-only: no browser projects, so no browser download is needed.
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL },
});
