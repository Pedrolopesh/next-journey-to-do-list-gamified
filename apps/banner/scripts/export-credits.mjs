// Exporta do catálogo do banner (lab/catalog.json) os créditos LPC e as cores de exemplo para o app.
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

// Cores de exemplo (tom médio de cada paleta) para as bolinhas de escolha de cor do app
const swatches = Object.fromEntries(
  Object.entries(catalog.palettes).map(([material, palette]) => [
    material,
    Object.fromEntries(
      Object.entries(palette.colors).map(([name, tones]) => [name, tones[3] ?? tones[0]]),
    ),
  ]),
);
const swatchOut = join(root, '..', 'mobile', 'src', 'features', 'qg', 'palettes.json');
writeFileSync(swatchOut, `${JSON.stringify(swatches, null, 2)}\n`);
console.log('paletas de exemplo exportadas para apps/mobile/src/features/qg');
