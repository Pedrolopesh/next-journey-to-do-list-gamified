import {
  type Cell,
  type MapPainter,
  type Rect,
  rng,
  type TileSet,
  type Time,
} from '../pages/mapas-motor';
import {
  BARE,
  BLOB,
  BUSHES,
  DIRT,
  FLOWER_BUSHES,
  FLOWER_SMALL,
  GRASS,
  LILIES,
  MUSHROOMS,
  PINES,
  plants,
  REEDS,
  ROCKS,
  ROUND,
  ROUND_DARK,
  SAND,
  type Season,
  SHEET,
  TALL_GRASS,
  terrain,
  trees,
  TUFTS,
  WATER,
} from '../pages/mapas-pecas';
import { buildingHeight, type BuildingStyle, placeBuilding, randomBuilding } from './construcoes';
import { CUSTOM, type CustomId } from './custom';
import { type Box, box, Grid, inBox, pick } from './grade';
import { kit, placeKit } from './kits';
import { PART, type Part } from './moveis';
import { cliff, FOOT_ROW, terrace } from './relevo';

/**
 * A map is a recipe: place, season, shape of the path, hour, how full it is, which kits and a
 * seed. Every map is a strip the character crosses from left to right; the path enters and leaves
 * on the same rows in all of them, so any two maps join end to end.
 */

export const COLS = 40;
export const ROWS = 12;
/** Top row of the path (two rows tall) at both ends of every map. */
export const PATH_ROW = 7;

export type LayoutId =
  'reto' | 'curva' | 'travessia' | 'clareira' | 'margem' | 'rua' | 'terraco' | 'corredor';

export const LAYOUTS: Record<LayoutId, string> = {
  reto: 'Caminho reto',
  curva: 'Caminho em curvas',
  travessia: 'Travessia com ponte',
  clareira: 'Clareira ou praça',
  margem: 'Margem de lago',
  rua: 'Rua com construções',
  terraco: 'Paredão com cachoeira',
  corredor: 'Corredor (interior)',
};

export type BiomeId =
  | 'vila'
  | 'floresta'
  | 'campo'
  | 'neve'
  | 'pantano'
  | 'montanha'
  | 'praia'
  | 'cidade'
  | 'castelo'
  | 'cemiterio'
  | 'arena'
  | 'apocalipse'
  | 'inferno'
  | 'masmorra'
  | 'interior'
  | 'moderna'
  | 'caverna'
  | 'salao';

export type Weather = 'clear' | 'rain';

export type Recipe = {
  id: string;
  title: string;
  about: string;
  biome: BiomeId;
  season: Season;
  layout: LayoutId;
  time: Time;
  /** 0.4 (open) to 1.4 (packed). */
  density: number;
  seed: number;
  kits: string[];
  /** Rain over the map (outdoors, and where it is not cold enough to snow). */
  weather?: Weather;
  /** How many screens long the map is (`SCREENS` when absent). */
  screens?: number;
};

/** Screens of a map when the recipe does not say: the stage loops, so it has to be long. */
export const SCREENS = 5;
export const MAX_SCREENS = 8;

const LAVA = 'base-lava-lava';
const LAVAROCK = 'base-lava-lavarock';
const CEMENT = 'base-sewer-dungeon-cement';
const DUNGEON = 'base-sewer-dungeon-dungeon';
const BRICK = 'rev-structure-walls-brick-wall-a';
const WINDOW = 'rev-structure-windows-stone-windows-a';
const PAINTED = 'rev-structure-walls-painted-walls';
const JAGGED = 'rev-structure-walls-jagged-stone-walls';
const HERRINGBONE = 'rev-structure-floor-herringbone-a';
const GRITTY = 'rev-structure-floor-gritty-dirt';
const OLD_FILL: Cell[] = [
  [0, 5],
  [1, 5],
  [2, 5],
];

type TreeKind = 'round' | 'dark' | 'pine' | 'bare';
const ROCK_FILL: Cell[] = [
  [1, 5],
  [2, 5],
  [1, 3],
];
const TREE: Record<TreeKind, Rect[]> = {
  round: ROUND,
  dark: ROUND_DARK,
  pine: PINES,
  bare: [BARE],
};

type Biome = {
  name: string;
  indoor?: boolean;
  /** Seasons that make sense (the first is the default). */
  seasons: Season[];
  layouts: LayoutId[];
  ground: 'grass' | 'sand' | 'lavarock';
  path: 'dirt' | 'cement' | 'boards' | 'none';
  trees: TreeKind[];
  /** Trees above and below the path at density 1. */
  treeCount: [number, number];
  flowers?: boolean;
  mushrooms?: boolean;
  ponds?: boolean;
  buildings?: BuildingStyle;
  /** Props drawn in code scattered on the ground. */
  litter?: CustomId[];
  tint?: string;
  /** Color of the night veil, for places that glow by themselves. */
  night?: string;
  kits: string[];
};

