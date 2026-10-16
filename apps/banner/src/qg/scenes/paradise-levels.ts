import { flame, rect } from './draw';
import {
  disc,
  fireworks,
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

export const FOREST_LEVEL_COUNT = 5;
export const FOREST_GROUND = 180;
const OUT = '#16301c';
const WOOD = '#8a5a2a';
const WOOD_DARK = '#5a3a1c';
const WOOD_LIGHT = '#b8803f';

export const FOREST_LEVELS: LevelInfo[] = [
  {
    name: 'Clareira tranquila',
    blurb:
      'Campo florido com lago, lótus, cabana de fumaça na chaminé, pinheiros, arco-íris e borboletas.',
    changes: [
      'O campo de sempre: lago, cabana, pinheiros, arbustos, flores e borboletas.',
      'Sem ninguém por perto: o personagem está sozinho.',
    ],
  },
  {
    name: 'Bosque vivo',
    blurb:
      'Os bichos aparecem: veado pastando, coelhos pulando, cogumelos, tocos e uma placa de trilha com um caminhante.',
    changes: [
      'Placa de trilha, tocos e cogumelos.',
      'Veado e coelhos; passarinhos pousam no chão.',
      'Um caminhante olhando o bosque e outro passeando.',
    ],
  },
  {
    name: 'Acampamento',
    blurb:
      'Barracas, fogueira com troncos de sentar e um varal; os aventureiros se reúnem em volta do fogo.',
    changes: [
      'Duas barracas, fogueira, troncos de sentar e uma panela no fogo.',
      'Dois aventureiros em volta da fogueira (ela aparece de vez em quando na jornada) e outro caminhando.',
      'Fumaça sobe da fogueira; à noite ela ilumina o acampamento.',
    ],
  },
  {
    name: 'Floresta encantada',
    blurb:
      'A mágica acorda: cogumelos gigantes brilham, luzes flutuam entre as árvores e há uma fada guia por perto.',
    changes: [
      'Cogumelos gigantes que brilham e pó de luz pelo ar.',
      'Luzes (fadas) flutuando entre as árvores; elas acendem também de dia.',
      'Uma guia da floresta parada e gente caminhando em silêncio.',
    ],
  },
  {
    name: 'Festival da floresta',
    blurb:
      'A grande festa: lanternas de papel penduradas entre postes, mesas de piquenique, fogueira e fogos à noite.',
    changes: [
      'Lanternas penduradas entre postes de madeira (nunca soltas no ar).',
      'Mesas de piquenique com frutas, fogueira central e fogos à noite.',
      'A turma dançando em volta do fogo e gente indo e vindo.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Gente
// ---------------------------------------------------------------------------------------------

const HIKER: Look[] = [
  {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-buzzcut',
    hairColor: 'light_brown',
    torso: 'torso-longsleeve-2',
    torsoColor: 'forest',
    legs: 'legs-pants',
    legsColor: 'brown',
    feet: 'feet-revised-boots',
    feetColor: 'brown',
  },
  {
    bodyType: 'female',
    skin: 'amber',
    hair: 'hair-bangs-bun',
    hairColor: 'chestnut',
    torso: 'torso-tshirt',
    torsoColor: 'orange',
    legs: 'legs-shorts',
    legsColor: 'tan',
    feet: 'feet-revised-boots',
    feetColor: 'brown',
  },
  {
    bodyType: 'female',
    skin: 'brown',
    hair: 'hair-natural',
    hairColor: 'black',
    torso: 'torso-cardigan',
    torsoColor: 'teal',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'male',
    skin: 'bronze',
    hair: 'hair-curly-short',
    hairColor: 'dark_brown',
    torso: 'torso-tshirt',
    torsoColor: 'yellow',
    legs: 'legs-pants',
    legsColor: 'slate',
    feet: 'feet-revised-boots',
    feetColor: 'brown',
  },
  {
    bodyType: 'female',
    skin: 'light',
    hair: 'hair-half-up',
    hairColor: 'strawberry',
    torso: 'torso-sleeveless-2',
    torsoColor: 'rose',
    legs: 'legs-pants',
    legsColor: 'forest',
    feet: 'feet-sandals',
  },
];
const GUIDE: Look = {
  bodyType: 'female',
  skin: 'pale_green',
  hair: 'hair-half-up',
  hairColor: 'green',
  torso: 'torso-cardigan',
  torsoColor: 'green',
  legs: 'legs-pants',
  legsColor: 'forest',
  feet: 'feet-sandals',
};
const hiker = (i: number): Look => HIKER[i % HIKER.length] ?? {};

// ---------------------------------------------------------------------------------------------
// Objetos
// ---------------------------------------------------------------------------------------------

type Prop =
  | { k: 'sign'; x: number; y: number; p?: number }
  | { k: 'stump'; x: number; y: number; p?: number }
  | { k: 'shroom'; x: number; y: number; color: string; size: number; glow?: boolean; p?: number }
  | { k: 'deer'; x: number; y: number; dir: 1 | -1; p?: number }
  | { k: 'rabbit'; x: number; y: number; ph: number; p?: number }
  | { k: 'tent'; x: number; y: number; color: string; p?: number }
  | { k: 'camp'; x: number; y: number; p?: number }
  | { k: 'log'; x: number; y: number; w: number; p?: number }
  | { k: 'wisp'; x: number; y: number; ph: number; p?: number }
  | { k: 'post'; x: number; y: number; p?: number }
  | { k: 'picnic'; x: number; y: number; p?: number }
  | { k: 'lanterns'; x: number; y: number; len: number; p?: number };

function sign(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 6, y + 1, 14, 3, 'rgba(0,0,0,0.2)');
  rect(env, x - 2, y - 38, 5, 39, OUT);
  rect(env, x - 1, y - 37, 3, 37, WOOD);
  rect(env, x - 1, y - 37, 1, 37, WOOD_LIGHT);
  for (const [dy, dir] of [
    [-36, 1],
    [-26, -1],
  ] as const) {
    const left = dir > 0 ? x - 3 : x - 22;
    rect(env, left - 1, y + dy - 1, 27, 11, OUT);
    rect(env, left, y + dy, 25, 9, WOOD_LIGHT);
    rect(env, left, y + dy, 25, 2, '#d9a566');
    rect(env, left + (dir > 0 ? 25 : -1), y + dy + 2, 1, 5, OUT);
    for (let k = 0; k < 4; k++) rect(env, left + 3 + k * 5, y + dy + 4, 3, 1, WOOD_DARK);
  }
}

function stump(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 9, y, 20, 3, 'rgba(0,0,0,0.2)');
  rect(env, x - 8, y - 12, 18, 13, OUT);
  rect(env, x - 7, y - 11, 16, 11, WOOD);
  rect(env, x - 7, y - 11, 4, 11, WOOD_LIGHT);
  rect(env, x - 7, y - 4, 16, 1, WOOD_DARK);
  rect(env, x - 8, y - 15, 18, 5, OUT);
  rect(env, x - 7, y - 14, 16, 3, '#d9a566');
  rect(env, x - 4, y - 13, 10, 1, '#b8803f');
  rect(env, x - 1, y - 13, 3, 1, WOOD);
}

/** Cogumelo grande: haste clara, chapéu redondo com pintas; os brilhantes pulsam. */
function shroom(
  env: SceneEnv,
  x: number,
  y: number,
  color: string,
  size: number,
  glow: boolean,
): void {
  const s = size;
  rect(env, x - 3 * s - 1, y, 6 * s + 2, 2, 'rgba(0,0,0,0.18)');
  rect(env, x - 2 * s - 1, y - 7 * s, 4 * s + 2, 7 * s + 1, OUT);
  rect(env, x - 2 * s, y - 7 * s + 1, 4 * s, 7 * s, '#f2e9d0');
  rect(env, x - 2 * s, y - 7 * s + 1, s, 7 * s, '#ffffff');
  const pulse = glow && Math.sin(env.t * 1.6 + x * 0) > 0 ? 1 : 0;
  disc(env, x, y - 8 * s, 6 * s + 1, OUT);
  rect(env, x - 6 * s - 1, y - 8 * s, 12 * s + 3, 4 * s, '#00000000');
  for (let dy = -6 * s; dy <= 0; dy++) {
    const half = Math.round(Math.sqrt((6 * s) ** 2 - dy * dy));
    rect(env, x - half, y - 8 * s + dy, half * 2 + 1, 1, color);
  }
  rect(env, x - 6 * s, y - 8 * s, 12 * s + 1, 1, OUT);
  rect(env, x - 4 * s, y - 12 * s, 2 * s, s, 'rgba(255,255,255,0.45)');
  for (const [dx, dy] of [
    [-3, -4],
    [1, -5],
    [3, -3],
  ] as const) {
    rect(env, x + dx * s, y - 8 * s + dy * s, s * 2, s * 2, glow && pulse ? '#ffffff' : '#fff6e0');
  }
}

/** Veado de lado: corpo, pescoço, cabeça com chifres e quatro pernas finas. */
function deer(env: SceneEnv, x: number, y: number, dir: 1 | -1): void {
  const fx = (dx: number, w: number): number => (dir > 0 ? x + dx : x - dx - w);
  rect(env, x - 16, y, 33, 3, 'rgba(0,0,0,0.2)');
  for (const dx of [-11, -8, 6, 9]) rect(env, fx(dx, 2) - 0, y - 12, 2, 12, OUT);
  for (const dx of [-11, 6]) rect(env, fx(dx, 2), y - 12, 1, 11, '#a8703a');
  rect(env, fx(-14, 30) - 1, y - 22, 32, 12, OUT);
  rect(env, fx(-14, 30), y - 21, 30, 10, '#b57a40');
  rect(env, fx(-14, 30), y - 21, 30, 2, '#d9a566');
  rect(env, fx(-14, 30), y - 13, 30, 2, '#8a5a2a');
  rect(env, fx(-12, 14), y - 15, 14, 3, '#f2e6cc');
  rect(env, fx(-17, 4), y - 22, 4, 3, '#f2e6cc');
  const graze = Math.sin(env.t * 0.6) > 0.55;
  const hy = graze ? 14 : 0;
  rect(env, fx(11, 5) - 1, y - 33 + hy / 2, 7, 14 + hy / 2, OUT);
  rect(env, fx(11, 5), y - 32 + hy / 2, 5, 13 + hy / 2, '#b57a40');
  rect(env, fx(13, 10) - 1, y - 36 + hy, 12, 8, OUT);
  rect(env, fx(13, 10), y - 35 + hy, 10, 6, '#c98a4a');
  rect(env, fx(21, 3), y - 33 + hy, 3, 3, OUT);
  rect(env, fx(17, 1), y - 34 + hy, 1, 1, OUT);
  rect(env, fx(14, 2), y - 39 + hy, 2, 4, '#7a5a2a');
  rect(env, fx(12, 1), y - 42 + hy, 1, 4, '#d9d2c0');
  rect(env, fx(16, 1), y - 42 + hy, 1, 4, '#d9d2c0');
  rect(env, fx(10, 2), y - 40 + hy, 2, 2, '#d9d2c0');
}

/** Coelho: pula no lugar de tempos em tempos (fase fixa por coelho). */
function rabbit(env: SceneEnv, x: number, y: number, ph: number): void {
  const cycle = (env.t * 0.5 + ph) % 1;
  const hop = cycle < 0.25 ? Math.round(Math.sin((cycle / 0.25) * Math.PI) * 6) : 0;
  const cy = y - hop;
  rect(env, x - 6, y, 13, 2, 'rgba(0,0,0,0.18)');
  rect(env, x - 6, cy - 8, 13, 9, OUT);
  rect(env, x - 5, cy - 7, 11, 7, '#e8e2d2');
  rect(env, x - 5, cy - 7, 11, 2, '#ffffff');
  rect(env, x + 3, cy - 12, 5, 6, OUT);
  rect(env, x + 4, cy - 11, 3, 4, '#f4eee0');
  rect(env, x + 4, cy - 17, 2, 6, OUT);
  rect(env, x + 5, cy - 16, 1, 5, '#f4a8b8');
  rect(env, x + 7, cy - 17, 2, 6, OUT);
  rect(env, x + 7, cy - 16, 1, 5, '#f4a8b8');
  rect(env, x + 6, cy - 10, 1, 1, OUT);
  rect(env, x - 7, cy - 5, 3, 3, '#ffffff');
}

function tent(env: SceneEnv, x: number, y: number, color: string): void {
  rect(env, x - 24, y + 1, 49, 3, 'rgba(0,0,0,0.2)');
  for (let i = 0; i <= 28; i++) {
    const half = Math.round(22 * (i / 28));
    rect(env, x - half - 1, y - 28 + i, half * 2 + 3, 1, OUT);
  }
  for (let i = 0; i <= 28; i++) {
    const half = Math.round(22 * (i / 28));
    rect(env, x - half, y - 28 + i, half * 2 + 1, 1, i % 7 < 3 ? color : '#f4e8d0');
  }
  rect(env, x - 6, y - 14, 13, 15, OUT);
  rect(env, x - 5, y - 13, 11, 14, '#2a1f14');
  rect(env, x - 1, y - 13, 1, 14, '#5a3a1c');
  rect(env, x - 1, y - 31, 3, 4, OUT);
  rect(env, x, y - 30, 1, 3, '#d9d2c0');
  rect(env, x - 24, y, 2, 2, '#cfd2d8');
  rect(env, x + 23, y, 2, 2, '#cfd2d8');
}

/** Fogueira de acampamento: pedras em volta, troncos cruzados e chama; faíscas e fumaça sobem. */
function camp(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 16, y + 1, 33, 4, 'rgba(0,0,0,0.22)');
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const px = Math.round(x + Math.cos(a) * 12);
    const py = Math.round(y + Math.sin(a) * 3);
    rect(env, px - 2, py - 2, 5, 4, OUT);
    rect(env, px - 1, py - 1, 3, 2, i % 2 ? '#8d93a1' : '#a8aebb');
  }
  rect(env, x - 9, y - 4, 19, 3, OUT);
  rect(env, x - 8, y - 3, 17, 1, '#6b4119');
  flame(env, x, y - 3, 3);
  flame(env, x - 6, y - 2, 2);
  flame(env, x + 6, y - 2, 2);
  for (let i = 0; i < 5; i++) {
    const rise = (env.t * 12 + i * 8) % 30;
    rect(env, x - 6 + i * 3 + Math.round(Math.sin(env.t * 2 + i)), y - 12 - rise, 1, 1, '#ffd43b');
  }
  for (let i = 0; i < 3; i++) {
    const life = (env.t * 0.25 + i / 3) % 1;
    env.ctx.globalAlpha = 0.4 * (1 - life);
    disc(
      env,
      Math.round(x + life * 6),
      Math.round(y - 22 - life * 26),
      Math.round(2 + life * 4),
      '#7c8190',
    );
    env.ctx.globalAlpha = 1;
  }
}

