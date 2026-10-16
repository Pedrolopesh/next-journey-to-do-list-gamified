import { flame, rect } from './draw';
import {
  disc,
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

export const HELL_LEVEL_COUNT = 5;
export const HELL_GROUND = 182;
const OUT = '#120406';
const IRON = '#2a2a33';
const IRON_LIGHT = '#5a5a6a';
const BONE = '#e8e0cc';
const BONE_DARK = '#c8bfa8';
const LAVA = '#ff7a1a';

export const HELL_LEVELS: LevelInfo[] = [
  {
    name: 'Trono infernal',
    blurb:
      'O trono no centro, o rio de lava ao fundo, vulcão, braseiros e brasas subindo: o inferno ainda calmo.',
    changes: [
      'Trono, lago de lava, vulcão, braseiros e ossos.',
      'Sem ninguém: só o personagem e o calor.',
    ],
  },
  {
    name: 'Portão dos condenados',
    blurb:
      'Um portão de ferro com crânios se ergue ao fundo; forcas com jaulas balançam e diabretes vigiam a entrada.',
    changes: [
      'Portão de ferro e ossos com olhos que brilham.',
      'Forcas com jaulas penduradas e correntes.',
      'Um diabrete de guarda e outro patrulhando.',
    ],
  },
  {
    name: 'Forja infernal',
    blurb:
      'A forja trabalha: fornalha com chaminé, bigornas, calha de lava escorrendo e demônios ferreiros.',
    changes: [
      'Fornalha com chaminé soltando faíscas e fumaça.',
      'Bigornas, calha de lava e correntes.',
      'Dois demônios ferreiros trabalhando e um carregando.',
    ],
  },
  {
    name: 'Rio das almas',
    blurb:
      'Tochas de fogo azul margeiam um rio onde almas flutuam; um arco de ossos marca a passagem e a névoa sobe.',
    changes: [
      'Almas azuis flutuando e tochas de fogo azul.',
      'Arco de ossos e obelisco com runas acesas.',
      'Almas perdidas paradas e uma caminhando devagar.',
    ],
  },
  {
    name: 'Corte do rei demônio',
    blurb:
      'O ápice: pilares de fogo, estandartes de chifres, obeliscos acesos, guardas em formação e relâmpagos no céu vermelho.',
    changes: [
      'Pilares de fogo e estandartes de chifres dos dois lados do tapete.',
      'Relâmpagos cruzam o céu, obeliscos de runas acesos.',
      'Guardas em formação, um arauto correndo e demônios da corte.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Gente (demônios, diabretes e almas)
// ---------------------------------------------------------------------------------------------

const IMP: Look[] = [
  {
    bodyType: 'male',
    skin: 'lavender',
    hair: null,
    hairColor: 'black',
    torso: 'torso-sleeveless-2',
    torsoColor: 'maroon',
    legs: 'legs-shorts',
    legsColor: 'black',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'blue',
    hair: 'hair-bangs-bun',
    hairColor: 'red',
    torso: 'torso-tshirt',
    torsoColor: 'black',
    legs: 'legs-pants',
    legsColor: 'maroon',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'male',
    skin: 'dark_green',
    hair: 'hair-buzzcut',
    hairColor: 'orange',
    torso: 'torso-longsleeve-2',
    torsoColor: 'charcoal',
    legs: 'legs-pants',
    legsColor: 'black',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'female',
    skin: 'lavender',
    hair: 'hair-half-up',
    hairColor: 'raven',
    torso: 'torso-cardigan',
    torsoColor: 'purple',
    legs: 'legs-pants',
    legsColor: 'black',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
];
const SOUL: Look[] = [
  {
    bodyType: 'male',
    skin: 'pale_green',
    hair: 'hair-curly-short',
    hairColor: 'platinum',
    torso: 'torso-tshirt',
    torsoColor: 'bluegray',
    legs: 'legs-pants',
    legsColor: 'slate',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'pale_green',
    hair: 'hair-natural',
    hairColor: 'white',
    torso: 'torso-cardigan',
    torsoColor: 'sky',
    legs: 'legs-pants',
    legsColor: 'bluegray',
    feet: null,
  },
];
const imp = (i: number): Look => IMP[i % IMP.length] ?? {};
const soul = (i: number): Look => SOUL[i % SOUL.length] ?? {};

// ---------------------------------------------------------------------------------------------
// Objetos
// ---------------------------------------------------------------------------------------------

type Prop =
  | { k: 'gate'; x: number; y: number; s?: number; p?: number }
  | { k: 'gallows'; x: number; y: number; ph: number; p?: number }
  | { k: 'forge'; x: number; y: number; p?: number }
  | { k: 'anvil'; x: number; y: number; p?: number }
  | { k: 'trough'; x: number; y: number; w: number; p?: number }
  | { k: 'blueflame'; x: number; y: number; p?: number }
  | { k: 'soulgate'; x: number; y: number; s?: number; p?: number }
  | { k: 'obelisk'; x: number; y: number; p?: number }
  | { k: 'souls'; x: number; y: number; ph: number; f?: number; p?: number }
  | { k: 'pillar'; x: number; y: number; p?: number }
  | { k: 'standard'; x: number; y: number; p?: number }
  | { k: 'bones'; x: number; y: number; p?: number };

function skullAt(env: SceneEnv, x: number, y: number, eyes: boolean): void {
  rect(env, x - 6, y - 1, 13, 11, OUT);
  rect(env, x - 5, y, 11, 8, BONE);
  rect(env, x - 5, y, 11, 1, '#fff8e8');
  rect(env, x + 3, y, 3, 8, BONE_DARK);
  rect(env, x - 3, y + 8, 7, 3, OUT);
  rect(env, x - 2, y + 8, 5, 2, '#d4ccb8');
  rect(env, x - 4, y + 2, 3, 3, OUT);
  rect(env, x + 1, y + 2, 3, 3, OUT);
  if (eyes) {
    const on = Math.sin(env.t * 3 + x) > 0 ? '#ff4a2a' : '#ff8a3a';
    rect(env, x - 3, y + 3, 1, 1, on);
    rect(env, x + 2, y + 3, 1, 1, on);
  }
}

/** Portão de ferro: dois pilares com crânios, arco de grades e olhos que brilham. */
function gate(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 40, y, 82, 3, 'rgba(0,0,0,0.3)');
  for (const dx of [-36, 28]) {
    rect(env, x + dx - 1, y - 62, 15, 63, OUT);
    rect(env, x + dx, y - 61, 13, 61, '#3a2a30');
    rect(env, x + dx, y - 61, 4, 61, '#5a444c');
    for (let k = 0; k < 4; k++) rect(env, x + dx, y - 50 + k * 14, 13, 1, OUT);
    skullAt(env, x + dx + 6, y - 72, true);
  }
  rect(env, x - 24, y - 64, 49, 5, OUT);
  rect(env, x - 23, y - 63, 47, 3, IRON_LIGHT);
  for (let i = 0; i < 9; i++) {
    const gx = x - 23 + i * 6;
    rect(env, gx, y - 58, 3, 58, OUT);
    rect(env, gx + 1, y - 57, 1, 56, i % 2 ? '#4a4a58' : IRON_LIGHT);
    rect(env, gx, y - 61, 3, 3, LAVA);
  }
  rect(env, x - 24, y - 30, 49, 3, OUT);
  rect(env, x - 24, y - 6, 49, 3, OUT);
  rect(env, x - 22, y - 20, 45, 20, 'rgba(255,90,30,0.18)');
}

/** Forca com jaula pendurada: a jaula balança devagar numa fase fixa. */
function gallows(env: SceneEnv, x: number, y: number, ph: number): void {
  rect(env, x - 10, y + 1, 21, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 3, y - 62, 6, 63, OUT);
  rect(env, x - 2, y - 61, 4, 61, '#3a2a30');
  rect(env, x - 3, y - 64, 30, 5, OUT);
  rect(env, x - 2, y - 63, 28, 3, '#4a363c');
  for (let k = 0; k < 6; k++) rect(env, x + 2 + k * 2, y - 59 + k, 2, 1, OUT);
  const sway = Math.round(Math.sin(env.t * 0.8 + ph) * 2);
  const cx = x + 22 + sway;
  for (let k = 0; k < 8; k++) rect(env, cx, y - 59 + k * 2, 1, 1, '#9aa0a6');
  rect(env, cx - 8, y - 44, 17, 24, OUT);
  rect(env, cx - 7, y - 43, 15, 22, 'rgba(20,10,12,0.8)');
  for (let i = 0; i < 5; i++) rect(env, cx - 6 + i * 3, y - 43, 1, 22, IRON_LIGHT);
  rect(env, cx - 8, y - 33, 17, 1, IRON_LIGHT);
  rect(env, cx - 8, y - 22, 17, 2, OUT);
  rect(env, cx - 4, y - 30, 3, 4, BONE);
  rect(env, cx + 1, y - 34, 3, 4, BONE);
}

/** Fornalha de pedra com boca em chamas, chaminé que solta faíscas e fumaça. */
function forge(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 24, y, 50, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 22, y - 34, 46, 35, OUT);
  rect(env, x - 21, y - 33, 44, 33, '#4a2a2e');
  rect(env, x - 21, y - 33, 44, 2, '#7a4a4a');
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++)
      rect(env, x - 20 + c * 9 + (r % 2) * 4, y - 30 + r * 8, 8, 1, '#2a1418');
  rect(env, x - 9, y - 21, 20, 22, OUT);
  rect(env, x - 8, y - 20, 18, 20, '#ff5a1a');
  rect(env, x - 8, y - 20, 18, 4, '#ffd43b');
  flame(env, x - 3, y - 2, 3);
  flame(env, x + 5, y - 2, 2);
  rect(env, x - 6, y - 54, 13, 21, OUT);
  rect(env, x - 5, y - 53, 11, 20, '#3a1c20');
  for (let i = 0; i < 4; i++) {
    const rise = (env.t * 14 + i * 9) % 30;
    rect(env, x - 2 + i * 2 + Math.round(Math.sin(env.t * 2 + i)), y - 56 - rise, 1, 1, '#ffd43b');
  }
  for (let i = 0; i < 3; i++) {
    const life = (env.t * 0.22 + i / 3) % 1;
    env.ctx.globalAlpha = 0.5 * (1 - life);
    disc(
      env,
      Math.round(x + life * 8),
      Math.round(y - 58 - life * 26),
      Math.round(3 + life * 5),
      '#3a2f33',
    );
    env.ctx.globalAlpha = 1;
  }
}

function anvil(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 12, y + 1, 25, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 6, y - 8, 13, 9, OUT);
  rect(env, x - 5, y - 7, 11, 8, '#3a3a46');
  rect(env, x - 12, y - 16, 26, 9, OUT);
  rect(env, x - 11, y - 15, 24, 7, IRON_LIGHT);
  rect(env, x - 11, y - 15, 24, 2, '#8a8a9c');
  rect(env, x + 12, y - 14, 6, 4, OUT);
  rect(env, x + 12, y - 13, 5, 2, IRON_LIGHT);
  const glow = Math.sin(env.t * 4) > 0.3;
  if (glow) rect(env, x - 3, y - 17, 7, 2, '#ff9a3a');
}

/** Calha de pedra com lava escorrendo (a lava avança devagar). */
function trough(env: SceneEnv, x: number, y: number, w: number): void {
  rect(env, x - 1, y - 7, w + 2, 9, OUT);
  rect(env, x, y - 6, w, 7, '#3a2a30');
  rect(env, x + 1, y - 6, w - 2, 4, LAVA);
  const flow = Math.round(env.t * 6) % 8;
  for (let i = -8; i < w; i += 8) rect(env, x + Math.max(1, i + flow), y - 6, 3, 2, '#ffd43b');
  rect(env, x, y - 6, w, 1, '#ffb347');
  for (const dx of [2, w - 5]) rect(env, x + dx, y + 1, 3, 5, OUT);
}

/** Tocha de fogo azul: poste de ferro com chama fria que dança. */
function blueflame(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 5, y + 1, 11, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 1, y - 30, 3, 31, OUT);
  rect(env, x, y - 29, 1, 29, IRON_LIGHT);
  rect(env, x - 5, y - 36, 11, 7, OUT);
  rect(env, x - 4, y - 35, 9, 5, IRON);
  const wob = Math.sin(env.t * 11 + x * 0) > 0 ? 1 : 0;
  rect(env, x - 3, y - 41, 7, 6, '#2a6fd6');
  rect(env, x - 2, y - 44 - wob, 5, 8, '#6ab4ff');
  rect(env, x - 1 + wob, y - 47 - wob, 3, 6, '#d8f0ff');
}

