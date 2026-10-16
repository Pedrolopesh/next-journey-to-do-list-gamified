import { flame, rect } from './draw';
import {
  disc,
  flagLine,
  grown,
  type Look,
  type PropKit,
  propLayers,
  roamer,
  stand,
  stander,
  walker,
} from './level-kit';
import type { ExtraCharacter, LevelInfo, SceneEnv } from './types';

export const CASTLE_LEVEL_COUNT = 5;
export const CASTLE_GROUND = 178;
const OUT = '#14161c';
const GOLD = '#e2b02e';
const GOLD_DARK = '#a8791a';
const GOLD_LIGHT = '#ffe07a';

export const CASTLE_LEVELS: LevelInfo[] = [
  {
    name: 'Salão do trono',
    blurb:
      'O salão de pedra no começo da jornada: trono, tapete real, armaduras, candelabros e estandartes.',
    changes: [
      'Trono no tablado, tapete real e baú.',
      'Estandartes, tochas, armaduras e candelabros; sem ninguém por perto.',
    ],
  },
  {
    name: 'Guarda real',
    blurb:
      'O castelo se organiza: guardas flanqueiam o trono, braseiros acesos nas laterais e uma sentinela em ronda.',
    changes: [
      'Dois guardas no tablado e braseiros nos cantos da frente.',
      'Uma sentinela caminhando pelo salão.',
      'Jornada: guardas de cada lado do tapete, braseiros e escudos na parede.',
    ],
  },
  {
    name: 'Banquete',
    blurb:
      'Noite de festa: lustres de velas, mesas fartas com convidados e um bobo da corte passando entre eles.',
    changes: [
      'Dois lustres de velas no alto e duas mesas com comida e taças.',
      'Convidados em volta das mesas e um bobo da corte caminhando.',
      'Jornada: uma mesa comprida que passa de vez em quando, com convidados.',
    ],
  },
  {
    name: 'Torre do mago',
    blurb:
      'O salão vira laboratório arcano: estantes de livros, esferas mágicas flutuando, caldeirão e bola de cristal.',
    changes: [
      'Estantes de livros no lugar das armaduras, esferas flutuantes e luz mágica.',
      'Caldeirão borbulhando, bola de cristal, um mago e seu aprendiz.',
      'Jornada: estantes na parede, caldeirão e bola de cristal passando, mago e aprendiz.',
    ],
  },
  {
    name: 'Coroação',
    blurb:
      'O grande dia: bandeirinhas entre os estandartes, almofada com a coroa, vasos de flores, confete caindo e a corte em festa.',
    changes: [
      'Bandeirinhas ligam os estandartes e confete cai pelo salão.',
      'Almofada com a coroa, vasos de flores e a corte reunida dos dois lados.',
      'Jornada: bandeirinhas nas paredes, confete, vasos e gente comemorando.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Gente da corte
// ---------------------------------------------------------------------------------------------

const GUARD: Look[] = [
  {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-buzzcut',
    hairColor: 'dark_brown',
    torso: 'torso-longsleeve-2',
    torsoColor: 'bluegray',
    legs: 'legs-pants',
    legsColor: 'slate',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'female',
    skin: 'bronze',
    hair: 'hair-bangs-bun',
    hairColor: 'black',
    torso: 'torso-longsleeve-2',
    torsoColor: 'bluegray',
    legs: 'legs-pants',
    legsColor: 'slate',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
];
const NOBLE: Look[] = [
  {
    bodyType: 'female',
    skin: 'light',
    hair: 'hair-half-up',
    hairColor: 'blonde',
    torso: 'torso-cardigan',
    torsoColor: 'purple',
    legs: 'legs-pants',
    legsColor: 'maroon',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'male',
    skin: 'brown',
    hair: 'hair-curly-short',
    hairColor: 'black',
    torso: 'torso-longsleeve-2',
    torsoColor: 'maroon',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'female',
    skin: 'amber',
    hair: 'hair-bob',
    hairColor: 'chestnut',
    torso: 'torso-cardigan',
    torsoColor: 'teal',
    legs: 'legs-pants',
    legsColor: 'white',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'male',
    skin: 'olive',
    hair: 'hair-buzzcut',
    hairColor: 'gray',
    torso: 'torso-cardigan',
    torsoColor: 'navy',
    legs: 'legs-pants',
    legsColor: 'tan',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'female',
    skin: 'taupe',
    hair: 'hair-natural',
    hairColor: 'raven',
    torso: 'torso-sleeveless-2',
    torsoColor: 'rose',
    legs: 'legs-pants',
    legsColor: 'lavender',
    feet: 'feet-basic-shoes',
  },
];
const JESTER: Look = {
  bodyType: 'male',
  skin: 'light',
  hair: 'hair-curly-short',
  hairColor: 'orange',
  torso: 'torso-tshirt',
  torsoColor: 'red',
  legs: 'legs-pants',
  legsColor: 'yellow',
  feet: 'feet-sandals',
};
const WIZARD: Look = {
  bodyType: 'male',
  skin: 'light',
  hair: 'hair-buzzcut',
  hairColor: 'white',
  torso: 'torso-cardigan',
  torsoColor: 'purple',
  legs: 'legs-pants',
  legsColor: 'purple',
  feet: 'feet-basic-shoes',
};
const APPRENTICE: Look = {
  bodyType: 'female',
  skin: 'brown',
  hair: 'hair-bangs-bun',
  hairColor: 'black',
  torso: 'torso-longsleeve-2',
  torsoColor: 'lavender',
  legs: 'legs-pants',
  legsColor: 'navy',
  feet: 'feet-basic-shoes',
};
const guard = (i: number): Look => GUARD[i % GUARD.length] ?? {};
const noble = (i: number): Look => NOBLE[i % NOBLE.length] ?? {};

// ---------------------------------------------------------------------------------------------
// Objetos
// ---------------------------------------------------------------------------------------------

type Prop =
  | { k: 'brazier'; x: number; y: number; f?: number; p?: number }
  | { k: 'shield'; x: number; y: number; f?: number; p?: number }
  | { k: 'chandelier'; x: number; y: number; f?: number; p?: number }
  | { k: 'table'; x: number; y: number; w: number; f?: number; p?: number }
  | { k: 'shelf'; x: number; y: number; f?: number; p?: number }
  | { k: 'orb'; x: number; y: number; hue: number; f?: number; p?: number }
  | { k: 'cauldron'; x: number; y: number; f?: number; p?: number }
  | { k: 'crystal'; x: number; y: number; f?: number; p?: number }
  | { k: 'vase'; x: number; y: number; f?: number; p?: number }
  | { k: 'cushion'; x: number; y: number; f?: number; p?: number }
  | { k: 'garland'; x: number; y: number; len: number; drop: number; f?: number; p?: number }
  | { k: 'confetti'; x: number; y: number; f?: number; p?: number };

function brazier(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 8, y + 1, 17, 3, 'rgba(0,0,0,0.25)');
  for (const dx of [-6, 0, 6]) rect(env, x + dx - 1, y - 14, 3, 15, OUT);
  rect(env, x - 7, y - 20, 15, 7, OUT);
  rect(env, x - 6, y - 19, 13, 5, '#5a5f6b');
  rect(env, x - 6, y - 19, 13, 1, '#8d93a1');
  rect(env, x - 5, y - 23, 11, 4, '#6b4119');
  flame(env, x, y - 22, 2);
  flame(env, x - 4, y - 21, 1);
}

/** Escudo na parede com duas espadas cruzadas atrás. */
function shield(env: SceneEnv, x: number, y: number): void {
  for (let k = -12; k <= 12; k++) {
    rect(env, x + k, y + Math.round(k * 0.7), 2, 2, OUT);
    rect(env, x + k, y - Math.round(k * 0.7), 2, 2, OUT);
  }
  for (let k = -11; k <= 11; k++) {
    rect(env, x + k, y + Math.round(k * 0.7), 1, 1, '#dbe2ee');
    rect(env, x + k, y - Math.round(k * 0.7), 1, 1, '#dbe2ee');
  }
  rect(env, x - 9, y - 12, 19, 24, OUT);
  rect(env, x - 8, y - 11, 17, 21, '#2f5fb0');
  rect(env, x - 8, y - 11, 8, 21, '#2a55a0');
  rect(env, x - 1, y - 11, 3, 21, GOLD);
  rect(env, x - 8, y - 3, 17, 3, GOLD);
  rect(env, x - 7, y + 10, 15, 2, OUT);
  rect(env, x - 4, y + 12, 9, 2, OUT);
}

function chandelier(env: SceneEnv, x: number, y: number): void {
  const lit = env.time !== 'afternoon';
  rect(env, x, 0, 1, y - 6, '#3a3d46');
  rect(env, x - 3, y - 7, 7, 4, OUT);
  rect(env, x - 2, y - 6, 5, 2, GOLD);
  rect(env, x - 21, y - 1, 43, 5, OUT);
  rect(env, x - 20, y, 41, 3, GOLD_DARK);
  rect(env, x - 20, y, 41, 1, GOLD_LIGHT);
  for (let i = 0; i < 6; i++) {
    const cx = x - 18 + i * 7;
    rect(env, cx, y - 8, 3, 8, OUT);
    rect(env, cx + 1, y - 7, 1, 7, '#f6f1e4');
    flame(env, cx + 1, y - 9, 1);
  }
  rect(env, x - 1, y + 4, 3, 5, OUT);
  rect(env, x, y + 5, 1, 3, lit ? GOLD_LIGHT : GOLD);
}

/** Mesa comprida de banquete: toalha, comida, taças, velas e pernas. */
function table(env: SceneEnv, x: number, y: number, w: number): void {
  rect(env, x - 2, y + 1, w + 4, 3, 'rgba(0,0,0,0.25)');
  for (const lx of [x + 3, x + w - 6]) {
    rect(env, lx - 1, y - 12, 5, 13, OUT);
    rect(env, lx, y - 11, 3, 11, '#4a2f17');
  }
  rect(env, x - 1, y - 22, w + 2, 13, OUT);
  rect(env, x, y - 21, w, 10, '#f2e6cc');
  rect(env, x, y - 21, w, 2, '#ffffff');
  for (let i = 2; i < w - 2; i += 4) rect(env, x + i, y - 12, 2, 3, '#d9c9a0');
  rect(env, x, y - 15, w, 1, '#a31f2a');
  const goods = ['#e63946', '#ffc93c', '#9a6a34', '#2a9d8f', '#ff7a2e'];
  for (let i = 0; i * 17 + 14 < w; i++) {
    const px = x + 8 + i * 17;
    rect(env, px, y - 25, 9, 4, OUT);
    rect(env, px + 1, y - 24, 7, 2, goods[i % goods.length] ?? '#e63946');
    rect(env, px + 11, y - 28, 3, 7, OUT);
    rect(env, px + 12, y - 27, 1, 5, '#c0c8d6');
  }
  for (const cx of [x + 3, x + w - 6]) {
    rect(env, cx, y - 31, 3, 9, OUT);
    rect(env, cx + 1, y - 30, 1, 8, '#f6f1e4');
    flame(env, cx + 1, y - 32, 1);
  }
}

function shelf(env: SceneEnv, x: number, y: number): void {
  const wood = '#5a3a1c';
  rect(env, x - 19, y - 66, 38, 67, OUT);
  rect(env, x - 18, y - 65, 36, 65, wood);
  rect(env, x - 16, y - 63, 32, 61, '#2a1a0c');
  const colors = ['#a31f2a', '#2f5fb0', '#2a9d8f', '#e2b02e', '#7a3fa0', '#d9d2c0', '#e07b39'];
  for (let row = 0; row < 4; row++) {
    const by = y - 62 + row * 15;
    rect(env, x - 16, by + 13, 32, 2, wood);
    let bx = x - 15;
    for (let i = 0; bx < x + 14; i++) {
      const w = 3 + ((i * 7 + row * 3) % 3);
      const h = 9 + ((i * 5 + row) % 4);
      rect(env, bx, by + 13 - h, w, h, colors[(i + row * 2) % colors.length] ?? '#a31f2a');
      rect(env, bx, by + 13 - h, 1, h, 'rgba(255,255,255,0.25)');
      bx += w + 1;
    }
  }
  rect(env, x - 4, y - 74, 9, 8, OUT);
  disc(env, x, y - 71, 3, '#e8e2cc');
  rect(env, x - 1, y - 72, 1, 1, OUT);
  rect(env, x + 1, y - 72, 1, 1, OUT);
}

const ORB_COLORS: [string, string, [number, number, number]][] = [
  ['#35e0ff', '#c4f6ff', [60, 220, 255]],
  ['#b06bff', '#e7d0ff', [180, 110, 255]],
  ['#6bff9a', '#d0ffe0', [110, 255, 160]],
];

/** Esfera mágica: flutua de leve (fase fixa por esfera, nunca pela posição) e pulsa. */
function orb(env: SceneEnv, x: number, y: number, hue: number): void {
  const [main, shine] = ORB_COLORS[hue % ORB_COLORS.length] ?? ORB_COLORS[0] ?? ['#fff', '#fff'];
  const bob = Math.round(Math.sin(env.t * 0.9 + hue * 2.1) * 2);
  const pulse = Math.sin(env.t * 2 + hue) > 0.2;
  const cy = y + bob;
  if (pulse) disc(env, x, cy, 7, 'rgba(255,255,255,0.12)');
  disc(env, x, cy, 5, OUT);
  disc(env, x, cy, 4, main);
  rect(env, x - 2, cy - 2, 2, 2, shine);
  rect(env, x + 1, cy + 1, 2, 2, 'rgba(0,0,0,0.25)');
}

function cauldron(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 14, y + 1, 29, 4, 'rgba(0,0,0,0.25)');
  flame(env, x - 6, y - 1, 1);
  flame(env, x + 5, y - 1, 1);
  disc(env, x, y - 10, 12, OUT);
  disc(env, x, y - 10, 11, '#3a3d46');
  rect(env, x - 12, y - 22, 25, 8, OUT);
  rect(env, x - 11, y - 21, 23, 5, '#6bff9a');
  rect(env, x - 11, y - 21, 23, 1, '#d0ffe0');
  rect(env, x - 12, y - 14, 25, 1, '#6b7280');
  for (let i = 0; i < 4; i++) {
    const life = (env.t * 0.5 + i * 0.27) % 1;
    const bx = x - 7 + i * 5 + Math.round(Math.sin(i * 3.1 + life * 4) * 1);
    disc(env, bx, Math.round(y - 22 - life * 14), 1 + (i % 2), 'rgba(160,255,190,0.75)');
  }
  rect(env, x - 15, y - 17, 3, 6, OUT);
  rect(env, x + 13, y - 17, 3, 6, OUT);
}

function crystal(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 8, y + 1, 17, 3, 'rgba(0,0,0,0.25)');
  rect(env, x - 6, y - 14, 13, 15, OUT);
  rect(env, x - 5, y - 13, 11, 13, '#6b7280');
  rect(env, x - 5, y - 13, 3, 13, '#9aa2b2');
  rect(env, x - 8, y - 17, 17, 4, OUT);
  rect(env, x - 7, y - 16, 15, 2, GOLD);
  const glow = 0.5 + 0.5 * Math.sin(env.t * 1.5);
  disc(env, x, y - 26, 8, OUT);
  disc(env, x, y - 26, 7, glow > 0.5 ? '#b3a0ff' : '#8f7ae0');
  disc(env, x - 2, y - 28, 3, '#ece6ff');
}

function vase(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 8, y + 1, 16, 3, 'rgba(0,0,0,0.22)');
  rect(env, x - 5, y - 16, 11, 17, OUT);
  rect(env, x - 4, y - 15, 9, 15, '#f2e6cc');
  rect(env, x - 4, y - 15, 3, 15, '#ffffff');
  rect(env, x - 4, y - 9, 9, 2, '#2f5fb0');
  const blooms: [number, number, string][] = [
    [-5, -26, '#e63946'],
    [0, -30, '#ffc93c'],
    [5, -25, '#ff6fa8'],
    [-2, -23, '#ffffff'],
    [3, -21, '#e63946'],
  ];
  for (const [dx, dy, c] of blooms) {
    rect(env, x + dx - 1, y + dy - 1, 4, 4, OUT);
    rect(env, x + dx, y + dy, 2, 2, c);
  }
  rect(env, x - 1, y - 21, 1, 6, '#2f8f4a');
  rect(env, x + 2, y - 20, 1, 5, '#2f8f4a');
}

