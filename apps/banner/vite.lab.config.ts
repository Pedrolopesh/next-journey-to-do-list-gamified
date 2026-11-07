import { readFileSync } from 'node:fs';

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

// Lab-only build (lab.html), to publish as a static review site.
// Does not affect the banner build that goes to the app.
export default defineConfig({
  plugins: [viteSingleFile()],
  define: { __BANNER_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: 'dist-lab',
    emptyOutDir: true,
    rollupOptions: { input: 'lab.html' },
  },
});
