import type { Rect } from '../pages/mapas-motor';
import { BARREL_A, BARREL_B, CRATES, SHEET } from '../pages/mapas-pecas';
import type { Kit, Piece } from './kits';
import { PART, type Part } from './moveis';

/**
 * Indoor kits: furniture arranged the way a room is used (chairs facing each other over a rug,
 * a painting above the chest, the anvil in front of the furnace), never dropped alone.
 *
 * `side` says where the kit goes: against the back wall (it may reach about two tiles into the
 * room) or on the near side of the room (it is seen from behind). `high` kits use the wall above
 * them, so nothing else is hung there.
 */

type Glow = NonNullable<Piece['glow']>;
type Extra = { glow?: Glow; z?: number };

const f = (part: Part, dx: number, dy = 0, extra: Extra = {}): Piece => ({
  s: part,
  dx,
  dy,
  ...extra,
});
const FIRE: Glow = [3.2, '255,150,60'];
const CANDLE: Glow = [2.2, '255,210,130'];
const LAMP: Glow = [3, '255,224,150'];
const SCREEN: Glow = [2.4, '150,190,255'];

/** Height of a picture hung on the wall above a kit that stands against it. */
const HUNG = -1.85;

const RUG = {
  warm: ['#9a5a3c', '#5c2f22', '#e0bd7a'],
  red: ['#8f1f2e', '#5a1020', '#d6b04a'],
  cool: ['#5f7f8c', '#3a5360', '#cfe3e8'],
  green: ['#4f7a52', '#2f4f36', '#d8d2a0'],
  grey: ['#6a6d7a', '#40424d', '#c8cad4'],
} as const;

/** A rug drawn in code on the floor, centred on the point: border, inner frame and a diamond. */
const rug = (
  w: number,
  h: number,
  [base, border, accent]: readonly [string, string, string],
  dx = 0,
  dy = 0,
): Piece => ({
  dx,
  dy,
  g: (p, x, y) =>
    p.ground((ctx) => {
      const x0 = Math.round(x * 32 - w / 2);
      const y0 = Math.round(y * 32 - h / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x0 + 2, y0 + 2, w, h);
      ctx.fillStyle = border;
      ctx.fillRect(x0, y0, w, h);
      ctx.fillStyle = base;
      ctx.fillRect(x0 + 3, y0 + 3, w - 6, h - 6);
      ctx.fillStyle = accent;
      ctx.fillRect(x0 + 6, y0 + 6, w - 12, 1);
      ctx.fillRect(x0 + 6, y0 + h - 7, w - 12, 1);
      ctx.fillRect(x0 + 6, y0 + 6, 1, h - 12);
      ctx.fillRect(x0 + w - 7, y0 + 6, 1, h - 12);
      // A diamond in the middle, in steps
      const cx = x0 + Math.floor(w / 2);
      const cy = y0 + Math.floor(h / 2);
      const reach = Math.min(Math.floor(h / 2) - 9, 9);
      for (let k = -reach; k <= reach; k++) {
        const half = (reach - Math.abs(k)) * 2;
        ctx.fillRect(cx - half, cy + k, half * 2, 1);
      }
      ctx.fillStyle = base;
      ctx.fillRect(cx - 2, cy - 1, 4, 2);
      // Tassels on the short sides
      ctx.fillStyle = accent;
      for (let j = 2; j < h - 2; j += 4) {
        ctx.fillRect(x0 - 2, y0 + j, 2, 2);
        ctx.fillRect(x0 + w, y0 + j, 2, 2);
      }
    }),
});

/** A picture of a sheet laid flat on the floor (a ready-made rug or a floor emblem). */
const floor = (part: Part, dx = 0, dy = 0): Piece => ({
  dx,
  dy,
  g: (p, x, y) => p.flat(part[0], part[1], x - part[1][2] / 64, y - part[1][3] / 64),
});

