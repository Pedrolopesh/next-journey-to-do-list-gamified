import './cenarios.css';

import { h } from '../dom';
import type { LabPage } from '../page';
import { type Cell, loadSheets, MapPainter, type Rect, TILE } from './mapas-motor';

/** Ready-made maps built only with the free LPC pieces of the scenery catalog. */

type Season = 'summer' | 'autumn' | 'winter';

const GRASS: Cell[] = [
  [3, 1],
  [4, 1],
  [5, 1],
  [3, 2],
  [4, 2],
  [5, 2],
];
const DIRT: Cell[] = [
  [3, 3],
  [4, 3],
  [5, 3],
  [3, 4],
  [4, 4],
  [5, 4],
];
const SAND: Cell[] = [
  [3, 5],
  [4, 5],
  [5, 5],
];
const WATER: Cell[] = [
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
];
// Blocks of the terrain sheet (origin tile of the 3x3)
const BLOB: Cell = [0, 0]; // grass (or snow) patch with a rough border, over any ground
const LAKE: Cell = [3, 10]; // lake with a grass bank and an empty center
const SAND_LAKE: Cell = [5, 20]; // lake with a sand bank and an empty center

// Trees: sprites of the tree sheets (same layout in all seasons), standing on the trunk base
const ROUND: Rect[] = [
  [128, 14, 96, 96],
  [224, 14, 96, 104],
  [320, 14, 96, 128],
  [416, 112, 96, 126],
];
const ROUND_DARK: Rect[] = [
  [128, 272, 96, 92],
  [224, 272, 96, 98],
  [320, 272, 96, 126],
];
const PINES: Rect[] = [
  [128, 386, 96, 108],
  [224, 386, 96, 108],
  [320, 420, 96, 92],
  [416, 356, 96, 138],
];
const BARE: Rect = [0, 272, 96, 130];

// Plants
const BUSHES: Rect[] = [
  [0, 0, 32, 32],
  [32, 0, 32, 32],
  [64, 0, 32, 32],
  [96, 0, 32, 32],
  [160, 0, 32, 32],
];
const TUFTS: Rect[] = [
  [256, 32, 32, 32],
  [288, 32, 32, 32],
  [320, 32, 32, 32],
];
const TALL_GRASS: Rect[] = [
  [352, 0, 32, 64],
  [384, 0, 32, 64],
  [416, 0, 32, 64],
];
const LILIES: Rect[] = [
  [384, 64, 32, 32],
  [416, 64, 32, 32],
  [384, 96, 32, 32],
];
const REEDS: Rect[] = [
  [448, 64, 32, 32],
  [480, 64, 32, 32],
];

const FLOWER_BUSHES = (columns: number[]): Rect[] =>
  columns.map((c) => [c * 32, 0, 32, 64] as Rect);
const FLOWER_SMALL = (columns: number[]): Rect[] =>
  columns.map((c) => [c * 32, 64, 32, 32] as Rect);

const MUSHROOMS: Rect[] = [
  [106, 0, 12, 21],
  [138, 0, 12, 21],
  [104, 32, 15, 23],
  [103, 61, 19, 29],
  [101, 94, 21, 24],
];
const ROCKS: Rect[] = [
  [130, 2, 59, 55],
  [130, 130, 59, 55],
  [163, 76, 27, 15],
  [170, 107, 15, 9],
];

// Buildings and structures
const BRICK_HOUSE_A: Rect = [24, 0, 208, 201];
const BRICK_HOUSE_B: Rect = [23, 0, 144, 192];
const PANELED_HOUSE: Rect = [0, 0, 160, 160];
const FOUNTAIN: Rect = [0, 0, 64, 82];

// Campfire: one lit frame and the unlit wood
const CAMP: Rect = [0, 34, 32, 30];
const CAMP_OUT: Rect = [0, 2, 32, 30];

const FENCE_H: Rect = [8, 0, 77, 32];

const BARREL_A: Rect = [2, 0, 30, 33];
const BARREL_B: Rect = [34, 0, 30, 33];
const CRATES: Rect[] = [
  [66, 3, 22, 26],
  [66, 67, 22, 26],
];
const HAY: Rect[] = [
  [3, 17, 57, 77],
  [67, 17, 57, 79],
];

