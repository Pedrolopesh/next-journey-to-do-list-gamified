import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único index.html com JS, CSS e sprites embutidos. O app o carrega num WebView.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { outDir: 'dist', emptyOutDir: true },
});