const OUT: LayoutId[] = ['reto', 'curva', 'travessia', 'clareira', 'margem', 'rua', 'terraco'];

export const BIOMES: Record<BiomeId, Biome> = {
  vila: {
    name: 'Vila',
    seasons: ['summer', 'autumn'],
    layouts: OUT,
    ground: 'grass',
    path: 'dirt',
    trees: ['round'],
    treeCount: [5, 7],
    flowers: true,
    buildings: 'vila',
    kits: ['praca', 'banca', 'carga', 'horta', 'descanso', 'jardim', 'cerca', 'missoes'],
  },
  floresta: {
    name: 'Floresta',
    seasons: ['summer', 'autumn'],
    layouts: OUT,
    ground: 'grass',
    path: 'dirt',
    trees: ['round', 'dark', 'pine'],
    treeCount: [16, 11],
    mushrooms: true,
    kits: ['acampamento', 'pedras', 'jardim', 'descanso', 'carga'],
  },
  campo: {
    name: 'Campo',
    seasons: ['summer', 'autumn'],
    layouts: OUT,
    ground: 'grass',
    path: 'dirt',
    trees: ['round'],
    treeCount: [4, 5],
    flowers: true,
    kits: ['horta', 'cerca', 'jardim', 'acampamento', 'descanso', 'pedras'],
  },
  neve: {
    name: 'Neve',
    seasons: ['winter'],
    layouts: OUT,
    ground: 'grass',
    path: 'dirt',
    trees: ['pine', 'bare'],
    treeCount: [12, 10],
    buildings: 'neve',
    kits: ['acampamento', 'carga', 'pedras', 'cerca', 'descanso'],
  },
  pantano: {
    name: 'Pântano',
    seasons: ['summer', 'autumn'],
    layouts: ['reto', 'curva', 'travessia', 'margem'],
    ground: 'grass',
    path: 'dirt',
    trees: ['bare', 'dark'],
    treeCount: [7, 6],
    mushrooms: true,
    ponds: true,
    tint: 'rgba(30, 70, 50, 0.24)',
    kits: ['pedras', 'acampamento', 'tumulos', 'cristais'],
  },
  montanha: {
    name: 'Montanha',
    seasons: ['summer', 'autumn', 'winter'],
    layouts: ['terraco'],
    ground: 'grass',
    path: 'dirt',
    trees: ['pine'],
    treeCount: [0, 9],
    kits: ['acampamento', 'pedras', 'cristais', 'descanso', 'carga'],
  },
  praia: {
    name: 'Praia',
    seasons: ['summer'],
    layouts: ['reto', 'curva'],
    ground: 'sand',
    path: 'boards',
    trees: ['round'],
    treeCount: [3, 0],
    kits: ['acampamento', 'carga', 'banca', 'pedras', 'descanso'],
  },
  cidade: {
    name: 'Cidade',
    seasons: ['summer', 'autumn', 'winter'],
    layouts: ['rua', 'clareira', 'reto'],
    ground: 'grass',
    path: 'cement',
    trees: ['round'],
    treeCount: [2, 5],
    buildings: 'cidade',
    kits: ['missoes', 'portal', 'banca', 'praca', 'descanso', 'carga'],
  },
  castelo: {
    name: 'Castelo',
    seasons: ['summer', 'autumn', 'winter'],
    layouts: ['rua', 'clareira', 'reto'],
    ground: 'grass',
    path: 'cement',
    trees: ['pine'],
    treeCount: [2, 6],
    buildings: 'castelo',
    kits: ['praca', 'tochas', 'posto', 'carga', 'missoes'],
  },
  cemiterio: {
    name: 'Cemitério',
    seasons: ['autumn', 'winter'],
    layouts: ['reto', 'curva', 'clareira'],
    ground: 'grass',
    path: 'dirt',
    trees: ['bare', 'dark'],
    treeCount: [6, 6],
    litter: ['tombA', 'tombB', 'cross'],
    tint: 'rgba(150, 160, 195, 0.2)',
    kits: ['tumulos', 'tochas', 'pedras', 'cerca'],
  },
  arena: {
    name: 'Arena de tiro',
    seasons: ['summer', 'autumn'],
    layouts: ['reto', 'clareira', 'curva'],
    ground: 'grass',
    path: 'dirt',
    trees: ['pine'],
    treeCount: [4, 6],
    kits: ['barricada', 'posto', 'carga', 'destrocos'],
  },
  apocalipse: {
    name: 'Apocalipse',
    seasons: ['autumn', 'winter'],
    layouts: ['rua', 'reto', 'clareira', 'curva'],
    ground: 'grass',
    path: 'cement',
    trees: ['bare'],
    treeCount: [4, 5],
    buildings: 'ruina',
    litter: ['rubble', 'bones'],
    tint: 'rgba(90, 70, 40, 0.24)',
    kits: ['destrocos', 'barricada', 'posto', 'tumulos', 'carga'],
  },
  inferno: {
    name: 'Inferno',
    seasons: ['summer'],
    layouts: ['reto', 'curva', 'travessia', 'margem'],
    ground: 'lavarock',
    path: 'dirt',
    trees: [],
    treeCount: [0, 0],
    ponds: true,
    litter: ['flame', 'bones', 'rubble', 'crystalRed'],
    tint: 'rgba(150, 30, 0, 0.14)',
    night: '#b98a8a',
    kits: ['chamas', 'tochas', 'cristais', 'cela', 'trono'],
  },
  masmorra: {
    name: 'Masmorra',
    indoor: true,
    seasons: ['summer'],
    layouts: ['corredor'],
    ground: 'grass',
    path: 'none',
    trees: [],
    treeCount: [0, 0],
    litter: ['bones', 'rubble'],
    kits: ['cela', 'ossario', 'tochas', 'caldeirao', 'cristais', 'deposito', 'minerio'],
  },
  interior: {
    name: 'Casa por dentro',
    indoor: true,
    seasons: ['summer'],
    layouts: ['corredor'],
    ground: 'grass',
    path: 'none',
    trees: [],
    treeCount: [0, 0],
    kits: [
      'lareira',
      'bau',
      'estante',
      'cozinha',
      'quarto',
      'relogio',
      'jantar',
      'leitura',
      'balcao',
    ],
  },
  moderna: {
    name: 'Casa moderna',
    indoor: true,
    seasons: ['summer'],
    layouts: ['corredor'],
    ground: 'grass',
    path: 'none',
    trees: [],
    treeCount: [0, 0],
    kits: [
      'sala',
      'cozinha-moderna',
      'escritorio',
      'penteadeira',
      'estante-moderna',
      'estar',
      'plantas',
      'jantar',
    ],
  },
  caverna: {
    name: 'Caverna e forja',
    indoor: true,
    seasons: ['summer'],
    layouts: ['corredor'],
    ground: 'grass',
    path: 'none',
    trees: [],
    treeCount: [0, 0],
    kits: ['minerio', 'forja', 'ferro', 'fundicao', 'carvao', 'amolador', 'cristais', 'deposito'],
  },
  salao: {
    name: 'Salão do castelo',
    indoor: true,
    seasons: ['summer'],
    layouts: ['corredor'],
    ground: 'grass',
    path: 'none',
    trees: [],
    treeCount: [0, 0],
    kits: [
      'trono',
      'galeria',
      'banquete',
      'armaria',
      'biblioteca',
      'conselho',
      'taca',
      'emblema',
      'tochas',
      'lareira',
    ],
  },
};