/** Almofada de veludo sobre um pedestal, com a coroa de ouro. */
function cushion(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 10, y + 1, 21, 3, 'rgba(0,0,0,0.25)');
  rect(env, x - 7, y - 20, 15, 21, OUT);
  rect(env, x - 6, y - 19, 13, 19, '#8d95a4');
  rect(env, x - 6, y - 19, 4, 19, '#b9c0cd');
  rect(env, x - 10, y - 24, 21, 6, OUT);
  rect(env, x - 9, y - 23, 19, 4, '#a31f2a');
  rect(env, x - 9, y - 23, 19, 1, '#d03a3a');
  rect(env, x - 6, y - 32, 13, 9, OUT);
  rect(env, x - 5, y - 31, 11, 7, GOLD);
  rect(env, x - 5, y - 26, 11, 2, GOLD_DARK);
  for (const dx of [-5, 0, 5]) {
    rect(env, x + dx - 1, y - 36, 3, 6, OUT);
    rect(env, x + dx, y - 35, 1, 5, GOLD_LIGHT);
  }
  rect(env, x - 1, y - 29, 3, 3, '#d03a3a');
}

/** Confete caindo pelo salão: fase e posição fixas por peça, queda lenta e contínua. */
function confetti(env: SceneEnv): void {
  const colors = ['#e63946', '#ffc93c', '#f8f8f8', '#6aa8e0', '#ff6fa8', GOLD];
  for (let i = 0; i < 46; i++) {
    const baseX = (i * 53) % 390;
    const speed = 14 + (i % 5) * 4;
    const y = Math.round((env.t * speed + i * 37) % 230) - 10;
    const x = baseX + Math.round(Math.sin(env.t * 0.8 + i) * 4);
    rect(env, x, y, 2, 2, colors[i % colors.length] ?? '#e63946');
  }
}

