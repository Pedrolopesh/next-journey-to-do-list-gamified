// Importa para o laboratório SÓ as camadas LPC com licença permissiva (CC0, OGA-BY, CC-BY).
// Uso: LPC_GENERATOR=/caminho/Universal-LPC-Spritesheet-Character-Generator node scripts/import-lpc.mjs
// Gera lab/assets/lpc/** (PNGs) e lab/catalog.json (camadas, paletas e créditos com a licença usada).
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.env.LPC_GENERATOR;
if (!src || !existsSync(join(src, 'sheet_definitions'))) {
  console.error(
    'Defina LPC_GENERATOR com a pasta do Universal-LPC-Spritesheet-Character-Generator',
  );
  process.exit(1);
}
const outDir = join(root, 'lab', 'assets', 'lpc');

/** Licenças aceitas, da mais livre para a menos (a primeira que a camada oferecer é a usada). */
const ALLOWED = ['CC0', 'OGA-BY 4.0', 'OGA-BY 3.0', 'CC-BY 4.0', 'CC-BY 3.0'];
const ANIMATIONS = { idle: 2, walk: 9, run: 8 };
const BODY_TYPES = ['male', 'female'];

/** O que entra no laboratório (nomes como aparecem no gerador). */
const WANTED = {
  hair: ['Buzzcut', 'Bob', 'Curly short', 'Bangs bun', 'Half up', 'Natural'],
  torso: ['TShirt', 'Longsleeve 2', 'Cardigan', 'Sleeveless 2'],
  legs: ['Pants', 'Shorts', 'Leggings'],
  feet: ['Basic Shoes', 'Revised Boots', 'Sandals'],
};

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.json') ? [path] : [];
  });

const definitions = walk(join(src, 'sheet_definitions'))
  .map((file) => ({ file, def: readJson(file) }))
  .filter(({ def }) => def && typeof def === 'object' && def.credits && def.layer_1);

function pickLicense(licenses) {
  return ALLOWED.find((allowed) => licenses.includes(allowed)) ?? null;
}

/** Retorna os créditos com a licença usada, ou null se alguma parte não for permissiva. */
function resolveCredits(allCredits, bases) {
  // Só valem os créditos dos arquivos realmente usados (ex.: corpo masculino, não o "musculoso")
  const norm = (path) => path.replace(/\/+$/, '');
  const relevant = allCredits.filter((credit) =>
    bases.some(
      (base) =>
        norm(base).startsWith(norm(credit.file)) || norm(credit.file).startsWith(norm(base)),
    ),
  );
  const credits = [];
  for (const credit of relevant.length > 0 ? relevant : allCredits) {
    const used = pickLicense(credit.licenses ?? []);
    if (!used) return null;
    credits.push({
      file: credit.file,
      authors: credit.authors,
      licenseUsed: used,
      licensesOffered: credit.licenses,
      urls: credit.urls,
      notes: credit.notes ?? '',
    });
  }
  return credits.length > 0 ? credits : null;
}

const palettesRoot = join(src, 'palette_definitions');
const palettes = {};
for (const material of ['body', 'hair', 'cloth', 'eye']) {
  const meta = readJson(join(palettesRoot, material, `meta_${material}.json`));
  palettes[material] = {
    base: meta.base,
    colors: readJson(join(palettesRoot, material, `${material}_ulpc.json`)),
  };
}

const parts = [];
const credits = [];
const copied = new Set();

function addPart({ id, slot, name, def, material }) {
  const layers = [];
  for (const key of Object.keys(def).filter((k) => /^layer_\d+$/.test(k))) {
    const layer = def[key];
    const paths = {};
    for (const type of BODY_TYPES) {
      // Rostos usam ${head} no caminho: aqui a cabeça é a humana masculina ou feminina
      const base = layer[type]?.replace('${head}', type);
      if (!base) continue;
      const ok = Object.keys(ANIMATIONS).every((anim) =>
        existsSync(join(src, 'spritesheets', base, `${anim}.png`)),
      );
      if (ok) paths[type] = base;
    }
    if (Object.keys(paths).length > 0) layers.push({ z: layer.zPos, paths });
  }
  if (layers.length === 0) {
    console.warn(`PULADO (sem arquivos idle/walk/run): ${name}`);
    return;
  }
  const resolved = resolveCredits(
    def.credits,
    layers.flatMap((layer) => Object.values(layer.paths)),
  );
  if (!resolved) {
    console.warn(`PULADO (licença restritiva): ${name}`);
    return;
  }
  for (const layer of layers) {
    for (const base of Object.values(layer.paths)) {
      if (copied.has(base)) continue;
      copied.add(base);
      for (const anim of Object.keys(ANIMATIONS)) {
        const to = join(outDir, base, `${anim}.png`);
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(join(src, 'spritesheets', base, `${anim}.png`), to);
      }
    }
  }
  const creditIds = resolved.map((credit) => {
    credits.push(credit);
    return credits.length - 1;
  });
  parts.push({
    id,
    slot,
    name,
    material,
    bodyTypes: [...new Set(layers.flatMap((l) => Object.keys(l.paths)))],
    layers,
    credits: creditIds,
  });
}