/** Sheets any recipe may ask for (loaded once and shared). */
export const RECIPE_SHEETS: string[] = [
  ...(['summer', 'autumn', 'winter'] as const).flatMap((s) => [
    terrain(s),
    trees(s),
    plants(s),
    cliff(s),
  ]),
  terrain('winter-ice'),
  LAVA,
  LAVAROCK,
  CEMENT,
  DUNGEON,
  BRICK,
  WINDOW,
  PAINTED,
  JAGGED,
  HERRINGBONE,
  GRITTY,
  SHEET.woodFloor,
  SHEET.inside,
  SHEET.diamond,
  SHEET.fence,
  SHEET.flowers,
  SHEET.mushrooms,
  SHEET.rocks,
];

/** Top row of the path in each column. It always starts and ends on `PATH_ROW`. */
export function pathRows(layout: LayoutId, random: () => number): number[] {
  const rows = new Array<number>(COLS).fill(PATH_ROW);
  if (layout !== 'curva') return rows;
  const segments = COLS / 4;
  let v = PATH_ROW;
  for (let i = 1; i < segments - 1; i++) {
    const left = segments - 1 - i;
    if (left <= Math.abs(v - PATH_ROW)) v += Math.sign(PATH_ROW - v);
    else v = Math.min(8, Math.max(5, v + pick(random, [-1, 0, 1])));
    for (let x = i * 4; x < i * 4 + 4; x++) rows[x] = v;
  }
  return rows;
}

