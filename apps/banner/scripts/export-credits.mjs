// Exporta os créditos da arte LPC (lab/catalog.json) para a tela Créditos do app.
// Uso: node scripts/export-credits.mjs   (rode de novo sempre que o catálogo mudar)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'lab', 'catalog.json'), 'utf8'));

/** Licenças permissivas aceitas (a tela Créditos e o teste do app conferem a mesma lista). */
const credits = catalog.credits.map((credit) => ({
  asset: credit.file.replace(/^.*\/(?=[^/]+\/[^/]+$)/, ''),
  author: credit.authors.join(', '),
  license: credit.licenseUsed,
  url: credit.urls[0] ?? null,
}));

const out = join(root, '..', 'mobile', 'src', 'features', 'credits', 'lpc-credits.json');
writeFileSync(out, `${JSON.stringify(credits, null, 2)}\n`);
console.log(`${credits.length} créditos LPC exportados para apps/mobile/src/features/credits`);
