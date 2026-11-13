// Inventory of the scenery art (terrain, trees, buildings, furniture, small items, effects) for the
// lab pages under "Cenários e mapas". It reads the credit files of the sources, resolves the license
// of each piece and copies only the pieces that can be used without copyleft.
//
// Usage:
//   LPC_REVISED=/path/ElizaWy-LPC LPC_BASE=/path/LiberatedPixelCup node scripts/inventario-cenarios.mjs
// Generates lab/inventario-cenarios.json, lab/cenarios/*.png and lab/CREDITS-CENARIOS.md.
// Lab data only: none of this goes into the banner or the app bundle.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const revised = process.env.LPC_REVISED;
const base = process.env.LPC_BASE;
if (!revised || !existsSync(join(revised, 'Terrain'))) {
  console.error(
    'Set LPC_REVISED to the folder of the ElizaWy/LPC repository (Terrain, Structure, Objects, FX)',
  );
  process.exit(1);
}
if (!base || !existsSync(join(base, 'tileset', 'original', 'Sharm'))) {
  console.error('Set LPC_BASE to the folder of the OpenGameArt/LiberatedPixelCup repository');
  process.exit(1);
}

const OUT_DIR = join(root, 'lab', 'cenarios');
const OUT_JSON = join(root, 'lab', 'inventario-cenarios.json');
const OUT_CREDITS = join(root, 'lab', 'CREDITS-CENARIOS.md');

/** Same rule as the character importer: only CC0, OGA-BY and CC-BY; ShareAlike and GPL stay out. */
const FREE = /\b(CC0|OGA-?BY|CC-?BY)\b/i;
const COPYLEFT = /\b(SA|ShareAlike|GPL)\b/i;
const isFree = (license) => FREE.test(license) && !COPYLEFT.test(license.replace(/OGA-?BY/gi, ''));

const norm = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Reads a Credits.txt: blocks of "Name / ------- / ARTIST(S) / SOURCE / LICENSE / DETAILS". */
function parseCredits(file) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const entries = [];
  let current;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^-{5,}\s*$/.test(line) && i > 0 && (lines[i - 1] ?? '').trim()) {
      current = { name: (lines[i - 1] ?? '').trim(), authors: [], sources: [], license: '' };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const field = /^\s*(ARTIST\(S\)|SOURCE|LICENSE)\s*:\s*(.*)$/i.exec(line);
    if (!field) continue;
    const value = (field[2] ?? '').trim();
    if (/^ARTIST/i.test(field[1] ?? '')) {
      current.authors.push(
        ...value
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
      );
    } else if (/^SOURCE/i.test(field[1] ?? '')) {
      if (value) current.sources.push(value);
    } else current.license = value;
  }
  return entries;
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

/** Width and height read from the PNG header (no dependency). */
function pngSize(file) {
  const head = readFileSync(file).subarray(16, 24);
  return { width: head.readUInt32BE(0), height: head.readUInt32BE(4) };
}

/** Credit entries visible from a folder: its own Credits.txt first, then those of the parents. */
function creditsFor(file, stop) {
  const chain = [];
  for (let dir = dirname(file); dir.length >= stop.length; dir = dirname(dir)) {
    const credits = join(dir, 'Credits.txt');
    if (existsSync(credits)) chain.push(parseCredits(credits));
  }
  return chain.flat();
}

/**
 * File name -> name of its credit entry, where the credit file uses another spelling (plural, "(all)",
 * a typo in the file name). Explicit on purpose: a piece without a clear entry stays blocked.
 */