function log(env: SceneEnv, x: number, y: number, w: number): void {
  rect(env, x - 1, y + 1, w + 2, 3, 'rgba(0,0,0,0.2)');
  rect(env, x - 1, y - 8, w + 2, 10, OUT);
  rect(env, x, y - 7, w, 8, WOOD);
  rect(env, x, y - 7, w, 2, WOOD_LIGHT);
  rect(env, x, y - 1, w, 1, WOOD_DARK);
  rect(env, x - 2, y - 7, 3, 8, '#d9a566');
  rect(env, x + w - 1, y - 7, 3, 8, '#d9a566');
}

/** Fada: luz que flutua em círculos suaves (fase fixa por fada, nunca pela posição). */
function wisp(env: SceneEnv, x: number, y: number, ph: number): void {
  const wx = Math.round(x + Math.sin(env.t * 0.7 + ph) * 6);
  const wy = Math.round(y + Math.sin(env.t * 1.1 + ph * 1.7) * 4);
  const on = Math.sin(env.t * 2.3 + ph) > -0.5;
  if (on) {
    disc(env, wx, wy, 4, 'rgba(190,255,230,0.18)');
    disc(env, wx, wy, 2, 'rgba(210,255,240,0.7)');
    rect(env, wx, wy, 1, 1, '#ffffff');
  }
  rect(env, wx - 3, wy + 1, 1, 1, 'rgba(210,255,240,0.5)');
}