/** Arco de ossos: dois pilares de costelas e uma viga de fêmures com crânio no meio. */
function soulgate(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 38, y + 1, 78, 3, 'rgba(0,0,0,0.3)');
  for (const dx of [-34, 28]) {
    for (let k = 0; k < 7; k++) {
      rect(env, x + dx - 1, y - 8 - k * 8, 10, 7, OUT);
      rect(env, x + dx, y - 7 - k * 8, 8, 5, k % 2 ? BONE_DARK : BONE);
    }
  }
  rect(env, x - 38, y - 64, 78, 8, OUT);
  rect(env, x - 37, y - 63, 76, 6, BONE);
  rect(env, x - 37, y - 63, 76, 2, '#fff8e8');
  rect(env, x - 42, y - 66, 8, 12, OUT);
  rect(env, x - 41, y - 65, 6, 10, BONE);
  rect(env, x + 36, y - 66, 8, 12, OUT);
  rect(env, x + 37, y - 65, 6, 10, BONE);
  skullAt(env, x, y - 80, true);
}

const RUNE = '#ffb347';
function obelisk(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 10, y + 1, 21, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 8, y - 6, 17, 7, OUT);
  rect(env, x - 7, y - 5, 15, 5, '#3a2a30');
  rect(env, x - 6, y - 52, 13, 47, OUT);
  rect(env, x - 5, y - 51, 11, 45, '#3a1c20');
  rect(env, x - 5, y - 51, 3, 45, '#5a3a40');
  rect(env, x - 4, y - 58, 9, 7, OUT);
  rect(env, x - 3, y - 57, 7, 5, '#3a1c20');
  rect(env, x - 1, y - 62, 3, 5, OUT);
  const pulse = 0.6 + 0.4 * Math.sin(env.t * 2 + y * 0);
  env.ctx.globalAlpha = pulse;
  for (let i = 0; i < 5; i++) {
    rect(env, x - 3, y - 46 + i * 8, 7, 1, RUNE);
    rect(env, x - 1 + (i % 2) * 2, y - 44 + i * 8, 1, 4, RUNE);
  }
  env.ctx.globalAlpha = 1;
}