const ALIASES = {
  '12 Panel Door A': '12-Panel Door, 15-Panel Door',
  '12 Panel Door B': '12-Panel Door, 15-Panel Door',
  '15 Panel Door A': '12-Panel Door, 15-Panel Door',
  'Barred Prison Door A': 'Prison Door',
  'Beds, Child': "Children's Beds",
  'Beds, Child Headboards': "Children's Headboards",
  'Beds, Child Mattresses': "Children's Mattresses",
  'Beds, Double': 'Double Beds',
  'Beds, Double B': 'Double Beds',
  'Beds, Double C': 'Double Beds',
  'Beds, Double C - Overlays': 'Double Beds',
  'Beds, Double Headboards': 'Double Headboards',
  'Beds, Double Mattresses': 'Double Mattresses',
  'Beds, Single  A': 'Single Beds A',
  'Beds, Single Headboards': 'Single Headboards',
  'Beds, Single Mattresses': 'Single Mattresses',
  'Beds, Single B': 'Single Beds B',
  'Loveseat, Small - Casual Patterned A': 'Loveseat, Casual (all)',
  'Loveseat, Small - Casual Patterned B': 'Loveseat, Casual (all)',
  'Loveseat, Small - Casual Patterned C': 'Loveseat, Casual (all)',
  'Loveseat, Small - Casual Patterned D': 'Loveseat, Casual (all)',
  'Loveseat, Small - Casual Solid A': 'Loveseat, Casual (all)',
  'Loveseat, Small - Casual Solid B': 'Loveseat, Casual (all)',
  'Loveseat, Small - Casual Solid C': 'Loveseat, Casual (all)',
  'Loveseat, Small - Formal A': 'Loveseat, Formal (all)',
  'Sofa, Casual A': 'Sofa Set, Casual',
  'TV, Widescreen - No Service': 'Tv, Widescreen; Tv, Widescreen - No Service display',
  'Table, Card': 'Tables, Card',
  'Table, Ornate Wood': 'Tables, Ornate Wood',
  'Table, Rough Wood': 'Tables, Rough Wood',
  'Table, Workshop': 'Tables, Workshop',
  'Fabril Rolls, Mounted': 'Fabric Rolls, Mounted',
  'Tabletop Portraits': 'Tabletop Pictures',
  'Graffiti Elements': 'Graffiti & Graffiti Elements',
};
for (const metal of ['Coal', 'Copper', 'Gold', 'Iron', 'Silver', 'Stone', 'Tin']) {
  ALIASES[`Ore, ${metal}`] = 'Alloys & Ores';
}

/** Finds the credit entry of a file: by file name, then by a name that covers it (folder or family). */
function findEntry(file, entries, rootDir) {
  const stem = norm(basename(file, '.png'));
  const folders = relative(rootDir, dirname(file)).split('/').map(norm);
  const alias = ALIASES[basename(file, '.png')];
  if (alias) {
    const aliased = entries.find((e) => norm(e.name) === norm(alias));
    if (aliased) return aliased;
  }
  const exact = entries.find((e) => norm(e.name) === stem);
  if (exact) return exact;
  const byFolder = entries.find((e) => folders.includes(norm(e.name)));
  if (byFolder) return byFolder;
  // "cliff_autumn" is covered by "Cliff (all seasons)": the entry name, without the note, starts the file name
  const family = entries.find((e) => {
    const name = norm(e.name.replace(/\(.*?\)/g, ''));
    return name.length >= 4 && (stem.startsWith(name) || name.startsWith(stem));
  });
  return family;
}

const CATEGORY = {
  Terrain: 'terreno',
  FX: 'efeitos',
  Objects: 'objetos',
  Structure: 'construcoes',
};

const items = [];
const blocked = [];

// Source 1: LPC Revised (ElizaWy), OGA-BY 3.0
for (const top of ['Terrain', 'Structure', 'Objects', 'FX']) {
  const dir = join(revised, top);
  for (const file of walk(dir)
    .filter((f) => f.endsWith('.png'))
    .sort()) {
    const rel = relative(revised, file);
    const parts = rel.split('/');
    const entry = findEntry(file, creditsFor(file, revised), revised);
    const name = basename(file, '.png');
    const group = parts.length > 2 ? parts.slice(1, -1).join(' / ') : '';
    const record = {
      id: `rev-${slug(rel.replace(/\.png$/, ''))}`,
      source: 'LPC Revised',
      category: CATEGORY[top],
      top,
      group: group || top,
      name,
      path: rel,
      license: entry?.license || '',
      authors: entry?.authors ?? [],
      urls: entry?.sources ?? [],
    };
    if (!entry || !isFree(record.license)) {
      blocked.push({
        ...record,
        reason: entry ? 'license does not allow use without copyleft' : 'no credit entry found',
      });
      continue;
    }
    items.push({ ...record, file: file });
  }
}