function drawProp(env: SceneEnv, prop: Prop, x: number): void {
  switch (prop.k) {
    case 'brazier':
      return grown(env, x, prop.y, 1.25, () => brazier(env, 0, 0));
    case 'shield':
      return shield(env, x, prop.y);
    case 'chandelier':
      return chandelier(env, x, prop.y);
    case 'table':
      return table(env, x, prop.y, prop.w);
    case 'shelf':
      return shelf(env, x, prop.y);
    case 'orb':
      return orb(env, x, prop.y, prop.hue);
    case 'cauldron':
      return grown(env, x, prop.y, 1.2, () => cauldron(env, 0, 0));
    case 'crystal':
      return crystal(env, x, prop.y);
    case 'vase':
      return grown(env, x, prop.y, 1.2, () => vase(env, 0, 0));
    case 'cushion':
      return cushion(env, x, prop.y);
    case 'garland':
      return flagLine(env, x, prop.y, x + prop.len, prop.y + prop.drop, 12, x * 0.02);
    case 'confetti':
      return confetti(env);
  }
}

const W = { f: 0.8, p: 1250 } as const;

const QG_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'brazier', x: 28, y: 206 },
    { k: 'brazier', x: 362, y: 206 },
  ],
  3: [
    { k: 'chandelier', x: 114, y: 38 },
    { k: 'chandelier', x: 270, y: 38 },
    { k: 'table', x: 4, y: 198, w: 80 },
    { k: 'table', x: 306, y: 198, w: 80 },
  ],
  4: [
    { k: 'shelf', x: 100, y: 150 },
    { k: 'shelf', x: 290, y: 150 },
    { k: 'orb', x: 150, y: 96, hue: 0 },
    { k: 'orb', x: 240, y: 88, hue: 1 },
    { k: 'orb', x: 195, y: 66, hue: 2 },
    { k: 'cauldron', x: 56, y: 204 },
    { k: 'crystal', x: 336, y: 172 },
  ],
  5: [
    { k: 'garland', x: 87, y: 24, len: 216, drop: 0 },
    { k: 'vase', x: 122, y: 208 },
    { k: 'vase', x: 268, y: 208 },
    { k: 'cushion', x: 304, y: 172 },
    { k: 'confetti', x: 0, y: 232 },
  ],
};