/** Alma flutuante: fantasma azul que sobe e desce devagar (fase fixa). */
function soulWisp(env: SceneEnv, x: number, y: number, ph: number): void {
  const wx = Math.round(x + Math.sin(env.t * 0.6 + ph) * 5);
  const wy = Math.round(y + Math.sin(env.t * 0.9 + ph * 1.3) * 5);
  env.ctx.globalAlpha = 0.8;
  disc(env, wx, wy, 5, 'rgba(120,190,255,0.35)');
  disc(env, wx, wy, 3, '#bfe3ff');
  for (let k = 1; k < 5; k++)
    rect(
      env,
      wx - 1 + Math.round(Math.sin(env.t * 2 + k + ph)),
      wy + 2 + k * 2,
      2,
      2,
      `rgba(160,210,255,${0.6 - k * 0.12})`,
    );
  env.ctx.globalAlpha = 1;
  rect(env, wx - 2, wy - 1, 1, 2, '#1b3a66');
  rect(env, wx + 1, wy - 1, 1, 2, '#1b3a66');
}

/** Pilar de fogo: coluna de pedra negra com uma labareda alta e viva no topo. */
function pillar(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 12, y + 1, 25, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 9, y - 40, 19, 41, OUT);
  rect(env, x - 8, y - 39, 17, 39, '#2a1418');
  rect(env, x - 8, y - 39, 5, 39, '#4a2a2e');
  rect(env, x - 11, y - 46, 23, 8, OUT);
  rect(env, x - 10, y - 45, 21, 6, '#3a1c20');
  rect(env, x - 10, y - 45, 21, 1, LAVA);
  flame(env, x, y - 45, 4);
  flame(env, x - 6, y - 44, 3);
  flame(env, x + 6, y - 44, 3);
  for (let i = 0; i < 4; i++) {
    const rise = (env.t * 16 + i * 11) % 40;
    rect(env, x - 6 + i * 4 + Math.round(Math.sin(env.t * 3 + i)), y - 60 - rise, 1, 1, '#ffd43b');
  }
}

