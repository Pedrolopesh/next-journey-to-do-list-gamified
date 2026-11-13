// Exports the LPC credits and the sample colors from the banner catalog (lab/catalog.json) to the app.
// Usage: node scripts/export-credits.mjs   (run it again whenever the catalog changes)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'lab', 'catalog.json'), 'utf8'));

/** Permissive licenses accepted (the Credits screen and the app test check the same list). */
const credits = catalog.credits.map((credit) => ({
  asset: credit.file.replace(/^.*\/(?=[^/]+\/[^/]+$)/, ''),
  author: credit.authors.join(', '),
  license: credit.licenseUsed,
  url: credit.urls[0] ?? null,
}));

const out = join(root, '..', 'mobile', 'src', 'features', 'credits', 'lpc-credits.json');
writeFileSync(out, `${JSON.stringify(credits, null, 2)}\n`);
console.log(`${credits.length} créditos LPC exportados para apps/mobile/src/features/credits`);

// Sample colors (middle tone of each palette) for the color choice dots in the app
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
