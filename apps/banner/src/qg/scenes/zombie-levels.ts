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
import { barrel, crate, heliBody, OUT, sandbags } from './zombie-props';

export const ZOMBIE_LEVEL_COUNT = 5;
export const ZOMBIE_GROUND = 182;

export const ZOMBIE_LEVELS: LevelInfo[] = [
  {
    name: 'Base tranquila',
    blurb:
      'Base militar no deserto, cerca elétrica, zumbis nas bordas e um helicóptero em ronda. Tudo sob controle.',
    changes: [
      'Hangar, radar, torre, bandeira, caixotes e sacos de areia dentro da cerca.',
      'Zumbis encostados nas laterais da cerca; helicóptero de ronda.',
    ],
  },
  {
    name: 'Reforço',
    blurb:
      'A base se prepara: tenda, jipe, barreira de sacos de areia e soldados de guarda e de patrulha.',
    changes: [
      'Tenda de campanha, jipe e mais sacos de areia.',
      'Soldados: um de guarda e um patrulhando.',
      'Jornada: posto de controle com cancela, jipe estacionado, tenda e soldados.',
    ],
  },
  {
    name: 'Cerco',
    blurb:
      'Os zumbis se multiplicam: multidão colada na cerca, barris em chamas, holofotes e soldados em posição.',
    changes: [
      'Multidão bem maior nos dois lados da cerca.',
      'Barris em chamas e tripés de holofote.',
      'Jornada: barricada de sacos de areia com zumbis chegando e soldados atrás dela.',
    ],
  },
  {
    name: 'Alarme',
    blurb:
      'Sirene tocando: luzes vermelhas piscando, holofote varrendo a base, fumaça ao longe e soldados correndo.',
    changes: [
      'Luzes de alarme vermelhas e holofote da torre varrendo o terreno.',
      'Colunas de fumaça atrás da base.',
      'Jornada: carro em chamas com fumaça, torres de holofote, zumbis e soldados correndo.',
    ],
  },
  {
    name: 'Evacuação',
    blurb:
      'Hora de sair: heliponto com um helicóptero de resgate pousado, fumaça verde de sinalização, suprimentos e comboio.',
    changes: [
      'Heliponto com helicóptero de resgate e fumaça verde de sinalização.',
      'Pilhas de suprimentos e soldados carregando.',
      'Jornada: comboio de caminhão, fumaça de sinalização e o heliponto passando de vez em quando.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Gente: soldados e zumbis
// ---------------------------------------------------------------------------------------------

const SOLDIER: Look[] = [
  {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-buzzcut',
    hairColor: 'dark_brown',
    torso: 'torso-longsleeve-2',
    torsoColor: 'forest',
    legs: 'legs-pants',
    legsColor: 'forest',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'female',
    skin: 'brown',
    hair: 'hair-bangs-bun',
    hairColor: 'black',
    torso: 'torso-longsleeve-2',
    torsoColor: 'forest',
    legs: 'legs-pants',
    legsColor: 'charcoal',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'male',
    skin: 'bronze',
    hair: null,
    hairColor: 'black',
    torso: 'torso-tshirt',
    torsoColor: 'tan',
    legs: 'legs-pants',
    legsColor: 'forest',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
  {
    bodyType: 'female',
    skin: 'light',
    hair: 'hair-bob',
    hairColor: 'blonde',
    torso: 'torso-tshirt',
    torsoColor: 'forest',
    legs: 'legs-pants',
    legsColor: 'tan',
    feet: 'feet-revised-boots',
    feetColor: 'black',
  },
];

const ZOMBIES: Look[] = [
  {
    bodyType: 'male',
    skin: 'zombie_green',
    hair: null,
    hairColor: 'dark_gray',
    torso: 'torso-tshirt',
    torsoColor: 'gray',
    legs: 'legs-pants',
    legsColor: 'charcoal',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'zombie',
    hair: 'hair-natural',
    hairColor: 'dark_brown',
    torso: 'torso-longsleeve-2',
    torsoColor: 'maroon',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: null,
  },
  {
    bodyType: 'male',
    skin: 'zombie',
    hair: 'hair-buzzcut',
    hairColor: 'dark_gray',
    torso: 'torso-sleeveless-2',
    torsoColor: 'tan',
    legs: 'legs-shorts',
    legsColor: 'brown',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'zombie_green',
    hair: 'hair-bob',
    hairColor: 'dark_gray',
    torso: 'torso-cardigan',
    torsoColor: 'slate',
    legs: 'legs-pants',
    legsColor: 'black',
    feet: null,
  },
];

const soldier = (i: number): Look => SOLDIER[i % SOLDIER.length] ?? {};
const zombie = (i: number): Look => ZOMBIES[i % ZOMBIES.length] ?? {};

// ---------------------------------------------------------------------------------------------
// Objetos
// ---------------------------------------------------------------------------------------------

type Prop =
  | { k: 'jeep'; x: number; y: number; dir: 1 | -1; p?: number }
  | { k: 'truck'; x: number; y: number; dir: 1 | -1; p?: number }
  | { k: 'tent'; x: number; y: number; p?: number }
  | { k: 'gate'; x: number; y: number; p?: number }
  | { k: 'sandwall'; x: number; y: number; cols: number; p?: number }
  | { k: 'firebarrel'; x: number; y: number; p?: number }
  | { k: 'flood'; x: number; y: number; p?: number }
  | { k: 'wreck'; x: number; y: number; p?: number }
  | { k: 'smoke'; x: number; y: number; green?: boolean; f?: number; p?: number }
  | { k: 'siren'; x: number; y: number; p?: number }
  | { k: 'searchlight'; x: number; y: number; f?: number; p?: number }
  | { k: 'helipad'; x: number; y: number; p?: number }
  | { k: 'rescue'; x: number; y: number; p?: number }
  | { k: 'supplies'; x: number; y: number; p?: number }
  | { k: 'wire'; x: number; y: number; w: number; p?: number };

const GREEN = '#5b6a40';
const GREEN_DARK = '#3f4a2c';
const GREEN_LIGHT = '#7a8c58';

function wheel(env: SceneEnv, cx: number, cy: number, r: number): void {
  disc(env, cx, cy, r, OUT);
  disc(env, cx, cy, r - 1, '#2e322c');
  disc(env, cx, cy, Math.max(1, r - 3), '#8a9096');
}

/** Jipe militar de lado: capô, para-brisa baixo, estepe atrás e uma estrela branca. */
function jeep(env: SceneEnv, x: number, y: number, dir: 1 | -1): void {
  const fx = (dx: number, w: number): number => (dir > 0 ? x + dx : x - dx - w);
  rect(env, x - 22, y - 1, 46, 3, 'rgba(0,0,0,0.25)');
  rect(env, fx(-20, 40) - 1, y - 15, 42, 11, OUT);
  rect(env, fx(-20, 40), y - 14, 40, 9, GREEN);
  rect(env, fx(-20, 40), y - 14, 40, 2, GREEN_LIGHT);
  rect(env, fx(-20, 40), y - 7, 40, 2, GREEN_DARK);
  rect(env, fx(-5, 15) - 1, y - 23, 17, 10, OUT);
  rect(env, fx(-4, 13), y - 22, 13, 8, '#a8d4e6');
  rect(env, fx(-4, 13), y - 22, 13, 2, '#e4f5fd');
  rect(env, fx(-4, 2), y - 22, 2, 8, OUT);
  rect(env, fx(-12, 5) - 1, y - 23, 7, 9, OUT);
  rect(env, fx(-12, 5), y - 22, 5, 7, GREEN_DARK);
  rect(env, fx(14, 7), y - 16, 7, 3, OUT);
  rect(env, fx(15, 5), y - 15, 5, 1, '#ffe9a8');
  rect(env, fx(-8, 6), y - 12, 4, 4, '#f4f4f0');
  wheel(env, fx(-12, 0) + 0, y - 3, 4);
  wheel(env, fx(12, 0) + 0, y - 3, 4);
  disc(env, fx(-22, 0), y - 9, 3, OUT);
  disc(env, fx(-22, 0), y - 9, 2, '#2e322c');
}

/** Caminhão de carga: cabine à frente, lona esticada na carroceria e três eixos. */
function truck(env: SceneEnv, x: number, y: number, dir: 1 | -1): void {
  const fx = (dx: number, w: number): number => (dir > 0 ? x + dx : x - dx - w);
  rect(env, x - 32, y - 1, 66, 3, 'rgba(0,0,0,0.25)');
  rect(env, fx(-30, 60) - 1, y - 11, 62, 8, OUT);
  rect(env, fx(-30, 60), y - 10, 60, 6, GREEN_DARK);
  rect(env, fx(-30, 42) - 1, y - 33, 44, 24, OUT);
  rect(env, fx(-30, 42), y - 32, 42, 22, '#7a8c58');
  rect(env, fx(-30, 42), y - 32, 42, 3, '#9aab74');
  for (let i = 0; i < 4; i++) rect(env, fx(-26 + i * 10, 1), y - 30, 1, 19, GREEN_DARK);
  rect(env, fx(14, 17) - 1, y - 25, 19, 16, OUT);
  rect(env, fx(14, 17), y - 24, 17, 14, GREEN);
  rect(env, fx(20, 10), y - 22, 10, 7, '#a8d4e6');
  rect(env, fx(20, 10), y - 22, 10, 2, '#e4f5fd');
  rect(env, fx(26, 7), y - 13, 5, 3, '#ffe9a8');
  rect(env, fx(-4, 6), y - 8, 5, 5, '#f4f4f0');
  for (const dx of [-22, -8, 18]) wheel(env, fx(dx, 0), y - 4, 5);
}

function tent(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 22, y - 1, 46, 3, 'rgba(0,0,0,0.2)');
  for (let i = 0; i <= 24; i++) {
    const half = Math.round(20 * (i / 24));
    rect(env, x - half - 1, y - 26 + i, half * 2 + 3, 1, OUT);
  }
  for (let i = 0; i <= 24; i++) {
    const half = Math.round(20 * (i / 24));
    rect(env, x - half, y - 26 + i, half * 2 + 1, 1, i % 6 < 3 ? GREEN_LIGHT : '#6e7e4d');
  }
  rect(env, x - 1, y - 28, 3, 3, OUT);
  rect(env, x, y - 27, 1, 14, '#b5322e');
  rect(env, x + 1, y - 27, 5, 3, '#b5322e');
  rect(env, x - 5, y - 11, 11, 11, OUT);
  rect(env, x - 4, y - 10, 9, 10, '#2a2f22');
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) rect(env, x + side * (20 + k), y - 2 + k * 0, 1, 1, '#cfd2d8');
  }
}

/** Cancela de posto de controle: guarita pequena e barra listrada (que sobe e desce devagar). */
function gate(env: SceneEnv, x: number, y: number): void {
  const lift = Math.round(Math.max(0, Math.sin(env.t * 0.5)) * 10);
  rect(env, x - 6, y - 1, 78, 3, 'rgba(0,0,0,0.2)');
  rect(env, x - 5, y - 26, 16, 26, OUT);
  rect(env, x - 4, y - 25, 14, 24, '#a89868');
  rect(env, x - 2, y - 22, 10, 8, '#a8d4e6');
  rect(env, x - 6, y - 29, 18, 4, OUT);
  rect(env, x - 5, y - 28, 16, 2, GREEN);
  rect(env, x + 56, y - 14, 6, 14, OUT);
  rect(env, x + 57, y - 13, 4, 12, '#6c7380');
  for (let i = 0; i < 7; i++) {
    const bx = x + 12 + i * 7;
    const by = y - 15 - Math.round((lift * (bx - (x + 12))) / 49);
    rect(env, bx, by - 1, 8, 5, OUT);
    rect(env, bx, by, 7, 3, i % 2 ? '#f8f8f8' : '#e63946');
  }
}

function sandwall(env: SceneEnv, x: number, y: number, cols: number): void {
  sandbags(env, x, y, cols, 3);
}

function firebarrel(env: SceneEnv, x: number, y: number): void {
  barrel(env, x - 5, y, '#6b7a4a');
  rect(env, x - 4, y - 16, 8, 2, OUT);
  flame(env, x, y - 15, 2);
}

/** Tripé de holofote: três pés, haste e a cabeça da lâmpada (acende de noite). */
function flood(env: SceneEnv, x: number, y: number): void {
  const night = env.time === 'night';
  rect(env, x - 8, y, 17, 2, 'rgba(0,0,0,0.2)');
  for (const dx of [-7, 0, 7]) {
    for (let k = 0; k < 26; k++) rect(env, x + (dx * (26 - k)) / 26, y - k, 2, 1, OUT);
  }
  rect(env, x - 1, y - 40, 3, 16, OUT);
  rect(env, x - 6, y - 48, 13, 9, OUT);
  rect(env, x - 5, y - 47, 11, 7, '#8a9096');
  rect(env, x - 4, y - 46, 9, 5, night ? '#fff3b8' : '#d8dde0');
}

/** Carro destruído em chamas, com a carcaça escura e as rodas no chão. */
function wreck(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 22, y - 1, 46, 3, 'rgba(0,0,0,0.25)');
  rect(env, x - 21, y - 13, 42, 10, OUT);
  rect(env, x - 20, y - 12, 40, 8, '#4a3a30');
  rect(env, x - 20, y - 12, 40, 2, '#6a5444');
  rect(env, x - 11, y - 21, 22, 9, OUT);
  rect(env, x - 10, y - 20, 20, 7, '#3a302a');
  rect(env, x - 8, y - 19, 7, 5, '#1b1f22');
  rect(env, x + 1, y - 19, 7, 5, '#1b1f22');
  rect(env, x - 19, y - 8, 6, 3, '#8a4a2a');
  wheel(env, x - 12, y - 3, 4);
  wheel(env, x + 12, y - 3, 4);
  rect(env, x - 21, y - 12, 4, 3, '#14161c');
  flame(env, x - 3, y - 21, 3);
  flame(env, x + 8, y - 14, 2);
  flame(env, x - 14, y - 12, 2);
}

