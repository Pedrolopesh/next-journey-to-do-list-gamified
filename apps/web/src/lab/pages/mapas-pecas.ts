/** Pieces of the free LPC sheets (rectangles, terrain cells and sheet names) shared by the ready-made maps. */

import { type Cell, type MapPainter, type Rect } from './mapas-motor';

export type Season = 'summer' | 'autumn' | 'winter';

export const GRASS: Cell[] = [
  [3, 1],
  [4, 1],
  [5, 1],
  [3, 2],
  [4, 2],
  [5, 2],
];
export const DIRT: Cell[] = [
  [3, 3],
  [4, 3],
  [5, 3],
  [3, 4],
  [4, 4],
  [5, 4],
];
export const SAND: Cell[] = [
  [3, 5],
  [4, 5],
  [5, 5],
];
export const WATER: Cell[] = [
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
];
// Blocks of the terrain sheet (origin tile of the 3x3)
export const BLOB: Cell = [0, 0]; // grass (or snow) patch with a rough border, over any ground
export const LAKE: Cell = [3, 10]; // lake with a grass bank and an empty center
export const SAND_LAKE: Cell = [5, 20]; // lake with a sand bank and an empty center

// Trees: sprites of the tree sheets (same layout in all seasons), standing on the trunk base
export const ROUND: Rect[] = [
  [128, 14, 96, 96],
  [224, 14, 96, 104],
  [320, 14, 96, 128],
  [416, 112, 96, 126],
];
export const ROUND_DARK: Rect[] = [
  [128, 272, 96, 92],
  [224, 272, 96, 98],
  [320, 272, 96, 126],
];
export const PINES: Rect[] = [
  [128, 386, 96, 108],
  [224, 386, 96, 108],
  [320, 420, 96, 92],
  [416, 356, 96, 138],
];
export const BARE: Rect = [0, 272, 96, 130];

// Plants
export const BUSHES: Rect[] = [
  [0, 0, 32, 32],
  [32, 0, 32, 32],
  [64, 0, 32, 32],
  [96, 0, 32, 32],
  [160, 0, 32, 32],
];
export const TUFTS: Rect[] = [
  [256, 32, 32, 32],
  [288, 32, 32, 32],
  [320, 32, 32, 32],
];
export const TALL_GRASS: Rect[] = [
  [352, 0, 32, 64],
  [384, 0, 32, 64],
  [416, 0, 32, 64],
];
export const LILIES: Rect[] = [
  [384, 64, 32, 32],
  [416, 64, 32, 32],
  [384, 96, 32, 32],
];
export const REEDS: Rect[] = [
  [448, 64, 32, 32],
  [480, 64, 32, 32],
];

export const FLOWER_BUSHES = (columns: number[]): Rect[] =>
  columns.map((c) => [c * 32, 0, 32, 64] as Rect);
export const FLOWER_SMALL = (columns: number[]): Rect[] =>
  columns.map((c) => [c * 32, 64, 32, 32] as Rect);

export const MUSHROOMS: Rect[] = [
  [106, 0, 12, 21],
  [138, 0, 12, 21],
  [104, 32, 15, 23],
  [103, 61, 19, 29],
  [101, 94, 21, 24],
];
export const ROCKS: Rect[] = [
  [130, 2, 59, 55],
  [130, 130, 59, 55],
  [163, 76, 27, 15],
  [170, 107, 15, 9],
];

// Buildings and structures
export const BRICK_HOUSE_A: Rect = [24, 0, 208, 201];
export const BRICK_HOUSE_B: Rect = [23, 0, 144, 192];
export const PANELED_HOUSE: Rect = [0, 0, 160, 160];
export const FOUNTAIN: Rect = [0, 0, 64, 82];

// Campfire: one lit frame and the unlit wood
export const CAMP: Rect = [0, 34, 32, 30];
export const CAMP_OUT: Rect = [0, 2, 32, 30];

export const FENCE_H: Rect = [8, 0, 77, 32];

export const BARREL_A: Rect = [2, 0, 30, 33];
export const BARREL_B: Rect = [34, 0, 30, 33];
export const CRATES: Rect[] = [
  [66, 3, 22, 26],
  [66, 67, 22, 26],
];
export const HAY: Rect[] = [
  [3, 17, 57, 77],
  [67, 17, 57, 79],
];

// Sheets by name, so the maps only say what they use
export const SHEET = {
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

export const terrain = (s: Season | 'winter-ice'): string => `rev-terrain-terrain-${s}`;
export const trees = (s: Season): string => `rev-terrain-trees-${s}`;
export const plants = (s: Season): string => `rev-terrain-plants-${s}`;
export const wild = (s: Season): string => `rev-terrain-wildflowers-${s}`;

export type MapSpec = {
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
export function fenceLine(p: MapPainter, x: number, y: number, length: number): void {
  for (let i = 0; i < length; i += 2) p.flat(SHEET.fence, FENCE_H, x + i, y);
}