function post(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 6, y + 1, 13, 3, 'rgba(0,0,0,0.2)');
  rect(env, x - 3, y - 60, 7, 61, OUT);
  rect(env, x - 2, y - 59, 5, 59, WOOD);
  rect(env, x - 2, y - 59, 2, 59, WOOD_LIGHT);
  for (const dy of [-48, -30, -14]) rect(env, x - 2, y + dy, 5, 1, WOOD_DARK);
  rect(env, x - 5, y - 63, 11, 5, OUT);
  rect(env, x - 4, y - 62, 9, 3, WOOD_LIGHT);
}

function picnic(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 22, y + 1, 45, 3, 'rgba(0,0,0,0.2)');
  for (const lx of [x - 18, x + 14]) {
    rect(env, lx - 1, y - 12, 6, 13, OUT);
    rect(env, lx, y - 11, 4, 11, WOOD_DARK);
  }
  rect(env, x - 22, y - 22, 45, 12, OUT);
  rect(env, x - 21, y - 21, 43, 10, WOOD);
  for (let i = 0; i < 11; i++) {
    for (const r of [0, 1]) {
      rect(env, x - 21 + i * 4, y - 21 + r * 5, 4, 5, (i + r) % 2 ? '#f8f8f8' : '#e63946');
    }
  }
  rect(env, x - 21, y - 21, 43, 1, '#ffffff');
  const fruit = ['#e63946', '#ffc93c', '#7bd88f', '#ff7a2e'];
  fruit.forEach((c, i) => {
    rect(env, x - 16 + i * 9, y - 28, 6, 6, OUT);
    rect(env, x - 15 + i * 9, y - 27, 4, 4, c);
  });
  rect(env, x + 14, y - 31, 7, 9, OUT);
  rect(env, x + 15, y - 30, 5, 7, '#c99555');
  rect(env, x + 14, y - 33, 7, 2, '#7a4a22');
}