/** Coluna de fumaça: bolhas que sobem, crescem e somem; fase fixa por objeto. */
function smoke(env: SceneEnv, x: number, y: number, green = false): void {
  const { ctx } = env;
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const life = (env.t * 0.16 + i / 7) % 1;
    const cy = Math.round(y - life * 56);
    const cx = Math.round(x + Math.sin(i * 2.1 + life * 3) * 4 + life * 8);
    const r = Math.round(3 + life * 7);
    ctx.globalAlpha = (green ? 0.8 : 0.55) * (1 - life);
    disc(env, cx, cy, r, green ? '#5dd66a' : env.time === 'night' ? '#2a2d36' : '#4a4d55');
  }
  ctx.restore();
}

/** Luz de alarme giratória: lâmpada vermelha no alto de um poste, que acende e apaga. */
function siren(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 1, y - 30, 3, 30, OUT);
  rect(env, x, y - 30, 1, 30, '#6c7380');
  rect(env, x - 4, y - 37, 9, 8, OUT);
  const on = Math.sin(env.t * 6) > 0;
  rect(env, x - 3, y - 36, 7, 6, on ? '#ff3b30' : '#6a1f1c');
  if (on) rect(env, x - 2, y - 35, 2, 2, '#ffb0a8');
}

/** Holofote de torre: facho que varre o terreno de um lado para o outro. */
function searchlight(env: SceneEnv, x: number, y: number): void {
  const { ctx } = env;
  rect(env, x - 2, y - 44, 5, 44, OUT);
  rect(env, x - 1, y - 44, 3, 44, '#6c7380');
  rect(env, x - 6, y - 52, 13, 9, OUT);
  rect(env, x - 5, y - 51, 11, 7, '#8a9096');
  rect(env, x - 3, y - 49, 7, 3, env.time === 'night' ? '#fff3b8' : '#d8dde0');
  const angle = Math.PI / 2 + Math.sin(env.t * 0.7 + x * 0) * 0.75;
  const reach = 150;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = env.time === 'night' ? 0.2 : 0.07;
  ctx.fillStyle = '#fff3b8';
  ctx.beginPath();
  ctx.moveTo(x, y - 47);
  ctx.lineTo(x + Math.cos(angle - 0.09) * reach, y - 47 + Math.sin(angle - 0.09) * reach);
  ctx.lineTo(x + Math.cos(angle + 0.09) * reach, y - 47 + Math.sin(angle + 0.09) * reach);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Heliponto: círculo e "H" pintados no chão, achatados pela perspectiva. */
function helipad(env: SceneEnv, x: number, y: number): void {
  const { ctx } = env;
  ctx.save();
  ctx.fillStyle = 'rgba(40,44,38,0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y, 38, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f2c230';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  rect(env, x - 9, y - 5, 2, 10, '#f4f4f0');
  rect(env, x + 7, y - 5, 2, 10, '#f4f4f0');
  rect(env, x - 7, y - 1, 14, 2, '#f4f4f0');
}

/** Helicóptero de resgate pousado, com o rotor ainda girando. */
function rescue(env: SceneEnv, x: number, y: number): void {
  const { ctx } = env;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 21, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  heliBody(env, x, y - 11);
  if (env.time === 'night' && Math.sin(env.t * 5) > 0) rect(env, x + 14, y - 12, 2, 2, '#ffffff');
}

function supplies(env: SceneEnv, x: number, y: number): void {
  crate(env, x, y, 14);
  crate(env, x + 15, y, 12);
  crate(env, x + 4, y - 14, 12);
  rect(env, x + 29, y - 6, 8, 6, OUT);
  rect(env, x + 30, y - 5, 6, 4, '#c8b060');
}

/** Arame farpado esticado entre dois mourões. */
function wire(env: SceneEnv, x: number, y: number, w: number): void {
  rect(env, x, y - 12, 2, 12, OUT);
  rect(env, x + w, y - 12, 2, 12, OUT);
  for (let i = 0; i < w; i += 3) {
    const sag = Math.round(Math.sin((i / w) * Math.PI) * 3);
    rect(env, x + i, y - 9 + sag, 3, 1, '#9aa0a6');
    rect(env, x + i, y - 5 + sag, 3, 1, '#9aa0a6');
    if (i % 6 === 0) {
      rect(env, x + i + 1, y - 10 + sag, 1, 3, '#cfd2d8');
      rect(env, x + i + 1, y - 6 + sag, 1, 3, '#cfd2d8');
    }
  }
}

function drawProp(env: SceneEnv, prop: Prop, x: number): void {
  switch (prop.k) {
    case 'jeep':
      return grown(env, x, prop.y, 1.4, () => jeep(env, 0, 0, prop.dir));
    case 'truck':
      return grown(env, x, prop.y, 1.2, () => truck(env, 0, 0, prop.dir));
    case 'tent':
      return grown(env, x, prop.y, 1.3, () => tent(env, 0, 0));
    case 'gate':
      return gate(env, x, prop.y);
    case 'sandwall':
      return sandwall(env, x, prop.y, prop.cols);
    case 'firebarrel':
      return firebarrel(env, x, prop.y);
    case 'flood':
      return flood(env, x, prop.y);
    case 'wreck':
      return grown(env, x, prop.y, 1.5, () => wreck(env, 0, 0));
    case 'smoke':
      return smoke(env, x, prop.y, prop.green);
    case 'siren':
      return siren(env, x, prop.y);
    case 'searchlight':
      return searchlight(env, x, prop.y);
    case 'helipad':
      return helipad(env, x, prop.y);
    case 'rescue':
      return grown(env, x, prop.y, 1.25, () => rescue(env, 0, 0));
    case 'supplies':
      return supplies(env, x, prop.y);
    case 'wire':
      return wire(env, x, prop.y, prop.w);
  }
}

const RARE = 1640;
const LANE = 176;

const QG_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'jeep', x: 112, y: 214, dir: 1 },
    { k: 'tent', x: 252, y: 214 },
  ],
  3: [
    { k: 'firebarrel', x: 86, y: 206 },
    { k: 'firebarrel', x: 304, y: 212 },
    { k: 'flood', x: 96, y: 172 },
    { k: 'flood', x: 296, y: 172 },
  ],
  4: [
    { k: 'siren', x: 96, y: 172 },
    { k: 'searchlight', x: 300, y: 172 },
    { k: 'smoke', x: 84, y: 140 },
    { k: 'smoke', x: 318, y: 140 },
  ],
  5: [
    { k: 'helipad', x: 262, y: 200 },
    { k: 'rescue', x: 262, y: 200 },
    { k: 'smoke', x: 232, y: 152, green: true },
  ],
};