// Sheets by name, so the maps only say what they use
const SHEET = {
  rocks: 'rev-terrain-rocks-grasslands',
  mushrooms: 'rev-terrain-mushrooms',
  flowers: 'rev-terrain-flowers',
  tilled: 'rev-terrain-tilled-soil',
  houseA: 'rev-structure-structures-brick-house-a',
  houseB: 'rev-structure-structures-brick-house-b',
  paneled: 'rev-structure-structures-paneled-house-a',
  fountain: 'rev-structure-misc-fountain-a',
  fence: 'rev-structure-fences-plain-fence-a',
  barrel: 'rev-objects-furniture-barrel',
  crate: 'rev-objects-furniture-crate',
  hay: 'rev-objects-small-items-hay-and-straw',
  trough: 'rev-objects-furniture-trough',
  cart: 'rev-objects-moveable-shopping-cart',
  camp: 'rev-objects-small-items-fire-camp',
  woodFloor: 'rev-structure-floor-wood-floor-a',
  woodFloorB: 'rev-structure-floor-wood-floor-b',
  inside: 'base-building-interior-inside',
  country: 'base-building-interior-country',
  kitchen: 'base-building-interior-kitchen',
  table: 'rev-objects-furniture-table-rough-wood',
  shelf: 'rev-objects-furniture-shelf',
  fireplace: 'rev-objects-furniture-fireplace',
  chest: 'rev-objects-furniture-chest',
  diamond: 'rev-structure-floor-diamond-tile-c',
} as const;

const terrain = (s: Season | 'winter-ice'): string => `rev-terrain-terrain-${s}`;
const trees = (s: Season): string => `rev-terrain-trees-${s}`;
const plants = (s: Season): string => `rev-terrain-plants-${s}`;
const wild = (s: Season): string => `rev-terrain-wildflowers-${s}`;

type MapSpec = {
  id: string;
  title: string;
  about: string;
  cols: number;
  rows: number;
  seed: number;
  sheets: string[];
  build: (p: MapPainter) => void;
};

/** A fence line made of the horizontal segment, repeated. */
function fenceLine(p: MapPainter, x: number, y: number, length: number): void {
  for (let i = 0; i < length; i += 2) p.flat(SHEET.fence, FENCE_H, x + i, y);
}

const FOREST: MapSpec = {
  id: 'floresta',
  title: 'Floresta de verão',
  about:
    'Mapa padrão de floresta: caminho de terra no meio, lago com margem de grama e vitórias-régias, mata fechada de árvores, pinheiros, arbustos, flores, cogumelos e pedras.',
  cols: 24,
  rows: 16,
  seed: 11,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    SHEET.flowers,
    SHEET.mushrooms,
    SHEET.rocks,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, DIRT, 0, 8, 24, 5);
    p.block(t, BLOB, -1, -2, 26, 11); // grass above the path
    p.block(t, BLOB, -1, 12, 26, 6); // grass below the path
    p.fill(t, WATER, 15, 1, 7, 5);
    p.block(t, LAKE, 15, 1, 7, 5, false);
    const lake = { x: 15, y: 1, w: 7, h: 5 };
    const path = { x: 0, y: 7.5, w: 24, h: 5 };
    p.stand(plants('summer'), LILIES[0] as Rect, 17.5, 3.4);
    p.stand(plants('summer'), LILIES[1] as Rect, 19.6, 4.3);
    p.stand(plants('summer'), LILIES[2] as Rect, 18.8, 2.4);
    p.stand(plants('summer'), REEDS[0] as Rect, 16.4, 5.5);
    p.stand(plants('summer'), REEDS[1] as Rect, 20.6, 2.2);
    p.scatter(trees('summer'), ROUND, { x: 0, y: 3.5, w: 14, h: 4.5 }, 7, [path, lake], 1.8);
    p.scatter(trees('summer'), ROUND_DARK, { x: 0, y: 2, w: 14.5, h: 5 }, 4, [path, lake], 2);
    p.scatter(trees('summer'), PINES, { x: 0, y: 14, w: 24, h: 2.4 }, 12, [path], 1.5);
    p.scatter(trees('summer'), ROUND, { x: 11, y: 7, w: 13, h: 1 }, 3, [lake], 3);
    p.scatter(plants('summer'), BUSHES, { x: 0, y: 1, w: 24, h: 7 }, 10, [path, lake], 1.4);
    p.scatter(plants('summer'), TUFTS, { x: 0, y: 1, w: 24, h: 7 }, 16, [path, lake], 0.9);
    p.scatter(plants('summer'), TALL_GRASS, { x: 0, y: 13, w: 24, h: 3 }, 8, [path], 1.2);
    p.scatter(
      SHEET.flowers,
      FLOWER_BUSHES([0, 1, 3, 5]),
      { x: 0, y: 1, w: 24, h: 7 },
      8,
      [path, lake],
      1.4,
    );
    p.scatter(
      SHEET.flowers,
      FLOWER_SMALL([1, 3, 5, 8]),
      { x: 0, y: 13, w: 24, h: 3 },
      7,
      [path],
      1.1,
    );
    p.scatter(SHEET.mushrooms, MUSHROOMS, { x: 0, y: 1, w: 14, h: 7 }, 8, [path, lake], 1.1);
    p.scatter(SHEET.rocks, ROCKS.slice(2), { x: 0, y: 8, w: 24, h: 5 }, 6, [], 2.5);
    p.stand(SHEET.rocks, ROCKS[0] as Rect, 12.5, 7.4);
    p.finish();
  },
};