const JOURNEY_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'brazier', x: 230, y: 204 },
    { k: 'brazier', x: 640, y: 204 },
    { k: 'brazier', x: 880, y: 160 },
    { k: 'shield', x: 250, y: 64, ...W },
    { k: 'shield', x: 760, y: 64, ...W },
  ],
  3: [
    { k: 'chandelier', x: 150, y: 38, ...W },
    { k: 'chandelier', x: 700, y: 38, ...W },
    { k: 'table', x: 300, y: 162, w: 130, p: 2000 },
  ],
  4: [
    { k: 'shelf', x: 160, y: 150 },
    { k: 'shelf', x: 560, y: 150 },
    { k: 'shelf', x: 960, y: 150 },
    { k: 'orb', x: 250, y: 90, hue: 0, ...W },
    { k: 'orb', x: 700, y: 82, hue: 1, ...W },
    { k: 'orb', x: 1000, y: 96, hue: 2, ...W },
    { k: 'cauldron', x: 330, y: 160 },
    { k: 'crystal', x: 700, y: 160 },
  ],
  5: [
    { k: 'garland', x: 79, y: 24, len: 126, drop: 36, ...W },
    { k: 'garland', x: 764, y: 24, len: 176, drop: 36, ...W },
    { k: 'vase', x: 160, y: 164 },
    { k: 'vase', x: 560, y: 164 },
    { k: 'cushion', x: 420, y: 164 },
    { k: 'confetti', x: 0, y: 232 },
  ],
};

