// Copia os assets do laboratório (catálogo e sprites) para o build do site de revisão.
import { cpSync } from 'node:fs';

cpSync(new URL('../lab', import.meta.url), new URL('../dist-lab/lab', import.meta.url), {
  recursive: true,
});
console.log('assets do laboratório copiados para dist-lab/lab');