/** Lanternas de papel penduradas num cordão entre dois postes (a ponta é o topo de cada poste). */
function lanterns(env: SceneEnv, x: number, y: number, len: number): void {
  const colors = ['#e63946', '#ffc93c', '#ff7a2e', '#ff6fa8', '#6aa8e0'];
  const steps = Math.max(2, Math.round(len / 12));
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const lx = Math.round(x + len * u);
    const ly = Math.round(y + Math.sin(u * Math.PI) * 12);
    rect(env, lx, ly, 2, 1, OUT);
    if (i > 0 && i < steps) {
      const color = colors[i % colors.length] ?? '#e63946';
      const lit = env.time !== 'afternoon';
      rect(env, lx - 3, ly + 1, 8, 9, OUT);
      rect(env, lx - 2, ly + 2, 6, 7, color);
      rect(env, lx - 2, ly + 2, 2, 7, 'rgba(255,255,255,0.35)');
      rect(env, lx - 2, ly + 5, 6, 1, 'rgba(0,0,0,0.25)');
      rect(env, lx - 1, ly + 10, 4, 2, lit ? '#ffe28a' : '#d9d2c0');
    }
  }
}

function drawProp(env: SceneEnv, prop: Prop, x: number): void {
  switch (prop.k) {
    case 'sign':
      return sign(env, x, prop.y);
    case 'stump':
      return stump(env, x, prop.y);
    case 'shroom':
      return shroom(env, x, prop.y, prop.color, prop.size, prop.glow ?? false);
    case 'deer':
      return deer(env, x, prop.y, prop.dir);
    case 'rabbit':
      return rabbit(env, x, prop.y, prop.ph);
    case 'tent':
      return grown(env, x, prop.y, 1.3, () => tent(env, 0, 0, prop.color));
    case 'camp':
      return grown(env, x, prop.y, 1.2, () => camp(env, 0, 0));
    case 'log':
      return log(env, x, prop.y, prop.w);
    case 'wisp':
      return wisp(env, x, prop.y, prop.ph);
    case 'post':
      return post(env, x, prop.y);
    case 'picnic':
      return grown(env, x, prop.y, 1.15, () => picnic(env, 0, 0));
    case 'lanterns':
      return lanterns(env, x, prop.y, prop.len);
  }
}