/** Estandarte da corte: haste de ferro, tecido negro com chifres vermelhos. */
function standard(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 6, y + 1, 13, 3, 'rgba(0,0,0,0.3)');
  rect(env, x - 1, y - 64, 3, 65, OUT);
  rect(env, x, y - 63, 1, 63, IRON_LIGHT);
  const wave = Math.round(Math.sin(env.t * 1.5 + x * 0) * 1);
  rect(env, x + 2, y - 62, 18, 30, OUT);
  rect(env, x + 3 + wave, y - 61, 16, 28, '#1b0a0e');
  rect(env, x + 3 + wave, y - 61, 16, 2, '#6a1018');
  rect(env, x + 6 + wave, y - 54, 2, 7, '#e63946');
  rect(env, x + 14 + wave, y - 54, 2, 7, '#e63946');
  rect(env, x + 8 + wave, y - 48, 6, 8, '#e63946');
  rect(env, x + 9 + wave, y - 45, 1, 1, OUT);
  rect(env, x + 12 + wave, y - 45, 1, 1, OUT);
  for (let i = 0; i < 4; i++)
    rect(env, x + 3 + i * 4 + wave, y - 33, 3, 2 + (i % 2) * 2, '#1b0a0e');
}

function bones(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 14, y + 1, 29, 3, 'rgba(0,0,0,0.25)');
  for (const [dx, dy, w] of [
    [-12, -4, 14],
    [-2, -8, 12],
    [4, -3, 10],
  ] as const) {
    rect(env, x + dx - 1, y + dy - 1, w + 2, 5, OUT);
    rect(env, x + dx, y + dy, w, 3, BONE);
    rect(env, x + dx, y + dy, w, 1, '#fff8e8');
    rect(env, x + dx - 2, y + dy - 1, 3, 5, BONE);
    rect(env, x + dx + w - 1, y + dy - 1, 3, 5, BONE);
  }
  skullAt(env, x + 8, y - 12, false);
}

