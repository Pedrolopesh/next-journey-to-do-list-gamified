import { readFileSync } from 'node:fs';

import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

// Gera um único index.html com JS, CSS e sprites embutidos. O app o carrega num WebView.
export default defineConfig({
  plugins: [viteSingleFile()],
  define: { __BANNER_VERSION__: JSON.stringify(pkg.version) },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'jsdom' },
});