const LANE = 176;
const RARE = 2800;
const CAMP_WORLD = 520;
const FEST_WORLD = 300;

const QG_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'sign', x: 168, y: 162 },
    { k: 'stump', x: 112, y: 152 },
    { k: 'shroom', x: 214, y: 160, color: '#e63946', size: 1 },
    { k: 'deer', x: 296, y: 164, dir: -1 },
    { k: 'rabbit', x: 256, y: 202, ph: 0.1 },
    { k: 'rabbit', x: 340, y: 208, ph: 0.55 },
    { k: 'shroom', x: 372, y: 206, color: '#ff7a2e', size: 1 },
  ],
  3: [
    { k: 'tent', x: 142, y: 164, color: '#e07b39' },
    { k: 'tent', x: 268, y: 164, color: '#2f8f93' },
    { k: 'log', x: 144, y: 190, w: 28 },
    { k: 'log', x: 238, y: 190, w: 28 },
    { k: 'camp', x: 200, y: 176 },
  ],
  4: [
    { k: 'shroom', x: 40, y: 152, color: '#8f6bff', size: 3, glow: true },
    { k: 'shroom', x: 352, y: 170, color: '#35e0ff', size: 3, glow: true },
    { k: 'shroom', x: 150, y: 204, color: '#ff6fa8', size: 1, glow: true },
    { k: 'shroom', x: 262, y: 206, color: '#6bff9a', size: 2, glow: true },
    { k: 'wisp', x: 104, y: 86, ph: 0 },
    { k: 'wisp', x: 194, y: 112, ph: 1.7 },
    { k: 'wisp', x: 292, y: 92, ph: 3.1 },
    { k: 'wisp', x: 238, y: 140, ph: 4.4 },
    { k: 'wisp', x: 36, y: 128, ph: 5.2 },
  ],
  5: [
    { k: 'post', x: 34, y: 168 },
    { k: 'post', x: 196, y: 168 },
    { k: 'post', x: 358, y: 168 },
    { k: 'lanterns', x: 34, y: 112, len: 162 },
    { k: 'lanterns', x: 196, y: 112, len: 162 },
    { k: 'picnic', x: 90, y: 172 },
    { k: 'picnic', x: 306, y: 172 },
    { k: 'camp', x: 200, y: 180 },
  ],
};

