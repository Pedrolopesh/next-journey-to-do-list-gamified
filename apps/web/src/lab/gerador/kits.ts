import type { MapPainter, Rect } from '../pages/mapas-motor';
import {
  BARE,
  BARREL_A,
  BARREL_B,
  BLOB,
  BUSHES,
  CAMP,
  CAMP_OUT,
  CRATES,
  fenceLine,
  FLOWER_BUSHES,
  FOUNTAIN,
  HAY,
  MUSHROOMS,
  ROCKS,
  SHEET,
  TALL_GRASS,
  TUFTS,
} from '../pages/mapas-pecas';
import { CUSTOM, type CustomId } from './custom';
import { pick } from './grade';

/**
 * Kits: small groups of pieces that always go together. A kit is a list of slots and each slot
 * has options; placing a kit picks one option per slot, so the same kit never looks the same
 * twice and no piece is ever dropped alone on the map.
 */

type Piece = {
  /** A sprite of a sheet... */
  s?: readonly [string, Rect];
  /** ...or a prop drawn in code... */
  c?: CustomId;
  /** ...or something painted on the ground. */
  g?: (p: MapPainter, x: number, y: number) => void;
  dx: number;
  dy: number;
  /** Light at night: radius in tiles and color. */
  glow?: readonly [number, string?];
};

export type Kit = {
  id: string;
  name: string;
  about: string;
  /** Width it takes on the map, in tiles. */
  w: number;
  where: 'fora' | 'dentro' | 'tema';
  slots: Piece[][][];
};

const PLANTS = 'rev-terrain-plants-summer';
const TREES_AUTUMN = 'rev-terrain-trees-autumn';

const s = (sheet: string, rect: Rect, dx: number, dy = 0, glow?: Piece['glow']): Piece => ({
  s: [sheet, rect],
  dx,
  dy,
  ...(glow ? { glow } : {}),
});
const c = (id: CustomId, dx: number, dy = 0, glow?: Piece['glow']): Piece => ({
  c: id,
  dx,
  dy,
  ...(glow ? { glow } : {}),
});

const FIRE: Piece['glow'] = [3.2, '255,150,60'];
const LAMP: Piece['glow'] = [3, '255,220,130'];

const barrels = (dx: number): Piece[] => [
  s(SHEET.barrel, BARREL_A, dx, 0),
  s(SHEET.barrel, BARREL_B, dx + 0.8, 0.2),
];
const crates = (dx: number): Piece[] => [
  s(SHEET.crate, CRATES[0] as Rect, dx, 0),
  s(SHEET.crate, CRATES[1] as Rect, dx + 0.7, 0.2),
];
const hay = (dx: number, k = 0): Piece[] => [s(SHEET.hay, HAY[k] as Rect, dx, 0.1)];
const flowers = (dx: number, col: number): Piece[] => [
  s(SHEET.flowers, FLOWER_BUSHES([col])[0] as Rect, dx, 0.1),
  s(SHEET.flowers, FLOWER_BUSHES([col + 1])[0] as Rect, dx + 0.8, 0.3),
];
const bush = (dx: number, k = 0): Piece => s(PLANTS, BUSHES[k] as Rect, dx, 0.1);

const garden: Piece = {
  dx: 0,
  dy: 0,
  g: (p, x, y) => {
    const gx = Math.round(x) - 2;
    const gy = Math.round(y) - 3;
    p.block(SHEET.tilled, BLOB, gx, gy, 4, 3);
    for (let i = 0; i < 3; i++)
      p.stand(PLANTS, TUFTS[i % TUFTS.length] as Rect, gx + 1 + i, gy + 2);
  },
};
const fence = (length: number): Piece => ({
  dx: 0,
  dy: 0,
  g: (p, x, y) => fenceLine(p, Math.round(x) - length / 2, Math.round(y) - 1, length),
});