// Corpo, cabeça e olhos: sempre presentes (pele recolorível)
const byFile = (suffix) => definitions.find(({ file }) => file.endsWith(suffix));
addPart({
  id: 'body',
  slot: 'body',
  name: 'Corpo',
  def: byFile('/body/body.json').def,
  material: 'body',
});
addPart({
  id: 'head-male',
  slot: 'head',
  name: 'Cabeça (masc.)',
  def: byFile('heads_human_male.json').def,
  material: 'body',
});
addPart({
  id: 'head-female',
  slot: 'head',
  name: 'Cabeça (fem.)',
  def: byFile('heads_human_female.json').def,
  material: 'body',
});
addPart({
  id: 'face',
  slot: 'face',
  name: 'Rosto',
  def: byFile('faces/face_neutral.json').def,
  material: 'body',
});

for (const [slot, names] of Object.entries(WANTED)) {
  for (const name of names) {
    const found = definitions.find(
      ({ file, def }) =>
        file.includes(`/${slot === 'torso' ? 'torso' : slot}/`) && def.name === name,
    );
    if (!found) {
      console.warn(`NÃO ACHEI: ${slot} / ${name}`);
      continue;
    }
    const material = found.def.recolors?.material ?? null;
    addPart({
      id: `${slot}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      slot,
      name,
      def: found.def,
      material,
    });
  }
}

// Cenário da cabana: tiles de Lanea Zimmerman (Sharm), disponíveis em OGA-BY 3.0
const scenery = [];
const base = process.env.LPC_BASE;
if (base && existsSync(join(base, 'tileset'))) {
  const sceneDir = join(root, 'lab', 'assets', 'scene');
  mkdirSync(sceneDir, { recursive: true });
  const tiles = {
    inside: 'building-interior/inside.png',
    country: 'building-interior/country.png',
    cabinets: 'building-interior/cabinets.png',
    kitchen: 'building-interior/kitchen.png',
    chests: 'object/chests.png',
    // Terreno e vegetação (Sharm) para os cenários externos
    grass: 'outdoor/PNG/grass.png',
    water: 'outdoor/PNG/water.png',
    treetop: 'outdoor/PNG/treetop.png',
    lava: 'lava/lava.png',
    lavarock: 'lava/lavarock.png',
    cement: 'sewer-dungeon/cement.png',
  };
  for (const [name, rel] of Object.entries(tiles)) {
    copyFileSync(join(base, 'tileset', 'original', 'Sharm', rel), join(sceneDir, `${name}.png`));
    scenery.push({ file: `assets/scene/${name}.png`, from: `tileset/original/Sharm/${rel}` });
  }
  credits.push({
    file: 'tileset/original/Sharm (interior, objetos e terreno)',
    authors: ['Lanea Zimmerman (Sharm)'],
    licenseUsed: 'OGA-BY 3.0',
    licensesOffered: ['CC-BY-SA 3.0', 'GPL 3.0', 'OGA-BY 3.0'],
    urls: ['https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles'],
    notes:
      'Cenário da cabana. Os autores Sharm e Redshrike oferecem também OGA-BY 3.0 (página do pacote).',
  });
}

writeFileSync(
  join(root, 'lab', 'catalog.json'),
  `${JSON.stringify({ animations: ANIMATIONS, bodyTypes: BODY_TYPES, palettes, parts, scenery, credits }, null, 1)}\n`,
);
// Lista de créditos legível (exigida por OGA-BY 3.0 e CC-BY): quem fez, de onde veio e a licença usada
const table = credits
  .map(
    (credit) =>
      `| \`${credit.file}\` | ${credit.authors.join(', ')} | **${credit.licenseUsed}** | ${credit.urls.join(' ')} |`,
  )
  .join('\n');
writeFileSync(
  join(root, 'lab', 'CREDITS-LPC.md'),
  `# Créditos da arte LPC usada no laboratório

Gerado por \`scripts/import-lpc.mjs\`. **Não edite à mão.** Toda a arte abaixo é de terceiros e só foi
incluída por oferecer a licença indicada na terceira coluna (CC0, OGA-BY 3.0 ou CC-BY). OGA-BY e CC-BY
exigem **dar crédito aos autores**: esta lista deve aparecer na tela Créditos do app.

Fontes: [Universal LPC Spritesheet Character Generator](https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator)
e [Liberated Pixel Cup](https://github.com/OpenGameArt/LiberatedPixelCup).

| Arte | Autores | Licença usada | Fonte |
| --- | --- | --- | --- |
${table}
`,
);
console.log(
  `ok: ${parts.length} peças, ${copied.size} pastas de camadas, ${credits.length} créditos`,
);