function drawProp(env: SceneEnv, prop: Prop, x: number): void {
  switch (prop.k) {
    case 'gate':
      return grown(env, x, prop.y, prop.s ?? 1.15, () => gate(env, 0, 0));
    case 'gallows':
      return gallows(env, x, prop.y, prop.ph);
    case 'forge':
      return grown(env, x, prop.y, 1.25, () => forge(env, 0, 0));
    case 'anvil':
      return anvil(env, x, prop.y);
    case 'trough':
      return trough(env, x, prop.y, prop.w);
    case 'blueflame':
      return blueflame(env, x, prop.y);
    case 'soulgate':
      return grown(env, x, prop.y, prop.s ?? 1.1, () => soulgate(env, 0, 0));
    case 'obelisk':
      return obelisk(env, x, prop.y);
    case 'souls':
      return soulWisp(env, x, prop.y, prop.ph);
    case 'pillar':
      return pillar(env, x, prop.y);
    case 'standard':
      return standard(env, x, prop.y);
    case 'bones':
      return bones(env, x, prop.y);
  }
}

const LANE = 176;
const RARE = 2400;
const GATE_WORLD = 380;

const QG_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'gate', x: 58, y: 160, s: 0.85 },
    { k: 'gallows', x: 336, y: 182, ph: 2 },
    { k: 'bones', x: 276, y: 208 },
  ],
  3: [
    { k: 'forge', x: 50, y: 170 },
    { k: 'trough', x: 280, y: 190, w: 88 },
    { k: 'anvil', x: 300, y: 208 },
    { k: 'bones', x: 120, y: 208 },
  ],
  4: [
    { k: 'soulgate', x: 62, y: 176, s: 0.8 },
    { k: 'blueflame', x: 124, y: 176 },
    { k: 'blueflame', x: 300, y: 178 },
    { k: 'obelisk', x: 358, y: 176 },
    { k: 'souls', x: 120, y: 120, ph: 0 },
    { k: 'souls', x: 270, y: 108, ph: 2.1 },
    { k: 'souls', x: 330, y: 138, ph: 4.2 },
    { k: 'souls', x: 40, y: 140, ph: 5.5 },
  ],
  5: [
    { k: 'pillar', x: 40, y: 172 },
    { k: 'pillar', x: 350, y: 172 },
    { k: 'standard', x: 96, y: 168 },
    { k: 'standard', x: 296, y: 168 },
    { k: 'obelisk', x: 18, y: 204 },
    { k: 'obelisk', x: 372, y: 204 },
  ],
};