const JOURNEY_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'gate', x: 210, y: LANE + 6 },
    { k: 'jeep', x: 330, y: LANE + 26, dir: -1 },
    { k: 'tent', x: 520, y: LANE },
    { k: 'sandwall', x: 600, y: LANE + 2, cols: 3 },
  ],
  3: [
    { k: 'sandwall', x: 300, y: LANE + 4, cols: 5 },
    { k: 'wire', x: 340, y: LANE + 14, w: 50 },
    { k: 'firebarrel', x: 140, y: LANE },
    { k: 'firebarrel', x: 640, y: LANE },
    { k: 'flood', x: 460, y: LANE - 4 },
  ],
  4: [
    { k: 'wreck', x: 360, y: LANE + 6, p: RARE },
    { k: 'smoke', x: 350, y: LANE - 20, p: RARE },
    { k: 'smoke', x: 120, y: 150, f: 0.3 },
    { k: 'searchlight', x: 170, y: LANE - 2 },
    { k: 'searchlight', x: 590, y: LANE - 2 },
  ],
  5: [
    { k: 'truck', x: 300, y: LANE + 34, dir: -1 },
    { k: 'supplies', x: 460, y: LANE + 4 },
    { k: 'smoke', x: 600, y: LANE + 2, green: true },
    { k: 'helipad', x: 800, y: LANE + 6, p: RARE },
    { k: 'rescue', x: 800, y: LANE + 6, p: RARE },
  ],
};