const SNOW: MapSpec = {
  id: 'vila-neve',
  title: 'Vila na neve',
  about:
    'Vila de inverno: chão de neve, lago congelado, duas casas, cercas, barris, fogueira, pinheiros e árvores sem folhas.',
  cols: 24,
  rows: 16,
  seed: 5,
  sheets: [
    terrain('winter'),
    terrain('winter-ice'),
    trees('winter'),
    plants('winter'),
    SHEET.houseB,
    SHEET.paneled,
    SHEET.fence,
    SHEET.barrel,
    SHEET.crate,
    SHEET.camp,
    SHEET.rocks,
    SHEET.fountain,
  ],
  build(p) {
    const t = terrain('winter');
    p.fill(t, GRASS, -1, -1, 26, 18);
    // Frozen lake (ice)
    p.fill(terrain('winter-ice'), WATER, 1, 9, 8, 5);
    p.block(terrain('winter-ice'), LAKE, 1, 9, 8, 5, false);
    // Packed path in front of the houses
    p.fill(t, DIRT, 6, 6, 18, 3);
    p.block(t, BLOB, 5, 0, 20, 7); // snow above the path
    p.block(t, BLOB, 5, 8, 20, 4); // snow below the path
    p.stand(SHEET.houseB, BRICK_HOUSE_B, 9, 6.6);
    p.stand(SHEET.paneled, PANELED_HOUSE, 17, 6.6);
    p.stand(SHEET.fountain, FOUNTAIN, 13.3, 10.2);
    fenceLine(p, 14, 11.3, 8);
    p.stand(SHEET.barrel, BARREL_A, 7, 7.4);
    p.stand(SHEET.barrel, BARREL_B, 7.9, 7.6);
    p.stand(SHEET.crate, CRATES[0] as Rect, 20.6, 7.7);
    p.stand(SHEET.crate, CRATES[1] as Rect, 21.4, 7.9);
    p.stand(SHEET.camp, CAMP, 12.5, 8.4);
    p.scatter(trees('winter'), PINES, { x: 0, y: 1, w: 24, h: 4 }, 11, [], 1.8);
    p.scatter(trees('winter'), PINES, { x: 0, y: 14, w: 24, h: 2.4 }, 11, [], 1.6);
    p.scatter(trees('winter'), [BARE], { x: 14, y: 12, w: 9, h: 3 }, 2, [], 3);
    p.scatter(plants('winter'), BUSHES, { x: 0, y: 3, w: 24, h: 12 }, 7, [], 2);
    p.scatter(plants('winter'), TUFTS, { x: 0, y: 3, w: 24, h: 12 }, 10, [], 1.3);
    p.scatter(SHEET.rocks, ROCKS.slice(2), { x: 10, y: 11, w: 12, h: 4 }, 5, [], 2);
    p.finish();
  },
};