// Source 2: Liberated Pixel Cup base tileset by Sharm. She also releases it under CC-BY 3.0 and OGA-BY 3.0
// (package page), the same choice the project already made for the scene tiles.
const SHARM_URL =
  'https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles';
const sharmDir = join(base, 'tileset', 'original', 'Sharm');
const SHARM_GROUP = {
  'building-exterior': ['construcoes', 'Casas (LPC original)'],
  'building-interior': ['construcoes', 'Interiores (LPC original)'],
  lava: ['terreno', 'Lava (LPC original)'],
  misc: ['efeitos', 'Sombras (LPC original)'],
  object: ['objetos', 'Objetos (LPC original)'],
  outdoor: ['terreno', 'Terreno externo (LPC original)'],
  'sewer-dungeon': ['construcoes', 'Masmorra e esgoto (LPC original)'],
};
for (const file of walk(sharmDir)
  .filter((f) => f.endsWith('.png'))
  .sort()) {
  const rel = relative(sharmDir, file);
  const folder = rel.split('/')[0] ?? '';
  const [category, group] = SHARM_GROUP[folder] ?? ['terreno', folder];
  items.push({
    id: `base-${slug(rel.replace(/\.png$/, ''))}`,
    source: 'LPC original (Sharm)',
    category,
    top: folder,
    group,
    name: basename(file, '.png'),
    path: `tileset/original/Sharm/${rel}`,
    license: 'CC-BY 3.0',
    authors: ['Lanea Zimmerman (Sharm)'],
    urls: [SHARM_URL],
    file,
  });
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
const inventory = items.map(({ file, ...item }) => {
  copyFileSync(file, join(OUT_DIR, `${item.id}.png`));
  return { ...item, ...pngSize(file), free: true, thumb: `${item.id}.png` };
});
const out = [
  ...inventory,
  ...blocked.map((item) => ({
    ...item,
    ...pngSize(join(revised, item.path)),
    free: false,
    thumb: null,
  })),
];
writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 1)}\n`);

// Credits: one row per piece, required by OGA-BY and CC-BY
const row = (item) =>
  `| \`${item.path}\` | ${item.authors.join(', ')} | **${item.license}** | ${item.urls.join(' ')} |`;
writeFileSync(
  OUT_CREDITS,
  `# Credits for the scenery art used in the lab

Generated by \`scripts/inventario-cenarios.mjs\`. **Do not edit by hand.** All the art below is third-party and was
included only because it offers a license that allows use without copyleft (CC0, OGA-BY 3.0 or CC-BY). OGA-BY and CC-BY
require **crediting the authors**. The art is lab-only today; if any piece enters the app, add it to the
app's "Créditos" screen first.

Sources: [LPC Revised](https://github.com/ElizaWy/LPC) and
[Liberated Pixel Cup](https://github.com/OpenGameArt/LiberatedPixelCup) (tileset by Lanea Zimmerman).

| Art | Authors | License used | Source |
| --- | --- | --- | --- |
${inventory.map(row).join('\n')}
`,
);

const count = (list, key) =>
  list.reduce((acc, i) => ({ ...acc, [i[key]]: (acc[i[key]] ?? 0) + 1 }), {});
console.log(`${inventory.length} pieces kept, ${blocked.length} blocked`);
console.log('by category:', count(inventory, 'category'));
for (const item of blocked)
  console.log(`BLOCKED ${item.path}: ${item.reason} (${item.license || 'no license'})`);