type Room = {
  /** Origin of the 3x3 block of the wall. */
  wall: [string, Cell];
  floor: (p: MapPainter) => void;
  /** What is hung on the wall between the windows or torches. */
  art: Part[];
  /** Stains and cracks painted flat on the floor. */
  stains?: Part[];
  /** Small things that stand in the gaps between the kits. */
  filler: Part[];
};

const WALL_SLOTS = [5, 15, 25, 35];
const NEAR_SLOTS = [10, 20, 30];
const WALL_Y = 4.3;
const NEAR_Y = 11;

const ROOMS: Record<string, Room> = {
  masmorra: {
    wall: [DUNGEON, [0, 0]],
    floor: (p) => p.fill(CEMENT, OLD_FILL, 0, 3, COLS, ROWS - 3),
    art: [PART.chainA, PART.chainB, PART.webWide, PART.webCorner, PART.moss],
    stains: [PART.slime, PART.crack, PART.mud, PART.crack],
    filler: [PART.skull, PART.bonePile, PART.stoneB],
  },
  salao: {
    wall: [BRICK, [3, 0]],
    floor: (p) => p.fill(CEMENT, OLD_FILL, 0, 3, COLS, ROWS - 3),
    art: [
      PART.portrait0,
      PART.portrait1,
      PART.portrait2,
      PART.portrait3,
      PART.portrait4,
      PART.portrait5,
    ],
    filler: [PART.vaseTall, PART.vaseBlue, PART.vaseTeal],
  },
  interior: {
    wall: [SHEET.inside, [0, 0]],
    floor: (p) => p.fill(SHEET.woodFloor, [[2, 0]], 0, 3, COLS, ROWS - 3),
    art: [
      PART.landscape0,
      PART.landscape1,
      PART.landscape2,
      PART.landscape3,
      PART.still0,
      PART.still2,
      PART.still3,
      PART.portraitPearl,
    ],
    filler: [PART.vaseTall, PART.jar, PART.fernVase, PART.fernBox],
  },
  moderna: {
    wall: [PAINTED, [6, 0]],
    floor: (p) => {
      for (let y = 3; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) p.tile(HERRINGBONE, [2, (y - 3) % 3], x, y);
    },
    art: [
      PART.abstract0,
      PART.abstract1,
      PART.abstract2,
      PART.abstract3,
      PART.poster0,
      PART.poster1,
      PART.mirrorOval,
      PART.landscape5,
    ],
    filler: [PART.bigVase, PART.fernVase, PART.treeVase, PART.treeBox],
  },
  caverna: {
    wall: [JAGGED, [0, 3]],
    floor: (p) => p.fill(GRITTY, [[1, 1]], 0, 3, COLS, ROWS - 3),
    art: [PART.toolRackB, PART.webWide, PART.chainA, PART.toolRackC, PART.webCorner],
    stains: [PART.mud, PART.crack, PART.mud],
    filler: [PART.stoneA, PART.stoneB, PART.stoneC, PART.stoneD, PART.coalLump, PART.coalTiny],
  },
};

