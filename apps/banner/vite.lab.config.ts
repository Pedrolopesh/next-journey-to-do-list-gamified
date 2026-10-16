import { readFileSync } from 'node:fs';

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

// Build só do laboratório (lab.html), para publicar como site estático de revisão.
// Não afeta o build do banner que vai para o app.
export default defineConfig({
  plugins: [viteSingleFile()],
  define: { __BANNER_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: 'dist-lab',
    emptyOutDir: true,
    rollupOptions: { input: 'lab.html' },
  },
});