/** Na jornada o acampamento e o festival são raros: um grupo por ciclo longo, com tudo junto. */
const JOURNEY_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'sign', x: 220, y: LANE - 10 },
    { k: 'stump', x: 380, y: LANE - 18 },
    { k: 'shroom', x: 420, y: LANE - 12, color: '#e63946', size: 1 },
    { k: 'deer', x: 560, y: LANE - 14, dir: -1 },
    { k: 'rabbit', x: 700, y: LANE + 26, ph: 0.2 },
    { k: 'rabbit', x: 160, y: LANE + 32, ph: 0.7 },
    { k: 'shroom', x: 770, y: LANE + 28, color: '#ff7a2e', size: 1 },
  ],
  3: [
    { k: 'tent', x: CAMP_WORLD - 90, y: LANE - 10, color: '#e07b39', p: RARE },
    { k: 'tent', x: CAMP_WORLD + 90, y: LANE - 10, color: '#2f8f93', p: RARE },
    { k: 'log', x: CAMP_WORLD - 50, y: LANE + 4, w: 28, p: RARE },
    { k: 'log', x: CAMP_WORLD + 22, y: LANE + 4, w: 28, p: RARE },
    { k: 'camp', x: CAMP_WORLD, y: LANE - 6, p: RARE },
  ],
  4: [
    { k: 'shroom', x: 120, y: LANE - 14, color: '#8f6bff', size: 3, glow: true },
    { k: 'shroom', x: 450, y: LANE - 14, color: '#35e0ff', size: 3, glow: true },
    { k: 'shroom', x: 300, y: LANE + 30, color: '#ff6fa8', size: 1, glow: true },
    { k: 'shroom', x: 680, y: LANE + 32, color: '#6bff9a', size: 2, glow: true },
    { k: 'shroom', x: 760, y: LANE - 12, color: '#8f6bff', size: 2, glow: true },
    { k: 'wisp', x: 90, y: 90, ph: 0 },
    { k: 'wisp', x: 240, y: 120, ph: 1.7 },
    { k: 'wisp', x: 400, y: 84, ph: 3.1 },
    { k: 'wisp', x: 560, y: 124, ph: 4.4 },
    { k: 'wisp', x: 700, y: 96, ph: 5.2 },
  ],
  5: [
    { k: 'post', x: FEST_WORLD - 150, y: LANE - 8, p: RARE },
    { k: 'post', x: FEST_WORLD, y: LANE - 8, p: RARE },
    { k: 'post', x: FEST_WORLD + 150, y: LANE - 8, p: RARE },
    { k: 'lanterns', x: FEST_WORLD - 150, y: 112, len: 150, p: RARE },
    { k: 'lanterns', x: FEST_WORLD, y: 112, len: 150, p: RARE },
    { k: 'picnic', x: FEST_WORLD - 70, y: LANE - 4, p: RARE },
    { k: 'picnic', x: FEST_WORLD + 100, y: LANE - 4, p: RARE },
    { k: 'camp', x: FEST_WORLD + 20, y: LANE - 8, p: RARE },
    { k: 'post', x: 800, y: LANE - 8 },
    { k: 'post', x: 1000, y: LANE - 8 },
    { k: 'lanterns', x: 800, y: 112, len: 200 },
    { k: 'picnic', x: 1190, y: LANE - 6 },
  ],
};