const kit: PropKit<Prop> = {
  period: 1000,
  qg: QG_PROPS,
  journey: JOURNEY_PROPS,
  draw: drawProp,
  light: (env, prop, x) => {
    const warm: [number, number, number] = [255, 150, 60];
    switch (prop.k) {
      case 'brazier':
        return {
          x,
          y: prop.y - 26,
          radius: 70,
          color: warm,
          intensity: 0.6,
          flicker: true,
          at: ['night', 'morning', 'afternoon'],
        };
      case 'chandelier':
        return {
          x,
          y: prop.y,
          radius: 80,
          color: [255, 200, 120],
          intensity: 0.5,
          flicker: true,
          at: ['night', 'morning', 'afternoon'],
        };
      case 'table':
        return {
          x: x + prop.w / 2,
          y: prop.y - 30,
          radius: 60,
          color: [255, 200, 120],
          intensity: 0.45,
          flicker: true,
          at: ['night', 'morning', 'afternoon'],
        };
      case 'orb': {
        const rgb = ORB_COLORS[prop.hue % ORB_COLORS.length]?.[2] ?? [255, 255, 255];
        return {
          x,
          y: prop.y,
          radius: 56,
          color: rgb,
          intensity: 0.55,
          at: ['night', 'morning', 'afternoon'],
        };
      }
      case 'cauldron':
        return {
          x,
          y: prop.y - 18,
          radius: 56,
          color: [110, 255, 160],
          intensity: 0.5,
          at: ['night', 'morning', 'afternoon'],
        };
      case 'crystal':
        return {
          x,
          y: prop.y - 26,
          radius: 50,
          color: [180, 150, 255],
          intensity: 0.5,
          at: ['night', 'morning', 'afternoon'],
        };
      default:
        return null;
    }
  },
};