const barrels = (dx: number, dy = 0): Piece[] => [
  { s: [SHEET.barrel, BARREL_A], dx, dy },
  { s: [SHEET.barrel, BARREL_B], dx: dx + 0.8, dy: dy + 0.2 },
];
const crates = (dx: number, dy = 0): Piece[] => [
  { s: [SHEET.crate, CRATES[0] as Rect], dx, dy },
  { s: [SHEET.crate, CRATES[1] as Rect], dx: dx + 0.7, dy: dy + 0.2 },
];

/** A candle standing on a piece of furniture `up` tiles high. */
const candle = (dx: number, dy: number, up: number): Piece =>
  f(PART.candle, dx, dy - up, { glow: CANDLE, z: up + 0.1 });
/** Something small standing on a piece of furniture `up` tiles high. */
const on = (part: Part, dx: number, dy: number, up: number): Piece =>
  f(part, dx, dy - up, { z: up + 0.1 });

type Metal = 'copper' | 'gold' | 'silver' | 'tin';
const ORE_GLOW: Record<Metal | 'iron', string> = {
  copper: '255,150,90',
  gold: '255,214,90',
  silver: '200,224,255',
  tin: '170,235,220',
  iron: '255,130,80',
};
/** A seam of one metal: rocks of two sizes, a vein and loose pieces, glowing at night. */
const seam = (m: Metal): Piece[] => [
  f(PART[`${m}RockA`], -0.3, 0, { glow: [2, ORE_GLOW[m]] }),
  f(PART[`${m}Vein`], 0.8, 0.25),
  f(PART[`${m}RockD`], -1.3, 0.3),
  f(PART[`${m}Crystal`], 0.2, 0.75),
  f(PART[`${m}Nugget`], -0.8, 0.8),
];