const kit: PropKit<Prop> = {
  period: 1400,
  qg: QG_PROPS,
  journey: JOURNEY_PROPS,
  draw: drawProp,
  light: (env, prop, x) => {
    switch (prop.k) {
      case 'camp':
        return {
          x,
          y: prop.y - 10,
          radius: 90,
          color: [255, 150, 60],
          intensity: 0.7,
          flicker: true,
        };
      case 'shroom':
        return prop.glow
          ? {
              x,
              y: prop.y - 10 * prop.size,
              radius: 26 + prop.size * 12,
              color:
                prop.color === '#35e0ff'
                  ? [60, 220, 255]
                  : prop.color === '#8f6bff'
                    ? [150, 110, 255]
                    : prop.color === '#ff6fa8'
                      ? [255, 110, 170]
                      : [110, 255, 160],
              intensity: 0.55,
              at: ['night', 'morning', 'afternoon'],
            }
          : null;
      case 'wisp':
        return {
          x: x + Math.sin(env.t * 0.7 + prop.ph) * 6,
          y: prop.y + Math.sin(env.t * 1.1 + prop.ph * 1.7) * 4,
          radius: 22,
          color: [200, 255, 230],
          intensity: 0.5,
          at: ['night', 'morning', 'afternoon'],
        };
      case 'lanterns':
        return {
          x: x + prop.len / 2,
          y: prop.y + 16,
          radius: 70,
          color: [255, 200, 120],
          intensity: 0.45,
        };
      default:
        return null;
    }
  },
};