const AUTUMN: MapSpec = {
  id: 'outono',
  title: 'Clareira de outono',
  about:
    'Clareira circular de terra no meio do bosque de outono: fogueira, tronco de lenha, mata de árvores alaranjadas, flores silvestres e cogumelos.',
  cols: 20,
  rows: 14,
  seed: 23,
  sheets: [
    terrain('autumn'),
    trees('autumn'),
    plants('autumn'),
    SHEET.flowers,
    SHEET.mushrooms,
    SHEET.rocks,
    SHEET.camp,
    SHEET.hay,
  ],
  build(p) {
    const t = terrain('autumn');
    p.fill(t, DIRT, 5, 3, 10, 8); // clearing
    p.block(t, BLOB, -1, -2, 22, 6); // grass above
    p.block(t, BLOB, -1, 10, 22, 6); // grass below
    p.block(t, BLOB, -2, 2, 8, 10); // grass on the left
    p.block(t, BLOB, 14, 2, 8, 10); // grass on the right
    const hole = { x: 6, y: 4.5, w: 8, h: 5.5 };
    p.stand(SHEET.camp, CAMP, 10, 7.6);
    p.stand(SHEET.camp, CAMP_OUT, 15.8, 4.6);
    p.stand(SHEET.hay, HAY[0] as Rect, 7.4, 6.6);
    p.stand(SHEET.hay, HAY[1] as Rect, 12.8, 6.8);
    p.scatter(trees('autumn'), ROUND, { x: 0, y: 1.5, w: 20, h: 2.5 }, 8, [hole], 2);
    p.scatter(trees('autumn'), ROUND_DARK, { x: 0, y: 12, w: 20, h: 2 }, 7, [hole], 2);
    p.scatter(trees('autumn'), ROUND, { x: 0, y: 4, w: 4, h: 8 }, 3, [hole], 2.4);
    p.scatter(trees('autumn'), ROUND, { x: 16, y: 4, w: 4, h: 8 }, 3, [hole], 2.4);
    p.scatter(plants('autumn'), BUSHES, { x: 0, y: 3, w: 20, h: 10 }, 8, [hole], 1.4);
    p.scatter(plants('autumn'), TUFTS, { x: 0, y: 3, w: 20, h: 10 }, 12, [hole], 1.1);
    p.scatter(
      SHEET.flowers,
      FLOWER_BUSHES([5, 6, 7]),
      { x: 0, y: 3, w: 20, h: 10 },
      6,
      [hole],
      1.5,
    );
    p.scatter(SHEET.mushrooms, MUSHROOMS, { x: 0, y: 3, w: 20, h: 10 }, 9, [], 1.2);
    p.scatter(SHEET.rocks, ROCKS.slice(2), { x: 5, y: 4, w: 10, h: 6 }, 4, [], 1.6);
    p.finish();
  },
};

const FARM: MapSpec = {
  id: 'fazenda',
  title: 'Fazenda',
  about:
    'Campo de cultivo com três canteiros de terra arada, casa de tijolos, cercas, feno, barris, caixas, carrinho e poço de pedras; árvores nas bordas.',
  cols: 24,
  rows: 16,
  seed: 41,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    wild('summer'),
    SHEET.tilled,
    SHEET.houseA,
    SHEET.fence,
    SHEET.barrel,
    SHEET.crate,
    SHEET.hay,
    SHEET.cart,
    SHEET.flowers,
    SHEET.rocks,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, GRASS, -1, -1, 26, 18);
    p.fill(t, DIRT, 8, 11, 16, 2); // dirt road
    p.block(t, BLOB, 7, 10, 18, 4);
    p.block(t, BLOB, 7, 10, 18, 4);
    p.fill(t, DIRT, 8, 11, 16, 2);
    // Three fields
    const fields = [
      { x: 10, y: 1, w: 6, h: 5 },
      { x: 17, y: 1, w: 6, h: 5 },
      { x: 10, y: 6.5, w: 13, h: 3.5 },
    ];
    for (const f of fields) p.block(SHEET.tilled, BLOB, f.x, f.y, f.w, f.h);
    for (const f of fields) {
      for (let row = 0; row < f.h - 1; row += 1) {
        for (let i = 0; i < f.w - 1; i += 1.2) {
          const crop = TUFTS[(Math.floor(i) + row) % TUFTS.length] as Rect;
          p.stand(plants('summer'), crop, f.x + 0.9 + i, f.y + 1.5 + row);
        }
      }
    }
    p.stand(SHEET.houseA, BRICK_HOUSE_A, 5, 9.6);
    fenceLine(p, 9, 10.35, 14);
    fenceLine(p, 9, 0.35, 14);
    p.stand(SHEET.hay, HAY[0] as Rect, 18.4, 14.2);
    p.stand(SHEET.hay, HAY[1] as Rect, 20.1, 14.4);
    p.stand(SHEET.barrel, BARREL_A, 2.2, 11.8);
    p.stand(SHEET.barrel, BARREL_B, 3, 12);
    p.stand(SHEET.crate, CRATES[0] as Rect, 8.2, 14);
    p.stand(SHEET.crate, CRATES[1] as Rect, 9, 14.2);
    p.stand(SHEET.cart, [1, 0, 30, 63], 13.4, 14.4);
    p.scatter(trees('summer'), ROUND, { x: 0, y: 1, w: 8, h: 5 }, 4, [], 2.4);
    p.scatter(trees('summer'), ROUND_DARK, { x: 0, y: 14, w: 24, h: 2 }, 6, [], 2.5);
    p.scatter(plants('summer'), BUSHES, { x: 0, y: 1, w: 9, h: 14 }, 6, [], 1.6);
    p.scatter(plants('summer'), TALL_GRASS, { x: 0, y: 1, w: 24, h: 15 }, 8, [], 1.5);
    p.scatter(SHEET.flowers, FLOWER_SMALL([0, 1, 5, 6]), { x: 0, y: 11, w: 8, h: 5 }, 7, [], 1.2);
    p.finish();
  },
};