export const INDOOR_KITS: Kit[] = [
  // --- House (rustic) ---
  {
    id: 'lareira',
    name: 'Canto da lareira',
    about: 'Lareira acesa com um tapete na frente e duas cadeiras viradas uma para a outra.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f([SHEET.fireplace, [0, 13, 95, 75]], 0, 0, { glow: FIRE })]],
      [[rug(96, 44, RUG.warm, 0, 1.2)], [rug(96, 44, RUG.green, 0, 1.2)]],
      [
        [f(PART.chairLightRight, -2, 1.7), f(PART.chairLightLeft, 2, 1.7)],
        [f(PART.chairDarkRight, -2, 1.7), f(PART.chairDarkLeft, 2, 1.7)],
      ],
      [[f(PART.coalTiny, 2.1, 0.15)], [f(PART.jar, -2, 0.1)], []],
    ],
  },
  {
    id: 'bau',
    name: 'Baú',
    about: 'Um baú encostado na parede, com quadro em cima, tapete e duas cadeiras em volta.',
    w: 5,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.chest, 0, 0)], [f(PART.chestB, 0, 0)]],
      [
        [f(PART.landscape0, 0, HUNG)],
        [f(PART.landscape2, 0, HUNG)],
        [f(PART.still0, 0, HUNG)],
        [f(PART.landscape3, 0, HUNG)],
      ],
      [[rug(88, 40, RUG.red, 0, 1.25)], [rug(88, 40, RUG.warm, 0, 1.25)]],
      [
        [f(PART.chairLightRight, -1.9, 1.7), f(PART.chairLightLeft, 1.9, 1.7)],
        [f(PART.chairOliveRight, -1.9, 1.7), f(PART.chairOliveLeft, 1.9, 1.7)],
      ],
      [[f(PART.vaseTall, 1.3, 0.05)], [f(PART.vaseBlue, -1.3, 0.05)], []],
    ],
  },
  {
    id: 'estante',
    name: 'Estantes',
    about: 'Estantes de livros e de louça lado a lado, com poltrona de leitura e luminária.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [
        [f(PART.shelfBooksA, -1, 0), f(PART.shelfBooksB, 0, 0), f(PART.shelfDishes, 1, 0)],
        [f(PART.shelfBooksB, -1, 0), f(PART.shelfBooksC, 0, 0), f(PART.shelfBooksA, 1, 0)],
        [f(PART.glassA, -1, 0), f(PART.shelfBooksA, 0, 0), f(PART.glassB, 1, 0)],
      ],
      [
        [f(PART.chairLightFront, 2.1, 0.5), f(PART.lampFloor, -2.1, 0.2, { glow: LAMP })],
        [f(PART.chairDarkFront, -2.1, 0.5), f(PART.lampFloor, 2.1, 0.2, { glow: LAMP })],
        [f(PART.chairLightFront, 2.1, 0.5), f(PART.chest, -2.2, 0.3)],
      ],
    ],
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    about: 'Fogão e bancada com o armário de louça ao lado e mantimentos.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[{ s: [SHEET.kitchen, [0, 0, 64, 128]], dx: -0.4, dy: 0.2 }]],
      [[f(PART.shelfDishes, 1.4, 0)], [f(PART.cupboardA, 1.4, 0)], [f(PART.glassC, 1.4, 0)]],
      [barrels(-2.3, 0.2), crates(-2.3, 0.2), [f(PART.jar, -2, 0.2), f(PART.vaseTall, -2.7, 0.3)]],
      [[f(PART.stoolMid, 2.5, 0.6)], []],
    ],
  },
  {
    id: 'quarto',
    name: 'Quarto',
    about: 'Cama com mesa de cabeceira e vela, tapete ao lado e um quadro na parede.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[{ s: [SHEET.country, [8, 12, 48, 88]], dx: -0.6, dy: 0.9 }]],
      [
        [f(PART.endLight, 0.75, 0), candle(0.75, 0, 0.75)],
        [f(PART.endDark, 0.75, 0), candle(0.75, 0, 0.75)],
      ],
      [[rug(52, 34, RUG.cool, 1.1, 1.4)], [rug(52, 34, RUG.red, 1.1, 1.4)]],
      [
        [f(PART.still3, 0.9, HUNG)],
        [f(PART.landscape1, 0.9, HUNG)],
        [f(PART.mirrorGold, 0.9, HUNG)],
      ],
      [
        [f(PART.chest, 2.3, 0.2)],
        [f(PART.dresserLight, 2.5, 0.1)],
        [f(PART.chairLightFront, 2.2, 0.4)],
      ],
    ],
  },
  {
    id: 'relogio',
    name: 'Relógio e cômoda',
    about: 'Relógio de pêndulo ao lado de uma cômoda com vaso e retratos pequenos em cima.',
    w: 5,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.clock, -1.4, 0)]],
      [
        [f(PART.dresserLight, 0.6, 0), on(PART.vaseBlue, 0.6, 0, 1.15)],
        [f(PART.dresserMid, 0.6, 0), on(PART.vaseTeal, 0.6, 0, 1.15)],
        [f(PART.dresserDark, 0.6, 0), candle(0.2, 0, 1.2), candle(1, 0, 1.2)],
      ],
      [
        [f(PART.portraitSmall0, 0.1, -2.3), f(PART.portraitSmall1, 1.1, -2.3)],
        [f(PART.portraitSmall2, 0.1, -2.3), f(PART.portraitSmall3, 1.1, -2.3)],
      ],
      [[f(PART.chairLightFront, 2.2, 0.4)], [f(PART.fernVase, 2.2, 0.2)], []],
    ],
  },
  {
    id: 'jantar',
    name: 'Mesa de jantar',
    about: 'Mesa comprida com cadeiras dos dois lados e vela no meio.',
    w: 5,
    where: 'dentro',
    side: 'near',
    slots: [
      [
        [
          f(PART.chairLightFront, -0.75, -1.2),
          f(PART.chairLightFront, 0.75, -1.2),
          f(PART.tableMid, 0, -0.2),
          f(PART.chairLightBack, -0.75, 0.55),
          f(PART.chairLightBack, 0.75, 0.55),
        ],
        [
          f(PART.chairDarkFront, -0.75, -1.2),
          f(PART.chairDarkFront, 0.75, -1.2),
          f(PART.tableDark, 0, -0.2),
          f(PART.chairDarkBack, -0.75, 0.55),
          f(PART.chairDarkBack, 0.75, 0.55),
        ],
        [
          f(PART.stoolLight, -0.8, -1.25),
          f(PART.stoolLight, 0.8, -1.25),
          f(PART.tableLight, 0, -0.2),
          f(PART.chairLightLeft, 2, -0.3),
          f(PART.chairLightRight, -2, -0.3),
        ],
      ],
      [[candle(0, -0.2, 1.1)], [candle(-0.6, -0.2, 1.1), candle(0.6, -0.2, 1.1)]],
    ],
  },
  {
    id: 'leitura',
    name: 'Canto de conversa',
    about: 'Mesinha redonda sobre um tapete, com duas cadeiras de frente uma para a outra.',
    w: 5,
    where: 'dentro',
    side: 'near',
    slots: [
      [[rug(104, 46, RUG.warm, 0, -0.75)], [rug(104, 46, RUG.green, 0, -0.75)]],
      [[f(PART.roundTable, 0, -0.4), candle(0, -0.4, 0.9)], [f(PART.roundTableB, 0, -0.4)]],
      [
        [f(PART.chairLightRight, -1.3, -0.35), f(PART.chairLightLeft, 1.3, -0.35)],
        [f(PART.chairOliveRight, -1.3, -0.35), f(PART.chairOliveLeft, 1.3, -0.35)],
      ],
      [[f(PART.fernBox, 2.4, 0)], [f(PART.lampFloor, 2.3, -0.1, { glow: LAMP })], []],
    ],
  },
  {
    id: 'balcao',
    name: 'Balcão',
    about: 'Balcão de atendimento com bancos na frente e mercadoria atrás.',
    w: 6,
    where: 'dentro',
    side: 'near',
    slots: [
      [[f(PART.tableDark, 0, -0.5)], [f(PART.tableMid, 0, -0.5)]],
      [
        [f(PART.stoolDark, -0.9, 0.5), f(PART.stoolDark, 0.9, 0.5)],
        [f(PART.stoolMid, -1, 0.5), f(PART.stoolMid, 0, 0.6), f(PART.stoolMid, 1, 0.5)],
      ],
      [crates(2.2, -0.6), barrels(2.2, -0.6)],
      [barrels(-3, -0.6), [f(PART.jar, -2.3, -0.5)], []],
    ],
  },

  // --- Modern house ---
  {
    id: 'sala',
    name: 'Sala de TV',
    about: 'TV na parede sobre um móvel baixo, tapete e o sofá de frente para ela.',
    w: 7,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.dresserWhite, 0, 0)], [f(PART.dresserGrey, 0, 0)]],
      [[f(PART.tv, 0, -1.6, { glow: SCREEN })]],
      [[rug(120, 44, RUG.cool, 0, 1.15)], [rug(120, 44, RUG.grey, 0, 1.15)]],
      [
        [f(PART.sofaBlueBack, 0, 2.55)],
        [f(PART.sofaDarkBack, 0, 2.55)],
        [f(PART.sofaGreenBack, 0, 2.55)],
      ],
      [[f(PART.fernVase, -2.6, 0.1)], [f(PART.treeVase, -2.6, 0.1)]],
      [[f(PART.lampModern, 2.5, 0.1, { glow: LAMP })], [f(PART.lampArc, 2.6, 0.1, { glow: LAMP })]],
    ],
  },
  {
    id: 'cozinha-moderna',
    name: 'Cozinha moderna',
    about: 'Geladeira, fogão e bancada em linha, com uma mesinha e bancos.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.fridge, -1.6, 0), f(PART.ovenModern, -0.55, 0)]],
      [
        [f(PART.dresserWhite, 1, 0), on(PART.jar, 0.6, 0, 1.15), on(PART.tableLamp, 1.5, 0, 1.15)],
        [f(PART.dresserGrey, 1, 0), on(PART.jar, 1.4, 0, 1.15)],
      ],
      [[f(PART.poster3, 1, -2.3)], [f(PART.still1, 1, -2.2)]],
      [
        [f(PART.roundTableB, 0, 1.7), f(PART.stoolLight, -1.1, 1.8), f(PART.stoolLight, 1.1, 1.8)],
        [f(PART.endWhite, 2.6, 0.1)],
      ],
    ],
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    about: 'Mesa de trabalho com cadeira, luminária e um quadro em cima.',
    w: 5,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.deskDark, 0, 0)], [f(PART.deskWhite, 0, 0)], [f(PART.deskBrown, 0, 0)]],
      [[f(PART.officeChairBack, 0.3, 1.1)]],
      [[f(PART.abstract2, 0, HUNG)], [f(PART.abstract3, 0, HUNG)], [f(PART.poster0, 0, HUNG)]],
      [[f(PART.lampModern, 1.5, 0, { glow: LAMP })], [f(PART.lampBlue, 1.5, 0, { glow: LAMP })]],
      [[f(PART.shelfLowA, -1.6, 0)], [f(PART.shelfLowB, -1.6, 0)], [f(PART.fernVase, -1.6, 0.1)]],
    ],
  },
  {
    id: 'penteadeira',
    name: 'Espelho e cômoda',
    about: 'Cômoda com espelho iluminado em cima e um banco na frente.',
    w: 4,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.dresserGrey, 0, 0)], [f(PART.dresserWhite, 0, 0)]],
      [
        [f(PART.mirrorLights, 0, -1.4, { glow: [1.8, '255,240,200'] })],
        [f(PART.mirrorOval, 0, -1.6)],
      ],
      [[f(PART.chairWhiteStool, 0, 0.9)], [f(PART.chairWhiteBack, 0, 1)]],
      [[f(PART.bigVase, 1.6, 0.1)], [f(PART.treeBox, -1.6, 0.1)]],
    ],
  },
  {
    id: 'estante-moderna',
    name: 'Estante de livros',
    about: 'Estante alta com armário de vidro e uma poltrona ao lado.',
    w: 5,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [
        [f(PART.shelfBooksC, -1, 0), f(PART.glassB, 0, 0), f(PART.shelfBooksA, 1, 0)],
        [f(PART.glassA, -0.5, 0), f(PART.shelfBooksC, 0.5, 0)],
      ],
      [[f(PART.loveBlue, 2.4, 0.6)], [f(PART.loveRed, 2.4, 0.6)], [f(PART.loveGreen, 2.4, 0.6)]],
    ],
  },
  {
    id: 'estar',
    name: 'Sala de estar',
    about: 'Sofá visto de trás, de frente para um tapete e uma mesinha, com abajur ao lado.',
    w: 6,
    where: 'dentro',
    side: 'near',
    slots: [
      [[rug(112, 44, RUG.grey, 0, -1.25)], [rug(112, 44, RUG.cool, 0, -1.25)]],
      [[f(PART.roundTableB, 0, -0.9)], [f(PART.endWhite, 0, -0.9)]],
      [
        [f(PART.sofaBrownBack, 0, 0.35)],
        [f(PART.sofaOrangeBack, 0, 0.35)],
        [f(PART.sofaBlueBack, 0, 0.35)],
      ],
      [
        [f(PART.endGrey, 2.2, 0.1), f(PART.tableLamp, 2.2, -0.6, { glow: LAMP, z: 0.8 })],
        [f(PART.lampFloor, 2.2, 0.1, { glow: LAMP })],
      ],
      [[f(PART.treeVase, -2.3, 0.2)], [f(PART.fernBox, -2.3, 0.2)]],
    ],
  },
  {
    id: 'plantas',
    name: 'Canto das plantas',
    about: 'Vasos e floreiras de tamanhos diferentes agrupados.',
    w: 4,
    where: 'dentro',
    slots: [
      [
        [f(PART.treeBox, -0.9, 0), f(PART.fernVase, 0.1, 0.25), f(PART.treeVase, 1, 0)],
        [f(PART.fernBox, -0.8, 0), f(PART.bigVase, 0.2, 0.3), f(PART.treeBox, 1, 0)],
      ],
    ],
  },

  // --- Castle hall ---
  {
    id: 'banquete',
    name: 'Mesa do banquete',
    about: 'Mesa escura com cadeiras dos dois lados e candelabros nas pontas.',
    w: 6,
    where: 'dentro',
    side: 'near',
    slots: [
      [
        [
          f(PART.chairDarkFront, -0.75, -1.2),
          f(PART.chairDarkFront, 0.75, -1.2),
          f(PART.tableDark, 0, -0.2),
          f(PART.chairDarkBack, -0.75, 0.55),
          f(PART.chairDarkBack, 0.75, 0.55),
        ],
      ],
      [[candle(-0.6, -0.2, 1.1), candle(0.6, -0.2, 1.1)]],
      [
        [
          f(PART.candelabra, -2.3, -0.1, { glow: CANDLE }),
          f(PART.candelabra, 2.3, -0.1, { glow: CANDLE }),
        ],
      ],
    ],
  },
  {
    id: 'armaria',
    name: 'Armaria',
    about: 'Cavalete de espadas e bancada do ferreiro, com a placa da espada na parede.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.rackSwords, -1.2, 0.4)], [f(PART.rackTongs, -1.2, 0.4)]],
      [
        [f(PART.benchHammer, 1.1, 0.2)],
        [f(PART.benchShoes, 1.1, 0.2)],
        [f(PART.benchTools, 1.1, 0.2)],
      ],
      [[f(PART.signSword, 0, -2.2)]],
      [[f(PART.anvil, 0.2, 1.5)], barrels(2.4, 0.4), []],
    ],
  },
  {
    id: 'galeria',
    name: 'Galeria de retratos',
    about: 'Três retratos da família real sobre um aparador com candelabros.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [
        [f(PART.portrait0, -1.2, HUNG), f(PART.portrait1, 0, HUNG), f(PART.portrait2, 1.2, HUNG)],
        [f(PART.portrait3, -1.2, HUNG), f(PART.portrait4, 0, HUNG), f(PART.portrait5, 1.2, HUNG)],
        [f(PART.portrait1, -0.7, HUNG), f(PART.portrait5, 0.7, HUNG)],
      ],
      [
        [f(PART.dresserDark, 0, 0), on(PART.vaseTall, 0, 0, 1.15)],
        [f(PART.longTable, 0, 0.1), candle(0, 0.1, 0.8)],
      ],
      [
        [
          f(PART.candelabra, -2.2, 0.2, { glow: CANDLE }),
          f(PART.candelabra, 2.2, 0.2, { glow: CANDLE }),
        ],
        [f(PART.vaseBlue, -1.9, 0.1), f(PART.vaseBlue, 1.9, 0.1)],
      ],
    ],
  },
  {
    id: 'taca',
    name: 'Taça',
    about: 'A taça num pedestal sobre um tapete, guardada por vasos ou candelabros.',
    w: 4,
    where: 'dentro',
    side: 'near',
    slots: [
      [[rug(72, 40, RUG.red, 0, -0.5)]],
      [[f(PART.cup, 0, -0.2)]],
      [
        [f(PART.vaseTall, -1.5, -0.2), f(PART.vaseTall, 1.5, -0.2)],
        [
          f(PART.candelabra, -1.5, -0.1, { glow: CANDLE }),
          f(PART.candelabra, 1.5, -0.1, { glow: CANDLE }),
        ],
      ],
    ],
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    about: 'Parede de estantes com mesa de leitura, cadeira e vela.',
    w: 7,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [
        [-1.5, -0.5, 0.5, 1.5].map((dx, i) =>
          f(
            [PART.shelfBooksA, PART.shelfBooksB, PART.shelfBooksC, PART.shelfBooksA][i] as Part,
            dx,
          ),
        ),
      ],
      [
        [f(PART.roundTable, 0, 1.6), candle(0, 1.6, 0.9), f(PART.chairDarkRight, -1.2, 1.7)],
        [f(PART.longTable, 0, 1.6), candle(0.5, 1.6, 0.8), f(PART.chairDarkFront, 0, 0.9)],
      ],
      [[f(PART.candelabra, 2.6, 0.2, { glow: CANDLE })], [f(PART.vaseTall, 2.5, 0.1)]],
    ],
  },
  {
    id: 'conselho',
    name: 'Cadeiras do conselho',
    about: 'Três cadeiras altas lado a lado sobre um tapete, com candelabros.',
    w: 6,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[rug(128, 40, RUG.red, 0, 0.5)]],
      [
        [f(PART.throneRed, -1.2, 0.2), f(PART.throneGold, 0, 0), f(PART.throneBlue, 1.2, 0.2)],
        [f(PART.thronePurple, -1.2, 0.2), f(PART.throneGold, 0, 0), f(PART.thronePurple, 1.2, 0.2)],
      ],
      [
        [
          f(PART.candelabra, -2.4, 0.2, { glow: CANDLE }),
          f(PART.candelabra, 2.4, 0.2, { glow: CANDLE }),
        ],
      ],
    ],
  },
  {
    id: 'emblema',
    name: 'Emblema do lobo',
    about: 'O emblema do reino no chão, entre duas colunas ou candelabros.',
    w: 5,
    where: 'dentro',
    side: 'near',
    slots: [
      [[floor(PART.wolfGold, 0, -1.1)], [floor(PART.wolfSilver, 0, -1.1)]],
      [
        [f(PART.vaseTall, -1.8, -0.4), f(PART.vaseTall, 1.8, -0.4)],
        [
          f(PART.candelabra, -1.8, -0.2, { glow: CANDLE }),
          f(PART.candelabra, 1.8, -0.2, { glow: CANDLE }),
        ],
      ],
    ],
  },

  // --- Dungeon ---
  {
    id: 'ossario',
    name: 'Ossário',
    about: 'Esqueleto acorrentado na parede, com crânios e ossos no chão.',
    w: 4,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.skeleton, 0, -0.3)]],
      [[f(PART.chainA, -0.9, -1.6), f(PART.chainB, 0.9, -1.6)]],
      [
        [f(PART.skulls, 1.2, 0.4), f(PART.bonePile, -1.2, 0.5)],
        [f(PART.bonePile, 1.2, 0.5), f(PART.skull, -1.1, 0.4)],
      ],
    ],
  },
  {
    id: 'caldeirao',
    name: 'Caldeirão',
    about: 'Caldeirão no fogo com a mesa dos ingredientes e frascos.',
    w: 5,
    where: 'dentro',
    slots: [
      [[f(PART.cauldronLit, 0, 0, { glow: [2.6, '140,255,120'] })]],
      [[f(PART.roundTableB, 1.5, 0), on(PART.jar, 1.5, 0, 0.8)]],
      [
        [f(PART.vaseTall, -1.3, 0), f(PART.jar, -2, 0.2)],
        crates(-2, 0),
        [f(PART.skull, -1.3, 0.2)],
      ],
    ],
  },

  {
    id: 'deposito',
    name: 'Depósito',
    about: 'Caixas e barris empilhados, com potes ao lado.',
    w: 4,
    where: 'dentro',
    slots: [
      [crates(-0.6), barrels(-0.6), [...crates(-1.1), ...barrels(0.4)]],
      [
        [f(PART.jar, 1.7, 0.1)],
        [f(PART.jar, 1.6, 0.1), f(PART.vaseTall, 2.2, 0.3)],
        barrels(1.6, 0.1),
      ],
    ],
  },

  // --- Cave, mine and forge ---
  {
    id: 'minerio',
    name: 'Veio de minério',
    about: 'Rochas com cobre, ouro, prata ou estanho, que brilham no escuro.',
    w: 4,
    where: 'dentro',
    slots: [[seam('copper'), seam('gold'), seam('silver'), seam('tin')]],
  },
  {
    id: 'ferro',
    name: 'Veio de ferro',
    about: 'Rochas de ferro com pedras soltas e uma pilha de carvão.',
    w: 4,
    where: 'dentro',
    slots: [
      [
        [
          f(PART.ironRockA, -0.3, 0, { glow: [1.5, ORE_GLOW.iron] }),
          f(PART.ironRockC, 0.8, 0.3, { glow: [1.5, ORE_GLOW.iron] }),
          f(PART.ironChunk, 0.1, 0.8),
        ],
        [
          f(PART.ironRockB, 0.3, 0, { glow: [1.5, ORE_GLOW.iron] }),
          f(PART.ironRockD, -0.8, 0.3, { glow: [1.5, ORE_GLOW.iron] }),
          f(PART.ironChunk, 0.9, 0.7),
        ],
      ],
      [[f(PART.stoneA, -1.5, 0.4)], [f(PART.stoneC, 1.7, 0.2)], [f(PART.coalSmall, -1.6, 0.4)]],
    ],
  },
  {
    id: 'carvao',
    name: 'Carvão',
    about: 'Rochas de carvão com um monte já tirado e pedras em volta.',
    w: 5,
    where: 'dentro',
    slots: [
      [[f(PART.coalRockA, -0.9, 0), f(PART.coalRockB, 0, 0.2)], [f(PART.coalRockC, -0.6, 0.1)]],
      [[f(PART.coalMid, 1.5, 0.3)], [f(PART.coalBig, 1.6, 0.3)]],
      [[f(PART.coalLump, 0.2, 0.8), f(PART.stoneB, -1.9, 0.4)], [f(PART.stoneD, -1.9, 0.3)]],
    ],
  },
  {
    id: 'forja',
    name: 'Forja',
    about: 'Fornalha acesa com o fole de um lado, a bigorna na frente e a bancada de ferramentas.',
    w: 7,
    where: 'dentro',
    side: 'wall',
    high: true,
    slots: [
      [[f(PART.furnaceB, 0, 0)], [f(PART.furnaceA, 0, 0)]],
      [[f(PART.furnaceFire, -0.02, -0.56, { glow: FIRE, z: 0.7 })]],
      [[f(PART.bellows, -1.8, 0.1)]],
      [[f(PART.anvil, 0.1, 1.4)], [f(PART.anvilBig, 0.1, 1.4)]],
      [[f(PART.benchTools, 2.3, 0.3)], [f(PART.benchHammer, 2.3, 0.3)]],
      [[f(PART.toolRackA, 2.3, -2.2)], [f(PART.toolRackB, 2.3, -2.3)]],
      [[f(PART.coalMid, -2.6, 0.9)], [f(PART.coalSmall, -2.6, 0.8)]],
    ],
  },
  {
    id: 'fundicao',
    name: 'Fundição',
    about: 'Forno de fundir aceso, com as barras prontas de um lado e o carvão do outro.',
    w: 5,
    where: 'dentro',
    side: 'wall',
    slots: [
      [[f(PART.smelterOn, 0, 0, { glow: [3, '255,120,40'] })]],
      [
        [f(PART.ingotGold, 1.5, 0.2), f(PART.ingotSteel, 2.1, 0.4), f(PART.ingotGold, 1.8, 0.7)],
        [f(PART.ingotSteel, 1.5, 0.2), f(PART.ingotTeal, 2.1, 0.4), f(PART.ingotRose, 1.8, 0.7)],
        [f(PART.copperIngot, 1.5, 0.2), f(PART.silverIngot, 2.1, 0.4), f(PART.goldIngot, 1.8, 0.7)],
      ],
      [[f(PART.coalSmall, -1.6, 0.3)], [f(PART.coalMid, -1.8, 0.4)]],
    ],
  },
  {
    id: 'amolador',
    name: 'Oficina',
    about: 'Pedra de amolar com a bancada e o cavalete de ferramentas.',
    w: 6,
    where: 'dentro',
    side: 'near',
    slots: [
      [[f(PART.grindstone, 0, -0.1)]],
      [[f(PART.benchShoes, 1.9, -0.1)], [f(PART.benchHammer, 1.9, -0.1)]],
      [[f(PART.rackTongs, -2, 0)], [f(PART.rackSwords, -2, 0)]],
      [[f(PART.stoolDark, -0.2, 0.7)], []],
    ],
  },
];