const JOURNEY_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'gate', x: GATE_WORLD, y: LANE - 14, p: RARE },
    { k: 'gallows', x: 140, y: LANE - 8, ph: 0 },
    { k: 'gallows', x: GATE_WORLD + 140, y: LANE - 8, ph: 2, p: RARE },
    { k: 'gallows', x: 800, y: LANE - 8, ph: 4 },
    { k: 'bones', x: 560, y: LANE + 10 },
  ],
  3: [
    { k: 'forge', x: 300, y: LANE - 12, p: RARE },
    { k: 'trough', x: 380, y: LANE - 8, w: 90, p: RARE },
    { k: 'anvil', x: 500, y: LANE - 6, p: RARE },
    { k: 'anvil', x: 120, y: LANE + 12 },
    { k: 'bones', x: 640, y: LANE + 12 },
  ],
  4: [
    { k: 'soulgate', x: 400, y: LANE - 12, p: RARE },
    { k: 'blueflame', x: 300, y: LANE - 2, p: RARE },
    { k: 'blueflame', x: 500, y: LANE - 2, p: RARE },
    { k: 'blueflame', x: 120, y: LANE },
    { k: 'blueflame', x: 700, y: LANE },
    { k: 'obelisk', x: 220, y: LANE - 8 },
    { k: 'souls', x: 80, y: 112, ph: 0, f: 0.5 },
    { k: 'souls', x: 330, y: 100, ph: 2.1, f: 0.5 },
    { k: 'souls', x: 560, y: 124, ph: 4.2, f: 0.5 },
    { k: 'souls', x: 760, y: 108, ph: 5.5, f: 0.5 },
  ],
  5: [
    { k: 'pillar', x: 120, y: LANE - 8 },
    { k: 'pillar', x: 420, y: LANE - 8 },
    { k: 'pillar', x: 720, y: LANE - 8 },
    { k: 'standard', x: 270, y: LANE - 6 },
    { k: 'standard', x: 570, y: LANE - 6 },
    { k: 'obelisk', x: 840, y: LANE - 8 },
  ],
};

const kit: PropKit<Prop> = {
  period: 1300,
  qg: QG_PROPS,
  journey: JOURNEY_PROPS,
  draw: drawProp,
  light: (env, prop, x) => {
    const all: ('morning' | 'afternoon' | 'night')[] = ['morning', 'afternoon', 'night'];
    switch (prop.k) {
      case 'forge':
        return {
          x,
          y: prop.y - 14,
          radius: 80,
          color: [255, 120, 40],
          intensity: 0.7,
          flicker: true,
          at: all,
        };
      case 'trough':
        return {
          x: x + prop.w / 2,
          y: prop.y - 4,
          radius: 60,
          color: [255, 130, 40],
          intensity: 0.5,
          at: all,
        };
      case 'blueflame':
        return {
          x,
          y: prop.y - 42,
          radius: 60,
          color: [90, 170, 255],
          intensity: 0.65,
          flicker: true,
          at: all,
        };
      case 'souls':
        return {
          x: x + Math.sin(env.t * 0.6 + prop.ph) * 5,
          y: prop.y + Math.sin(env.t * 0.9 + prop.ph * 1.3) * 5,
          radius: 28,
          color: [130, 190, 255],
          intensity: 0.5,
          at: all,
        };
      case 'pillar':
        return {
          x,
          y: prop.y - 48,
          radius: 90,
          color: [255, 120, 40],
          intensity: 0.75,
          flicker: true,
          at: all,
        };
      case 'obelisk':
        return { x, y: prop.y - 28, radius: 44, color: [255, 170, 60], intensity: 0.5, at: all };
      case 'gate':
        return { x, y: prop.y - 30, radius: 70, color: [255, 90, 40], intensity: 0.45, at: all };
      case 'gallows':
        return null;
      default:
        return null;
    }
  },
};