const LAKE_SAND: MapSpec = {
  id: 'praia-ponte',
  title: 'Rio, areia e ponte',
  about:
    'Margem arenosa com um rio atravessado por uma ponte de tábuas, ilhas de grama, vitórias-régias, juncos, pedras e arbustos.',
  cols: 24,
  rows: 14,
  seed: 77,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    SHEET.flowers,
    SHEET.rocks,
    SHEET.woodFloor,
    SHEET.fence,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, SAND, -1, -1, 26, 16);
    // River with a sand bank
    p.fill(t, WATER, -2, 5, 28, 5);
    p.block(t, SAND_LAKE, -2, 5, 28, 5, false);
    // Grass islands over the sand
    p.block(t, BLOB, 1, 10.5, 8, 5);
    p.block(t, BLOB, 15, 10.5, 9, 5);
    p.block(t, BLOB, 2, -1, 9, 5);
    p.block(t, BLOB, 14, -1, 10, 4);
    // Plank bridge
    p.tiled(SHEET.woodFloor, [64, 0, 32, 32], 11, 4.6, 3, 6);
    const planks = [0, 1, 2, 3, 4, 5];
    for (const k of planks) p.tile(SHEET.woodFloor, [2, k % 3], 11, 4.7 + k);
    p.stand(SHEET.fence, [104, 0, 13, 128], 11, 6.4);
    p.stand(SHEET.fence, [104, 0, 13, 128], 14, 6.4);
    p.stand(SHEET.fence, [104, 0, 13, 128], 11, 9.4);
    p.stand(SHEET.fence, [104, 0, 13, 128], 14, 9.4);
    const river = { x: -1, y: 4.7, w: 26, h: 5.5 };
    p.scatter(plants('summer'), LILIES, { x: 0, y: 6, w: 10, h: 3 }, 5, [], 1.5);
    p.scatter(plants('summer'), LILIES, { x: 15, y: 6, w: 9, h: 3 }, 5, [], 1.5);
    p.scatter(plants('summer'), REEDS, { x: 0, y: 5.6, w: 24, h: 1 }, 8, [], 2);
    p.scatter(trees('summer'), ROUND, { x: 2, y: 3, w: 8, h: 1.5 }, 2, [river], 3);
    p.scatter(trees('summer'), PINES, { x: 15, y: 2, w: 8, h: 2 }, 3, [river], 2.5);
    p.scatter(trees('summer'), ROUND_DARK, { x: 3, y: 13, w: 6, h: 1 }, 2, [], 3);
    p.scatter(plants('summer'), BUSHES, { x: 0, y: 0.5, w: 24, h: 3.5 }, 5, [river], 1.6);
    p.scatter(plants('summer'), BUSHES, { x: 0, y: 11, w: 24, h: 2.5 }, 5, [], 1.6);
    p.scatter(
      SHEET.flowers,
      FLOWER_SMALL([0, 1, 2, 3, 4]),
      { x: 0, y: 11, w: 24, h: 3 },
      6,
      [],
      1.3,
    );
    p.scatter(SHEET.rocks, ROCKS.slice(1), { x: 0, y: 10, w: 24, h: 3.5 }, 6, [], 2.4);
    p.finish();
  },
};

