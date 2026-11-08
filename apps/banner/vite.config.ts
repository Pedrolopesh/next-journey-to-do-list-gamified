import { readFileSync } from 'node:fs';

import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

// Generates a single index.html with JS, CSS and sprites embedded. The app loads it in a WebView.
export default defineConfig({
  plugins: [viteSingleFile()],
  define: { __BANNER_VERSION__: JSON.stringify(pkg.version) },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'jsdom' },
});