const kit: PropKit<Prop> = {
  period: 820,
  qg: QG_PROPS,
  journey: JOURNEY_PROPS,
  draw: drawProp,
  light: (env, prop, x) => {
    switch (prop.k) {
      case 'firebarrel':
        return {
          x,
          y: prop.y - 18,
          radius: 56,
          color: [255, 150, 60],
          intensity: 0.65,
          flicker: true,
        };
      case 'wreck':
        return {
          x,
          y: prop.y - 16,
          radius: 80,
          color: [255, 140, 50],
          intensity: 0.7,
          flicker: true,
        };
      case 'flood':
        return { x, y: prop.y - 44, radius: 70, color: [255, 245, 200], intensity: 0.6 };
      case 'searchlight':
        return { x, y: prop.y - 48, radius: 50, color: [255, 245, 200], intensity: 0.5 };
      case 'siren':
        return Math.sin(env.t * 6) > 0
          ? {
              x,
              y: prop.y - 33,
              radius: 70,
              color: [255, 60, 50],
              intensity: 0.7,
              at: ['night', 'morning', 'afternoon'],
            }
          : null;
      case 'rescue':
        return { x: x + 28, y: prop.y - 4, radius: 46, color: [255, 245, 210], intensity: 0.5 };
      case 'smoke':
        return prop.green
          ? { x, y: prop.y - 10, radius: 40, color: [90, 220, 100], intensity: 0.4 }
          : null;
      case 'gate':
        return { x: x + 4, y: prop.y - 20, radius: 40, color: [255, 220, 150], intensity: 0.4 };
      case 'tent':
        return { x, y: prop.y - 8, radius: 36, color: [255, 210, 130], intensity: 0.35 };
      default:
        return null;
    }
  },
};