export const castleLevelLayers = propLayers(kit, CASTLE_LEVEL_COUNT, CASTLE_GROUND);

// ---------------------------------------------------------------------------------------------
// Figurantes
// ---------------------------------------------------------------------------------------------

const lv = (n: number): number => Math.min(CASTLE_LEVEL_COUNT, Math.max(1, n));

export function castleExtras(n: number): ExtraCharacter[] {
  switch (lv(n)) {
    case 2:
      return [
        stand(guard(0), 150, 151, 'down'),
        stand(guard(1), 242, 151, 'down'),
        roamer(guard(0), 'walk', 70, 330, 15, 210),
      ];
    case 3:
      return [
        stand(noble(0), 26, 184, 'down'),
        stand(noble(1), 56, 186, 'down'),
        stand(noble(2), 334, 186, 'down'),
        stand(noble(3), 362, 184, 'down'),
        roamer(JESTER, 'walk', 90, 290, 18, 212),
      ];
    case 4:
      return [
        stand(WIZARD, 262, 162, 'left'),
        stand(APPRENTICE, 78, 190, 'right'),
        roamer(APPRENTICE, 'walk', 120, 270, 11, 214),
      ];
    case 5:
      return [
        stand(noble(0), 26, 184, 'right'),
        stand(noble(2), 50, 198, 'right'),
        stand(noble(4), 22, 214, 'right'),
        stand(noble(1), 366, 184, 'left'),
        stand(noble(3), 342, 198, 'left'),
        stand(noble(0), 372, 214, 'left'),
        roamer(JESTER, 'run', 80, 310, 40, 212),
      ];
    default:
      return [];
  }
}