export const hellLevelLayers = propLayers(kit, HELL_LEVEL_COUNT, HELL_GROUND);

/** Relâmpagos do nível 5: um clarão curto e um raio ramificado, a cada poucos segundos. */
export function hellSky(env: SceneEnv): void {
  if (env.level !== 5) return;
  const cycle = (env.t + 1.3) % 7;
  if (cycle > 0.35) return;
  const strength = 1 - cycle / 0.35;
  env.ctx.save();
  env.ctx.globalAlpha = 0.18 * strength;
  env.ctx.fillStyle = '#ffd9c0';
  env.ctx.fillRect(0, 0, 390, 126);
  env.ctx.globalAlpha = 0.9 * strength;
  let bx = 120 + ((Math.floor((env.t + 1.3) / 7) * 53) % 160);
  for (let y = 0; y < 100; y += 6) {
    const nx = bx + (((y * 7 + bx) % 9) - 4);
    rect(env, nx, y, 2, 7, '#fff6e0');
    bx = nx;
  }
  env.ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Figurantes
// ---------------------------------------------------------------------------------------------

const lv = (n: number): number => Math.min(HELL_LEVEL_COUNT, Math.max(1, n));

export function hellExtras(n: number): ExtraCharacter[] {
  switch (lv(n)) {
    case 2:
      return [stand(imp(0), 150, 170, 'down'), roamer(imp(1), 'walk', 90, 320, 15, 212)];
    case 3:
      return [
        stand(imp(2), 120, 182, 'right'),
        stand(imp(0), 262, 204, 'right'),
        roamer(imp(3), 'walk', 130, 250, 11, 214),
      ];
    case 4:
      return [
        stand(soul(0), 130, 196, 'up'),
        stand(soul(1), 262, 190, 'up'),
        roamer(soul(0), 'walk', 60, 330, 9, 214),
      ];
    case 5:
      return [
        stand(imp(0), 112, 176, 'down'),
        stand(imp(2), 280, 176, 'down'),
        stand(imp(3), 70, 196, 'right'),
        stand(imp(1), 330, 196, 'left'),
        roamer(imp(0), 'run', 50, 340, 44, 214),
      ];
    default:
      return [];
  }
}

export function hellJourneyExtras(n: number): ExtraCharacter[] {
  const lane = LANE;
  switch (lv(n)) {
    case 2:
      return [
        { ...stander(imp(0), GATE_WORLD - 50, lane - 4, 'down', RARE) },
        { ...stander(imp(2), GATE_WORLD + 60, lane - 4, 'down', RARE) },
        walker(imp(1), 'walk', 100, 12, lane + 16),
        walker(imp(3), 'walk', 700, -10, lane + 14),
      ];
    case 3:
      return [
        { ...stander(imp(2), 360, lane - 8, 'right', RARE) },
        { ...stander(imp(0), 440, lane - 8, 'left', RARE) },
        walker(imp(3), 'walk', 560, -11, lane + 16),
        walker(imp(1), 'walk', 80, 12, lane + 14),
      ];
    case 4:
      return [
        stander(soul(0), 180, lane - 4, 'up'),
        stander(soul(1), 660, lane - 4, 'up'),
        walker(soul(0), 'walk', 420, 8, lane + 16),
        walker(soul(1), 'walk', 820, -7, lane + 12),
      ];
    case 5:
      return [
        stander(imp(0), 190, lane - 10, 'down'),
        stander(imp(2), 350, lane - 10, 'down'),
        stander(imp(3), 490, lane - 10, 'down'),
        walker(imp(1), 'run', 60, 44, lane + 18),
        walker(imp(0), 'walk', 650, -11, lane + 14),
      ];
    default:
      return [];
  }
}