export const zombieLevelLayers = propLayers(kit, ZOMBIE_LEVEL_COUNT);

// ---------------------------------------------------------------------------------------------
// Figurantes
// ---------------------------------------------------------------------------------------------

const level = (n: number): number => Math.min(ZOMBIE_LEVEL_COUNT, Math.max(1, n));

/** Soldados e zumbis a mais do QG (a multidão do nível 1 é montada pelo cenário). */
export function zombieExtras(n: number): ExtraCharacter[] {
  switch (level(n)) {
    case 2:
      return [stand(soldier(0), 236, 180, 'left'), roamer(soldier(1), 'walk', 170, 300, 14, 216)];
    case 3:
      return [
        stand(soldier(2), 150, 198, 'right'),
        stand(soldier(3), 238, 196, 'left'),
        stand(zombie(1), 6, 160, 'right'),
        stand(zombie(2), 46, 156, 'right'),
        stand(zombie(3), 384, 160, 'left'),
        stand(zombie(0), 344, 156, 'left'),
      ];
    case 4:
      return [
        roamer(soldier(0), 'run', 120, 280, 44, 216),
        stand(soldier(2), 238, 180, 'down'),
        stand(soldier(3), 150, 180, 'down'),
      ];
    case 5:
      return [
        stand(soldier(1), 226, 214, 'right'),
        stand(soldier(0), 150, 200, 'right'),
        roamer(soldier(3), 'walk', 100, 190, 11, 218),
      ];
    default:
      return [];
  }
}