export const KITS: Kit[] = [
  {
    id: 'acampamento',
    name: 'Acampamento',
    about: 'Fogueira no meio, um assento de um lado e a carga ou a barraca do outro.',
    w: 5,
    where: 'fora',
    slots: [
      [[s(SHEET.camp, CAMP, 0, 0, FIRE)], [s(SHEET.camp, CAMP_OUT, 0)]],
      [hay(-1.7), crates(-2), [s(SHEET.rocks, ROCKS[1] as Rect, -1.8, 0.1)]],
      [barrels(1.5), [c('tentBrown', 2.2, -0.3)], [c('tentGreen', 2.2, -0.3)], crates(1.5)],
    ],
  },
  {
    id: 'praca',
    name: 'Centro de praça',
    about: 'Um marco no centro (fonte, poço ou estátua) com banco, flores ou poste em volta.',
    w: 5,
    where: 'fora',
    slots: [
      [[s(SHEET.fountain, FOUNTAIN, 0)], [c('well', 0)], [c('statue', 0)]],
      [[c('bench', -1.9, 0.1)], flowers(-2.2, 0), [c('lamppost', -1.7, 0.1, LAMP)]],
      [[c('bench', 1.9, 0.1)], flowers(1.5, 3), [c('lamppost', 1.7, 0.1, LAMP)]],
    ],
  },
  {
    id: 'carga',
    name: 'Carga',
    about: 'Pilha de caixas e barris, às vezes com feno ou um carrinho.',
    w: 4,
    where: 'fora',
    slots: [
      [crates(-0.6), barrels(-0.6), [...crates(-1), ...barrels(0.5)]],
      [hay(1.8), []],
    ],
  },
  {
    id: 'horta',
    name: 'Horta',
    about: 'Canteiro de terra arada com mudas e um complemento: cerca, feno ou placa.',
    w: 5,
    where: 'fora',
    slots: [[[garden]], [hay(2.6, 1), [c('signpost', 2.4, -0.4)], barrels(2.4)]],
  },
  {
    id: 'banca',
    name: 'Banca de mercado',
    about: 'Banca com toldo de três cores e mercadoria ao lado.',
    w: 4,
    where: 'fora',
    slots: [
      [[c('stallRed', 0)], [c('stallBlue', 0)], [c('stallGreen', 0)]],
      [crates(1.5), barrels(1.5), hay(1.7)],
    ],
  },
  {
    id: 'descanso',
    name: 'Ponto de descanso',
    about: 'Banco com poste de luz, flores ou uma placa de caminho.',
    w: 4,
    where: 'fora',
    slots: [
      [[c('bench', 0)]],
      [[c('lamppost', -1.4, 0, LAMP)], flowers(-1.8, 5), [c('signpost', -1.4)]],
      [[bush(1.4, 1)], flowers(1.2, 1), []],
    ],
  },
  {
    id: 'jardim',
    name: 'Canteiro de flores',
    about: 'Moita de flores em cores que variam, fechada por arbustos.',
    w: 4,
    where: 'fora',
    slots: [
      [flowers(-0.4, 0), flowers(-0.4, 2), flowers(-0.4, 4)],
      [flowers(-1.6, 1), [bush(-1.4, 0)], flowers(-1.6, 5)],
      [[bush(1.3, 2)], flowers(1, 3), [bush(1.3, 4)]],
    ],
  },
  {
    id: 'cerca',
    name: 'Cercado',
    about: 'Trecho de cerca com plantas na frente.',
    w: 5,
    where: 'fora',
    slots: [
      [[fence(4)], [fence(6)]],
      [[bush(-1, 0), bush(1, 3)], flowers(-0.5, 2), [s(PLANTS, TALL_GRASS[0] as Rect, 0, 0.2)]],
    ],
  },
  {
    id: 'pedras',
    name: 'Pedras e cogumelos',
    about: 'Pedra grande com cogumelos, capim alto ou pedras menores.',
    w: 3,
    where: 'fora',
    slots: [
      [[s(SHEET.rocks, ROCKS[0] as Rect, 0)], [s(SHEET.rocks, ROCKS[1] as Rect, 0)]],
      [
        [
          s(SHEET.mushrooms, MUSHROOMS[3] as Rect, -1.2, 0.1),
          s(SHEET.mushrooms, MUSHROOMS[0] as Rect, 1.1, 0.2),
        ],
        [s(PLANTS, TALL_GRASS[1] as Rect, -1.2, 0.1), s(PLANTS, TALL_GRASS[2] as Rect, 1.2, 0.1)],
        [s(SHEET.rocks, ROCKS[2] as Rect, -1.2, 0.2), s(SHEET.rocks, ROCKS[3] as Rect, 1.2, 0.2)],
      ],
    ],
  },
  {
    id: 'missoes',
    name: 'Quadro de missões',
    about: 'Quadro de avisos com poste, banco ou caixas ao lado.',
    w: 4,
    where: 'fora',
    slots: [[[c('board', 0)]], [[c('lamppost', 1.6, 0, LAMP)], [c('bench', 1.9)], crates(1.5)]],
  },
  {
    id: 'tumulos',
    name: 'Túmulos',
    about: 'Lápides e cruzes em arranjos diferentes, com árvore seca, ossos ou cerca.',
    w: 5,
    where: 'tema',
    slots: [
      [
        [c('tombA', -1), c('cross', 0, 0.2), c('tombB', 1)],
        [c('tombB', -1), c('tombA', 0, 0.2), c('tombA', 1.1)],
        [c('cross', -0.8), c('cross', 0.8, 0.2)],
      ],
      [[s(TREES_AUTUMN, BARE, 2.4, -0.3)], [c('bones', 2, 0.3)], [fence(4)]],
    ],
  },
  {
    id: 'barricada',
    name: 'Barricada',
    about: 'Linha de defesa: sacos de areia, tábuas ou caixas, com alvo, barril ou carro.',
    w: 5,
    where: 'tema',
    slots: [
      [[c('sandbags', 0)], [c('barricade', 0)], [...crates(-0.9), ...crates(0.5)]],
      [[c('target', 2.2, -0.2)], barrels(1.9), [c('wreck', 2.8, -0.2)]],
    ],
  },
  {
    id: 'destrocos',
    name: 'Destroços',
    about: 'Carro queimado ou carrinho virado, com entulho, ossos ou tábuas.',
    w: 5,
    where: 'tema',
    slots: [
      [[c('wreck', 0)], [s(SHEET.cart, [1, 0, 30, 31], 0, 0.1), c('rubble', -1.2, 0.2)]],
      [[c('bones', 2, 0.3)], [c('rubble', 2, 0.2)], [c('barricade', 2.6, -0.1)]],
    ],
  },
  {
    id: 'portal',
    name: 'Portal',
    about: 'Portal aceso entre cristais, colunas ou um quadro de missões.',
    w: 5,
    where: 'tema',
    slots: [
      [[c('portal', 0, 0, [3.6, '170,130,255'])]],
      [
        [
          c('crystalBlue', -1.8, 0.2, [1.6, '120,200,255']),
          c('crystalBlue', 1.8, 0.2, [1.6, '120,200,255']),
        ],
        [c('pillar', -1.9, 0.1), c('pillar', 1.9, 0.1)],
        [c('board', 2.2, 0.1), c('crystalGreen', -1.8, 0.2, [1.6, '120,255,160'])],
      ],
    ],
  },
  {
    id: 'tochas',
    name: 'Tochas',
    about: 'Par de tochas guardando uma jaula, ossos ou barris.',
    w: 4,
    where: 'tema',
    slots: [
      [[c('torch', -1.3, 0, FIRE), c('torch', 1.3, 0, FIRE)]],
      [[c('cage', 0, -0.1)], [c('bones', 0, 0.2)], barrels(-0.4), []],
    ],
  },
  {
    id: 'chamas',
    name: 'Chamas',
    about: 'Fogo saindo do chão, com cristal vermelho, ossos ou entulho.',
    w: 4,
    where: 'tema',
    slots: [
      [[c('flame', 0, 0, FIRE)], [c('flame', -0.7, 0, FIRE), c('flame', 0.7, 0.2, FIRE)]],
      [
        [c('crystalRed', 1.7, 0.1, [1.6, '255,110,80'])],
        [c('bones', 1.6, 0.3)],
        [c('rubble', 1.6, 0.2)],
      ],
    ],
  },
  {
    id: 'cristais',
    name: 'Cristais',
    about: 'Formação de cristais em cores diferentes.',
    w: 3,
    where: 'tema',
    slots: [
      [
        [c('crystalBlue', 0, 0, [2, '120,200,255'])],
        [c('crystalGreen', 0, 0, [2, '120,255,160'])],
        [c('crystalRed', 0, 0, [2, '255,110,80'])],
      ],
      [[c('crystalBlue', 1.2, 0.3)], [c('crystalGreen', -1.2, 0.3)], []],
    ],
  },
  {
    id: 'trono',
    name: 'Trono',
    about: 'Trono sobre degraus com estandartes, colunas ou tochas dos lados.',
    w: 5,
    where: 'tema',
    slots: [
      [[c('throne', 0)]],
      [
        [c('bannerRed', -1.9, -0.6), c('bannerRed', 1.9, -0.6)],
        [c('pillar', -2, 0.1), c('pillar', 2, 0.1)],
        [c('torch', -1.7, 0, FIRE), c('torch', 1.7, 0, FIRE)],
        [c('bannerBlue', -1.9, -0.6), c('bannerBlue', 1.9, -0.6)],
      ],
    ],
  },
  {
    id: 'posto',
    name: 'Posto avançado',
    about: 'Barraca cinza com sacos de areia, alvo ou caixas.',
    w: 5,
    where: 'tema',
    slots: [
      [[c('tentGrey', 0)]],
      [[c('sandbags', 2.6, 0.2)], [c('target', 2.2)], crates(1.9)],
      [barrels(-2.6), [c('signpost', -2)], []],
    ],
  },
  {
    id: 'lareira',
    name: 'Canto da lareira',
    about: 'Lareira acesa com mesa e banco, barris empilhados ou barril.',
    w: 5,
    where: 'dentro',
    slots: [
      [[s(SHEET.fireplace, [0, 13, 95, 75], 0, 0, FIRE)]],
      [
        [s(SHEET.table, [6, 19, 82, 45], 0.2, 2.6), s(SHEET.table, [98, 29, 30, 35], -1.8, 2.7)],
        [s(SHEET.chest, [0, 0, 94, 64], 3.3, 0.4)],
        [s(SHEET.barrel, BARREL_A, 2, 0.3), s(SHEET.barrel, BARREL_B, 2.8, 0.5)],
      ],
    ],
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    about: 'Fogão e bancada com barril, caixa ou mesa.',
    w: 4,
    where: 'dentro',
    slots: [
      [[s(SHEET.kitchen, [0, 0, 64, 128], 0, 0.2)]],
      [barrels(1.6), crates(1.6), [s(SHEET.table, [6, 19, 82, 45], 2.4, 2.4)]],
    ],
  },
  {
    id: 'estante',
    name: 'Armários',
    about: 'Dois ou três armários lado a lado com barris ou caixas.',
    w: 4,
    where: 'dentro',
    slots: [
      [
        [s(SHEET.shelf, [109, 8, 35, 88], -0.6, 0), s(SHEET.shelf, [109, 8, 35, 88], 0.6, 0)],
        [-1.2, 0, 1.2].map((dx) => s(SHEET.shelf, [109, 8, 35, 88], dx, 0)),
      ],
      [[s(SHEET.chest, [0, 0, 94, 64], 0, 2.4)], barrels(2.2), crates(1.9)],
    ],
  },
  {
    id: 'quarto',
    name: 'Quarto',
    about: 'Cama com barris empilhados, barril ou caixas.',
    w: 4,
    where: 'dentro',
    slots: [
      [[s(SHEET.country, [8, 12, 48, 88], 0, 0.2)]],
      [[s(SHEET.chest, [0, 0, 94, 64], 2.7, 0.5)], barrels(1.6), crates(-1.9)],
    ],
  },
  {
    id: 'balcao',
    name: 'Balcão',
    about: 'Mesa de atendimento com bancos e mercadoria.',
    w: 5,
    where: 'dentro',
    slots: [
      [[s(SHEET.table, [6, 19, 82, 45], 0, 0)]],
      [[s(SHEET.table, [98, 29, 30, 35], -2, 0.1)], [s(SHEET.table, [130, 29, 30, 35], 2, 0.1)]],
      [crates(2.9), barrels(-3.1), []],
    ],
  },
  {
    id: 'cela',
    name: 'Cela',
    about: 'Jaula de ferro com palha, ossos ou tocha.',
    w: 4,
    where: 'tema',
    slots: [[[c('cage', 0)]], [hay(1.9, 0), [c('bones', 1.6, 0.2)], [c('torch', 1.5, 0, FIRE)]]],
  },
];