export const forestLevelLayers = propLayers(kit, FOREST_LEVEL_COUNT, FOREST_GROUND);

/** Fogos do festival (céu da noite), chamados pelo cenário logo depois do céu. */
export function forestSky(env: SceneEnv): void {
  if (env.level !== 5) return;
  fireworks(env, [
    [80, 40, '#ff6fa8', 0],
    [200, 26, '#ffd43b', 1.1],
    [320, 46, '#6aa8e0', 2.1],
  ]);
}

// ---------------------------------------------------------------------------------------------
// Figurantes
// ---------------------------------------------------------------------------------------------

const lv = (n: number): number => Math.min(FOREST_LEVEL_COUNT, Math.max(1, n));

export function forestExtras(n: number): ExtraCharacter[] {
  switch (lv(n)) {
    case 2:
      return [stand(hiker(0), 196, 174, 'left'), roamer(hiker(1), 'walk', 150, 340, 15, 214)];
    case 3:
      return [
        stand(hiker(2), 176, 188, 'right'),
        stand(hiker(3), 232, 188, 'left'),
        roamer(hiker(4), 'walk', 150, 350, 14, 214),
      ];
    case 4:
      return [stand(GUIDE, 176, 190, 'left'), roamer(hiker(0), 'walk', 150, 340, 11, 214)];
    case 5:
      return [
        stand(hiker(0), 164, 188, 'right'),
        stand(hiker(1), 236, 188, 'left'),
        stand(hiker(2), 200, 166, 'down'),
        roamer(hiker(3), 'run', 30, 360, 44, 214),
        roamer(hiker(4), 'walk', 350, 60, 12, 206),
      ];
    default:
      return [];
  }
}

export function forestJourneyExtras(n: number): ExtraCharacter[] {
  const lane = LANE;
  switch (lv(n)) {
    case 2:
      return [
        stander(hiker(0), 250, lane - 8, 'right'),
        walker(hiker(1), 'walk', 90, 12, lane + 16),
        walker(hiker(4), 'walk', 600, -10, lane + 14),
      ];
    case 3:
      return [
        { ...stander(hiker(2), CAMP_WORLD - 26, lane - 2, 'right', RARE) },
        { ...stander(hiker(3), CAMP_WORLD + 26, lane - 2, 'left', RARE) },
        walker(hiker(0), 'walk', 100, 12, lane + 16),
        walker(hiker(4), 'walk', 800, -10, lane + 12),
      ];
    case 4:
      return [
        stander(GUIDE, 330, lane - 6, 'left'),
        walker(hiker(1), 'walk', 120, 11, lane + 16),
        walker(hiker(3), 'walk', 620, -9, lane + 12),
      ];
    case 5:
      return [
        { ...stander(hiker(0), FEST_WORLD - 10, lane - 14, 'down', RARE) },
        { ...stander(hiker(1), FEST_WORLD + 50, lane - 14, 'down', RARE) },
        { ...stander(hiker(2), FEST_WORLD + 20, lane - 2, 'up', RARE) },
        walker(hiker(3), 'run', 80, 44, lane + 16),
        walker(hiker(4), 'walk', 640, -11, lane + 14),
      ];
    default:
      return [];
  }
}