/** Jornada: posições do mundo (ciclo de 820 px; o que acompanha um objeto raro usa o ciclo dele). */
export function zombieJourneyExtras(n: number): ExtraCharacter[] {
  const lane = LANE;
  switch (level(n)) {
    case 2:
      return [
        stander(soldier(0), 160, lane + 6, 'right'),
        stander(soldier(1), 440, lane + 4, 'left'),
        walker(soldier(3), 'walk', 100, 12, lane + 30),
      ];
    case 3:
      return [
        stander(soldier(0), 318, lane - 14, 'right'),
        stander(soldier(1), 346, lane - 14, 'right'),
        walker(zombie(0), 'walk', 560, 6, lane - 12),
        walker(zombie(1), 'walk', 586, 5, lane - 16),
        walker(zombie(2), 'walk', 612, 6, lane - 10),
        walker(zombie(3), 'walk', 40, 6, lane + 30),
        stander(soldier(2), 640, lane - 10, 'down'),
      ];
    case 4:
      return [
        walker(soldier(0), 'run', 60, 44, lane + 28),
        walker(zombie(0), 'walk', 300, -8, lane - 10),
        walker(zombie(2), 'walk', 520, 7, lane + 30),
        walker(zombie(1), 'walk', 700, -6, lane - 14),
        stander(soldier(3), 150, lane - 8, 'left'),
      ];
    case 5:
      return [
        stander(soldier(1), 130, lane + 10, 'right'),
        stander(soldier(0), 395, lane + 4, 'left'),
        stander(soldier(2), 520, lane - 8, 'right'),
        { ...stander(soldier(3), 728, lane - 10, 'right', RARE) },
        { ...stander(soldier(0), 874, lane - 12, 'left', RARE) },
        walker(soldier(1), 'walk', 640, 14, lane + 18),
      ];
    default:
      return [];
  }
}