function paintIndoor(p: MapPainter, recipe: Recipe): void {
  const biome = BIOMES[recipe.biome];
  const room = ROOMS[recipe.biome] as Room;
  const dungeon = recipe.biome === 'masmorra';
  const hall = recipe.biome === 'salao';
  const cave = recipe.biome === 'caverna';
  p.background('#15121f');
  room.floor(p);
  for (let x = 0; x < COLS; x++) {
    const col = x === 0 ? 0 : x === COLS - 1 ? 2 : 1;
    for (let y = 0; y < 3; y++)
      p.tile(room.wall[0], [room.wall[1][0] + col, room.wall[1][1] + y], x, y);
  }
  if (hall) {
    p.ground((ctx) => {
      ctx.fillStyle = '#7d1626';
      ctx.fillRect(0, PATH_ROW * 32 - 6, COLS * 32, 76);
      ctx.fillStyle = '#c9a23a';
      ctx.fillRect(0, PATH_ROW * 32 - 6, COLS * 32, 4);
      ctx.fillRect(0, PATH_ROW * 32 + 66, COLS * 32, 4);
    });
  } else if (recipe.biome === 'interior') {
    p.tiled(SHEET.diamond, [96, 0, 32, 32], 14, PATH_ROW - 1, 12, 4);
  }
  for (let i = 0; i < Math.round(5 * recipe.density) && room.stains; i++) {
    const part = pick(p.random, room.stains);
    p.flat(part[0], part[1], 1 + p.random() * (COLS - 3), 3.4 + p.random() * (ROWS - 5));
  }

  // The kits of the recipe come first and the room is completed with others of the place, so
  // that every slot along the wall and on the near side is furnished
  const spare = biome.kits.filter((id) => !recipe.kits.includes(id));
  for (let k = spare.length - 1; k > 0; k--) {
    const j = Math.floor(p.random() * (k + 1));
    [spare[k], spare[j]] = [spare[j] as string, spare[k] as string];
  }
  const wallFree = [...WALL_SLOTS];
  const nearFree = [...NEAR_SLOTS];
  const covered: [number, number][] = [];
  for (const id of [...recipe.kits, ...spare]) {
    const k = kit(id);
    const side =
      k.side ?? (wallFree.length > nearFree.length ? 'wall' : nearFree.length ? 'near' : 'wall');
    const slots = side === 'wall' ? wallFree : nearFree;
    const x = slots.shift();
    if (x === undefined) continue;
    placeKit(p, k, x + (p.random() - 0.5) * 0.6, side === 'wall' ? WALL_Y : NEAR_Y);
    if (side === 'wall' && k.high) covered.push([x - k.w / 2 - 0.3, x + k.w / 2 + 0.3]);
  }
  const open = (x: number): boolean => !covered.some(([a, b]) => x > a && x < b);

  // What hangs on the wall, at a steady rhythm, where no kit is using the wall
  const windowCol = recipe.time === 'night' ? 0 : 1;
  let n = 0;
  for (let x = 3; x < COLS; x += 6) {
    if (open(x + 0.5)) {
      if (dungeon) {
        p.custom(x + 0.5, 3.2, CUSTOM.torch, -2);
        p.light(x + 0.5, 2.4, 3.4, '255,150,60');
      } else if (cave) {
        p.stand(PART.wallTorch[0], PART.wallTorch[1], x + 0.5, 2.7, -2);
        p.light(x + 0.5, 2.2, 3.4, '255,150,60');
      } else if (hall) {
        p.stand(WINDOW, [windowCol * 32, 0, 32, 96], x + 0.5, 2.9, -2);
      } else {
        p.stand(WINDOW, [windowCol * 32, 96, 32, 32], x + 0.5, 2.2, -2);
      }
    }
    if (x + 3.5 >= COLS || !open(x + 3.5)) continue;
    n++;
    if (hall && n % 2 === 0) {
      p.custom(x + 3.5, 3.4, n % 4 === 0 ? CUSTOM.bannerRed : CUSTOM.bannerBlue, -2);
      continue;
    }
    const art = pick(p.random, room.art);
    p.stand(art[0], art[1], x + 3.5, 1.3 + art[1][3] / 64, -2);
  }
  if (hall) {
    for (const x of NEAR_SLOTS) p.custom(x, 6.5, CUSTOM.pillar);
    for (const x of WALL_SLOTS) p.custom(x, 9.9, CUSTOM.pillar);
  }
  // Small things in the gaps between the kits: against the wall and on the near side
  for (const x of NEAR_SLOTS) {
    if (p.random() < 0.75 && !hall) {
      const part = pick(p.random, room.filler);
      p.stand(part[0], part[1], x + (p.random() - 0.5) * 2, WALL_Y - 0.1 + p.random() * 0.5);
    }
  }
  for (const x of WALL_SLOTS) {
    if (p.random() < 0.6 && !hall) {
      const part = pick(p.random, room.filler);
      p.stand(part[0], part[1], x + (p.random() - 0.5) * 2, NEAR_Y + p.random() * 0.5);
    }
  }
  for (let i = 0; i < Math.round(4 * recipe.density) && biome.litter; i++) {
    p.custom(
      pick(p.random, WALL_SLOTS) + (p.random() - 0.5) * 3,
      10.2 + p.random() * 1.5,
      CUSTOM[pick(p.random, biome.litter)],
    );
  }
}