export const KIT_SHEETS: string[] = [
  PLANTS,
  TREES_AUTUMN,
  SHEET.camp,
  SHEET.hay,
  SHEET.crate,
  SHEET.barrel,
  SHEET.rocks,
  SHEET.fountain,
  SHEET.flowers,
  SHEET.cart,
  SHEET.tilled,
  SHEET.fence,
  SHEET.mushrooms,
  SHEET.fireplace,
  SHEET.table,
  SHEET.chest,
  SHEET.kitchen,
  SHEET.shelf,
  SHEET.country,
];

export const kit = (id: string): Kit => {
  const found = KITS.find((k) => k.id === id);
  if (!found) throw new Error(`kit desconhecido: ${id}`);
  return found;
};

/** Places a kit on a point (middle of its base, in tiles), picking one option per slot. */
export function placeKit(p: MapPainter, k: Kit, x: number, y: number): void {
  for (const slot of k.slots) {
    for (const piece of pick(p.random, slot)) {
      const px = x + piece.dx;
      const py = y + piece.dy;
      if (piece.g) piece.g(p, px, py);
      if (piece.s) p.stand(piece.s[0], piece.s[1], px, py);
      if (piece.c) p.custom(px, py, CUSTOM[piece.c]);
      if (piece.glow) p.light(px, py - 0.6, piece.glow[0], piece.glow[1]);
    }
  }
}
