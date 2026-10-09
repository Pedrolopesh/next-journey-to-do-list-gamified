// Copia o index.html único do banner para dentro do app, que o carrega no WebView.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const from = new URL('../dist/index.html', `file://${root}/`);
const to = new URL('../../mobile/assets/banner/banner.html', `file://${root}/`);

mkdirSync(dirname(fileURLToPath(to)), { recursive: true });
copyFileSync(from, to);
console.log(`banner copiado para ${fileURLToPath(to).split('/apps/')[1] ?? fileURLToPath(to)}`);