function paintOutdoor(p: MapPainter, recipe: Recipe): void {
  const biome = BIOMES[recipe.biome];
  const random = p.random;
  const season = recipe.season;
  const t = terrain(season);
  const c = pathRows(recipe.layout, random);
  const reserved: Box[] = [];
  const top = (x: number): number => c[Math.min(COLS - 1, Math.max(0, Math.round(x)))] as number;

  // Where the path and the liquid (water, ice or lava) go
  const path = Grid.from(COLS, ROWS, (x, y) => y === c[x] || y === (c[x] as number) + 1);
  if (recipe.layout === 'clareira') path.box(14, PATH_ROW - 2, 12, 5);
  const liquid = new Grid(COLS, ROWS);
  let river = -1;
  if (recipe.layout === 'travessia') {
    river = 15 + Math.floor(random() * 7);
    liquid.box(river, 0, 4, ROWS);
    reserved.push(box(river - 2, 0, 8, ROWS));
  }
  if (recipe.layout === 'margem') {
    let depth = 4;
    for (let x = 8; x < 32; x++) {
      if (x % 3 === 0) depth = Math.min(5, Math.max(3, depth + pick(random, [-1, 0, 1])));
      liquid.box(x, 1, 1, Math.min(depth, PATH_ROW - 3));
    }
    reserved.push(box(7, 0, 26, 5.6));
  }
  const fall = recipe.layout === 'terraco' ? 8 + Math.floor(random() * 24) : -1;
  if (fall >= 0) {
    reserved.push(box(fall - 3, 0, 6, PATH_ROW));
    // The rock slides that close each end of the cliff
    reserved.push(box(0, 0, 5, FOOT_ROW + 1), box(COLS - 5, 0, 5, FOOT_ROW + 1));
  }
  if (biome.ponds) {
    for (let i = 0; i < 5; i++) {
      const w = 4 + Math.floor(random() * 3);
      const x = 1 + Math.floor(random() * (COLS - w - 2));
      const above = i % 2 === 0;
      const y = above ? 1 + Math.floor(random() * 2) : top(x) + 3;
      const h = above ? Math.min(3, top(x) - y - 2) : ROWS - y;
      if (h < 2 || (river >= 0 && Math.abs(x - river) < 8)) continue;
      liquid.box(x, y, w, h);
      reserved.push(box(x - 1, y - 1, w + 2, h + 2));
    }
  }
  liquid.tidy();
  const isPath = (x: number, y: number): boolean => path.get(x, y);

  // Ground, from the bottom layer up
  if (biome.ground === 'lavarock') p.fill(terrain('autumn'), DIRT, 0, 0, COLS, ROWS);
  else if (biome.ground === 'sand') p.fill(t, SAND, 0, 0, COLS, ROWS);
  else if (biome.path === 'cement') p.fill(CEMENT, OLD_FILL, 0, 0, COLS, ROWS);
  else p.fill(t, DIRT, 0, 0, COLS, ROWS);

  if (biome.ground === 'lavarock') {
    const rock = Grid.from(COLS, ROWS, (x, y) => !isPath(x, y)).tidy();
    p.autotile(rock.get, { sheet: LAVAROCK, origin: [0, 2], inner: [1, 0], fill: ROCK_FILL });
  }
  if (biome.ground === 'grass') {
    const grass = Grid.from(COLS, ROWS, (x, y) => !isPath(x, y)).tidy();
    p.autotile(grass.get, { sheet: t, origin: BLOB, inner: [0, 6], fill: GRASS });
  } else if (biome.ground === 'sand') {
    const dunes = new Grid(COLS, ROWS);
    for (let i = 0; i < 4; i++)
      dunes.box(2 + i * 10 + Math.floor(random() * 3), 1, 5 + Math.floor(random() * 3), 3);
    p.autotile(dunes.tidy().get, { sheet: t, origin: BLOB, inner: [0, 6], fill: GRASS });
    p.autotile((_, y) => y >= ROWS - 2, { sheet: t, origin: [0, 20] });
    if (season !== 'winter')
      for (let x = 0; x < COLS; x++) p.mark('water', x * 32, (ROWS - 1) * 32, 32, 32);
    reserved.push(box(0, ROWS - 2.4, COLS, 3));
  }
  if (biome.path === 'boards') {
    for (let x = 0; x < COLS; x++)
      p.tiled(SHEET.woodFloor, [64, 0, 32, 32], x, c[x] as number, 1, 2);
  }
  const frozen = season === 'winter';
  const liquidSet: TileSet =
    biome.ground === 'lavarock'
      ? { sheet: LAVA, origin: [0, 2], inner: [1, 0], fill: OLD_FILL }
      : { sheet: frozen ? terrain('winter-ice') : t, origin: [0, 10], inner: [0, 13], fill: WATER };
  p.autotile(liquid.get, liquidSet);
  // Open water and lava (not the shore tiles, not ice) can shimmer
  if (!frozen || biome.ground === 'lavarock') {
    const kind = biome.ground === 'lavarock' ? 'lava' : 'water';
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (
          liquid.get(x, y) &&
          liquid.get(x - 1, y) &&
          liquid.get(x + 1, y) &&
          (y === 0 || liquid.get(x, y - 1)) &&
          (y === ROWS - 1 || liquid.get(x, y + 1))
        )
          p.mark(kind, x * 32, y * 32, 32, 32);
  }
  if (biome.ground === 'lavarock') {
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (liquid.get(x, y) && random() < 0.08) p.light(x + 0.5, y + 0.5, 2.2, '255,90,30');
  }

  if (river >= 0) {
    const y = top(river);
    p.tiled(SHEET.woodFloor, [64, 0, 32, 32], river - 1, y, 6, 2);
    p.stand(SHEET.fence, [104, 0, 13, 128], river - 0.5, y + 0.4);
    p.stand(SHEET.fence, [104, 0, 13, 128], river + 4.5, y + 0.4);
  }
  if (fall >= 0) {
    const others = [7, 13, 20, 27, 33].filter((x) => Math.abs(x - fall) > 5);
    terrace(p, season, {
      waterfall: fall,
      cave: others[0] as number,
      ladder: others[others.length - 1] as number,
      vines: others.slice(1, -1).map((x) => x + 0.5),
    });
  }

  // Buildings first, then kits, on the free spots beside the path
  const free = (x: number, y: number, w: number): boolean =>
    !reserved.some((b) => inBox(b, x - w / 2, y) || inBox(b, x + w / 2, y) || inBox(b, x, y));
  const upper = [5, 12, 20, 28, 35].map((x) => x + Math.round(random() * 2 - 1));
  const lower = [9, 18, 26, 33];
  const centre = recipe.layout === 'clareira';
  const lots =
    biome.buildings && fall < 0
      ? recipe.layout === 'rua'
        ? [0, 1, 3, 4]
        : centre
          ? [0, 4]
          : [1, 3]
      : [];
  const usedUpper = new Set<number>();
  for (const i of lots) {
    const x = upper[i] as number;
    const b = randomBuilding(random, biome.buildings as BuildingStyle);
    const y = top(x) - 0.15;
    if (!free(x, y, b.w)) continue;
    placeBuilding(p, b, x, y, recipe.time);
    reserved.push(
      box(x - b.w / 2 - 0.6, y - buildingHeight(b) - 0.5, b.w + 1.2, buildingHeight(b) + 1),
    );
    usedUpper.add(i);
  }
  const spots: [number, number][] = [];
  if (centre) spots.push([20, PATH_ROW - 0.2]);
  upper.forEach((x, i) => {
    if (!usedUpper.has(i) && !(centre && i === 2)) spots.push([x, top(x) - 0.3]);
  });
  for (const x of lower) spots.push([x, top(x) + 3.4]);
  let next = 0;
  for (const id of recipe.kits) {
    const k = kit(id);
    while (next < spots.length) {
      const [x, y] = spots[next++] as [number, number];
      if (!free(x, y, k.w)) continue;
      placeKit(p, k, x, y);
      reserved.push(box(x - k.w / 2 - 0.4, y - 2.6, k.w + 0.8, 3.2));
      break;
    }
  }

  // Plants fill what is left, never on the path, the liquid or a reserved spot
  const placed: [number, number][] = [];
  const clear = (x: number, y: number): boolean =>
    !isPath(x, y - 0.2) &&
    !isPath(x, y + 0.5) &&
    !liquid.get(x, y - 0.3) &&
    !liquid.get(x, y + 0.4) &&
    !reserved.some((b) => inBox(b, x, y));
  const sow = (
    sheet: string,
    rects: readonly Rect[],
    count: number,
    band: 'top' | 'tree-low' | 'low' | 'any',
    gap: number,
  ): void => {
    let tries = 0;
    let done = 0;
    const total = Math.round(count * recipe.density);
    while (done < total && tries++ < total * 30) {
      const x = random() * COLS;
      const edge = top(x);
      const floor = fall >= 0 ? FOOT_ROW + 0.4 : 1.4;
      let y: number;
      if (band === 'top') y = floor + random() * Math.max(0.5, edge - 0.3 - floor);
      else if (band === 'tree-low') y = edge + 4.7 + random() * 1.6;
      else if (band === 'low') y = edge + 2.5 + random() * (ROWS - edge - 2.6);
      else
        y =
          random() < 0.5
            ? floor + random() * Math.max(0.5, edge - 0.3 - floor)
            : edge + 2.5 + random() * (ROWS - edge - 2.6);
      if (!clear(x, y) || placed.some(([px, py]) => Math.hypot(px - x, py - y) < gap)) continue;
      placed.push([x, y]);
      p.stand(sheet, pick(random, rects), x, y);
      done++;
    }
  };
  if (biome.ground !== 'lavarock') {
    const tr = trees(season);
    const kinds = biome.trees.flatMap((k) => TREE[k]);
    if (kinds.length) {
      if (fall < 0) sow(tr, kinds, biome.treeCount[0], 'top', 1.7);
      sow(tr, kinds, biome.treeCount[1], 'tree-low', 1.6);
    }
    const pl = plants(season);
    sow(pl, BUSHES, 9, 'any', 1.3);
    sow(pl, TUFTS, 16, 'any', 0.9);
    if (season !== 'winter') sow(pl, TALL_GRASS, 6, 'any', 1.2);
    if (biome.flowers && season !== 'winter') {
      sow(SHEET.flowers, FLOWER_BUSHES([0, 1, 3, 5]), 8, 'any', 1.2);
      sow(SHEET.flowers, FLOWER_SMALL([1, 3, 5, 8]), 12, 'any', 1);
    }
    if (biome.mushrooms) sow(SHEET.mushrooms, MUSHROOMS, 9, 'any', 1);
    sow(SHEET.rocks, ROCKS.slice(2), 5, 'any', 2);
    if (!frozen) {
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(random() * COLS);
        const y = Math.floor(random() * ROWS);
        const inner =
          liquid.get(x, y) &&
          liquid.get(x - 1, y) &&
          liquid.get(x + 1, y) &&
          liquid.get(x, y - 1) &&
          liquid.get(x, y + 1);
        if (inner && !isPath(x, y))
          p.stand(pl, pick(random, [...LILIES, ...REEDS]), x + 0.5, y + 0.9);
      }
    }
  }
  for (let i = 0; i < Math.round(8 * recipe.density) && biome.litter; i++) {
    const x = 1 + random() * (COLS - 2);
    const y =
      random() < 0.5
        ? 2 + random() * (top(x) - 2.6)
        : top(x) + 2.6 + random() * (ROWS - top(x) - 2.8);
    if (!clear(x, y)) continue;
    const id = pick(random, biome.litter);
    p.custom(x, y, CUSTOM[id]);
    if (id === 'flame') p.light(x, y - 0.5, 2.6, '255,150,60');
  }
}