export function castleJourneyExtras(n: number): ExtraCharacter[] {
  switch (lv(n)) {
    case 2:
      return [
        stander(guard(0), 262, 160, 'down'),
        stander(guard(1), 296, 160, 'down'),
        stander(guard(1), 700, 160, 'down'),
        walker(guard(0), 'walk', 480, 12, 208),
      ];
    case 3:
      return [
        { ...stander(noble(0), 318, 168, 'up', 2000) },
        { ...stander(noble(1), 352, 168, 'up', 2000) },
        { ...stander(noble(2), 392, 168, 'up', 2000) },
        walker(JESTER, 'walk', 140, 16, 208),
        stander(noble(3), 760, 166, 'left'),
        walker(noble(4), 'walk', 560, -10, 212),
      ];
    case 4:
      return [
        stander(WIZARD, 350, 164, 'left'),
        stander(APPRENTICE, 720, 164, 'right'),
        walker(APPRENTICE, 'walk', 100, 12, 208),
        walker(guard(0), 'walk', 820, -9, 212),
      ];
    case 5:
      return [
        stander(noble(0), 180, 166, 'right'),
        stander(noble(1), 440, 166, 'left'),
        stander(noble(2), 580, 166, 'left'),
        stander(noble(3), 800, 166, 'right'),
        walker(JESTER, 'run', 40, 42, 210),
        walker(noble(4), 'walk', 300, 12, 214),
      ];
    default:
      return [];
  }
}