const HOUSE: MapSpec = {
  id: 'casa-por-dentro',
  title: 'Casa por dentro',
  about:
    'Sala e quarto de uma casa simples: piso de tábuas, parede com rodapé, cama, mesa com banquinhos, lareira, estante, baú, tapete e cozinha.',
  cols: 16,
  rows: 11,
  seed: 3,
  sheets: [
    SHEET.woodFloor,
    SHEET.inside,
    SHEET.country,
    SHEET.table,
    SHEET.shelf,
    SHEET.fireplace,
    SHEET.chest,
    SHEET.kitchen,
    SHEET.diamond,
    SHEET.barrel,
    SHEET.hay,
  ],
  build(p) {
    p.background('#1b1630');
    p.fill(SHEET.woodFloor, [[2, 0]], 0, 3, 16, 8);
    // Wall: left corner, repeated middle and right corner
    for (let x = 0; x < 16; x++) {
      const col = x === 0 ? 0 : x === 15 ? 2 : 1;
      for (let y = 0; y < 3; y++) p.tile(SHEET.inside, [col, y], x, y);
    }
    p.tiled(SHEET.diamond, [96, 0, 32, 32], 5.5, 6.5, 5, 4); // rug
    p.stand(SHEET.fireplace, [0, 13, 95, 75], 4.1, 3.9);
    p.stand(SHEET.shelf, [109, 8, 35, 88], 8.6, 4);
    p.stand(SHEET.kitchen, [0, 0, 64, 128], 12.2, 4.1);
    p.stand(SHEET.country, [8, 12, 48, 88], 14.1, 6.2);
    p.stand(SHEET.table, [6, 19, 82, 45], 9.2, 8.8);
    p.stand(SHEET.table, [98, 29, 30, 35], 6.8, 9);
    p.stand(SHEET.table, [130, 29, 30, 35], 11.7, 9);
    p.stand(SHEET.chest, [0, 0, 94, 64], 3, 9.8);
    p.stand(SHEET.barrel, BARREL_A, 1.2, 5.8);
    p.stand(SHEET.hay, HAY[0] as Rect, 14.6, 9.8);
    p.finish();
  },
};

const MAPS: MapSpec[] = [FOREST, SNOW, AUTUMN, FARM, LAKE_SAND, HOUSE];

type InventoryItem = { id: string; name: string; license: string; authors: string[] };

async function inventory(): Promise<Map<string, InventoryItem>> {
  const response = await fetch('/lab/inventario-cenarios.json');
  const data = (await response.json()) as { items: InventoryItem[] } | InventoryItem[];
  const items = Array.isArray(data) ? data : data.items;
  return new Map(items.map((i) => [i.id, i]));
}

async function mapPanel(spec: MapSpec, info: Map<string, InventoryItem>): Promise<HTMLElement> {
  const canvas = h('canvas', 'map-canvas');
  canvas.setAttribute('aria-label', spec.title);
  const images = await loadSheets(spec.sheets);
  const painter = new MapPainter(canvas, spec.cols, spec.rows, images, spec.seed);
  spec.build(painter);

  const view = h('div', 'map-view fit', canvas);
  const toggle = h('button', 'map-zoom', 'Ver em tamanho real');
  toggle.type = 'button';
  toggle.onclick = () => {
    const fit = view.classList.toggle('fit');
    toggle.textContent = fit ? 'Ver em tamanho real' : 'Ajustar à tela';
  };

  const pieces = h('div', 'map-pieces');
  for (const id of [...painter.used].sort()) {
    const item = info.get(id);
    pieces.append(h('span', 'map-piece', item ? `${item.name} · ${item.license}` : id));
  }

  const section = h('section', 'panel map-panel');
  section.append(
    h('h2', '', spec.title),
    h('p', 'hint', `${spec.about} (${spec.cols}×${spec.rows} blocos de ${TILE}px)`),
    toggle,
    view,
    h('h3', 'map-sub', `Peças usadas (${painter.used.size})`),
    pieces,
  );
  return section;
}

/** Page "Mapas prontos": scenes assembled with the catalog pieces. */
export const readyMapsPage: LabPage = {
  id: 'mapa-prontos',
  label: 'Mapas prontos',
  section: 'Cenários e mapas',
  async mount(host) {
    host.append(
      h('h1', '', 'Mapas prontos'),
      h(
        'p',
        'hint',
        'Cenas montadas só com as peças livres do catálogo (LPC Revised e LPC original): floresta, neve, outono, fazenda, rio com ponte e o interior de uma casa. Servem para ver como as peças combinam. Os créditos de cada peça estão listados abaixo do mapa.',
      ),
    );
    const info = await inventory();
    for (const spec of MAPS) {
      try {
        host.append(await mapPanel(spec, info));
      } catch (error) {
        host.append(h('p', 'hint', `Não foi possível montar ${spec.title}: ${String(error)}`));
      }
    }
  },
};