/** Paints the map of a recipe (the sheets must be loaded in the painter). */
export function paintRecipe(p: MapPainter, recipe: Recipe, finish = true): void {
  const biome = BIOMES[recipe.biome];
  if (biome.indoor) paintIndoor(p, recipe);
  else paintOutdoor(p, recipe);
  if (finish) p.finish(recipe.time, biome.tint, biome.night);
}

/**
 * The screens of a map, from left to right. The first is the recipe itself; the others keep the
 * place, the season and the hour and change the shape of the path, the seed and the order of the
 * kits (one of them swapped for another of the place). Every screen enters and leaves on
 * `PATH_ROW`, so the last one joins the first (the stage loops) and the next map.
 */
export function screensOf(recipe: Recipe): Recipe[] {
  const biome = BIOMES[recipe.biome];
  const count = Math.max(1, Math.min(MAX_SCREENS, recipe.screens ?? SCREENS));
  const random = rng(recipe.seed * 31 + 7);
  const out: Recipe[] = [{ ...recipe, screens: 1 }];
  let last = recipe.layout;
  for (let i = 1; i < count; i++) {
    const others = biome.layouts.filter((l) => l !== last);
    const layout = others.length ? pick(random, others) : last;
    const kits = [...recipe.kits];
    for (let k = kits.length - 1; k > 0; k--) {
      const j = Math.floor(random() * (k + 1));
      [kits[k], kits[j]] = [kits[j] as string, kits[k] as string];
    }
    const spare = biome.kits.filter((k) => !kits.includes(k));
    if (spare.length && kits.length) kits[kits.length - 1] = pick(random, spare);
    out.push({
      ...recipe,
      id: `${recipe.id}-t${i + 1}`,
      layout,
      kits,
      seed: recipe.seed + i * 101,
      screens: 1,
    });
    last = layout;
  }
  return out;
}

/** A recipe at random: what the automatic generation does, one seed at a time. */
export function randomRecipe(seed: number, random: () => number, biomeId?: BiomeId): Recipe {
  const ids = Object.keys(BIOMES) as BiomeId[];
  const id = biomeId ?? pick(random, ids);
  const biome = BIOMES[id];
  const count = 2 + Math.floor(random() * 3);
  const kits: string[] = [];
  for (let i = 0; i < count; i++) kits.push(pick(random, biome.kits));
  return {
    id: `sorteio-${seed}`,
    title: `${biome.name} #${seed}`,
    about: 'Mapa sorteado pela receita.',
    biome: id,
    season: pick(random, biome.seasons),
    layout: pick(random, biome.layouts),
    time: pick(random, ['morning', 'afternoon', 'afternoon', 'night'] as const),
    density: 0.6 + random() * 0.7,
    seed,
    kits,
  };
}
