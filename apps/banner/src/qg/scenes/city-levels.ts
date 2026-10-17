import { LAMP_WORLD, STREET_PERIOD } from './city-street';
import { rect, scrolled } from './draw';
import {
  balloons,
  CASUAL,
  disc,
  fireworks,
  flagLine,
  grown,
  type PropKit,
  propLayers,
  roamer,
  stand,
  stander,
  walker,
} from './level-kit';
import type { ExtraCharacter, LevelInfo, Light, SceneEnv } from './types';
import { SCENE_W } from './types';

export const CITY_LEVEL_COUNT = 5;
const OUT = '#14161c';
/** Altura dos pés do personagem na cidade. */
export const CITY_GROUND = 190;

export const CITY_LEVELS: LevelInfo[] = [
  {
    name: 'Terraço tranquilo',
    blurb:
      'A cidade vista de cima, num fim de tarde calmo: lago ao fundo, vasos, espreguiçadeira e a avenida quase vazia.',
    changes: [
      'Terraço com espreguiçadeira, vasos e pisca-pisca; lago e prédios ao fundo.',
      'Na jornada: avenida, ponto de ônibus e postes, sem ninguém na calçada.',
    ],
  },
  {
    name: 'Bairro vivo',
    blurb:
      'O bairro acorda: pombos no céu, mesa de café no terraço e, na rua, árvores, carrinho de cachorro-quente e pedestres.',
    changes: [
      'Pombos cruzam o céu.',
      'Terraço: mesa de café com guarda-sol e uma vizinha olhando a vista.',
      'Jornada: árvores em canteiros, carrinho de cachorro-quente, banco e pedestres.',
    ],
  },
  {
    name: 'Centro movimentado',
    blurb:
      'O centro: dirigível no céu, faixa de pedestres, semáforo, banca de jornal e bastante gente indo e vindo.',
    changes: [
      'Dirigível passando devagar no céu.',
      'Terraço: luneta de observação e um casal conversando.',
      'Jornada: faixa de pedestres, semáforo, banca de jornal, corredor e gente andando.',
    ],
  },
  {
    name: 'Feriado na cidade',
    blurb:
      'Feira de rua em dia de festa: bandeirinhas, balões, barracas e gente comemorando; à noite, fogos.',
    changes: [
      'Bandeirinhas no corrimão do terraço e entre os postes da rua.',
      'Balões amarrados, mesa de bolo no terraço e barracas de feira na calçada.',
      'Fogos de artifício à noite e um avião rebocando uma faixa de bandeirinhas no céu.',
    ],
  },
  {
    name: 'Metrópole de neon',
    blurb:
      'A cidade grande que não dorme: letreiros de neon, drones no ar e a rua cheia de luz e de gente.',
    changes: [
      'Letreiros de neon nos prédios e na calçada (acendem à noite).',
      'Drones com luzes piscando cruzam o céu.',
      'Muita gente na rua e no terraço.',
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Céu: pombos, dirigível, drones, fogos (desenhados atrás dos prédios)
// ---------------------------------------------------------------------------------------------

function pigeons(env: SceneEnv): void {
  const color = env.time === 'night' ? '#8b94c8' : '#4a4f5c';
  for (let i = 0; i < 5; i++) {
    const span = SCENE_W + 60;
    const x = Math.round((((env.t * (14 + i) + i * 61) % span) + span) % span) - 30;
    const y = 40 + i * 7 + Math.round(Math.sin(env.t * 0.8 + i) * 2);
    const flap = Math.sin(env.t * 5 + i * 1.4) > 0;
    // pássaro de longe: corpo e duas asas em "v" que sobem e descem
    rect(env, x, y + 1, 1, 1, color);
    rect(env, x - 1, flap ? y : y + 1, 1, 1, color);
    rect(env, x + 1, flap ? y : y + 1, 1, 1, color);
    rect(env, x - 2, flap ? y - 1 : y + 2, 1, 1, color);
    rect(env, x + 2, flap ? y - 1 : y + 2, 1, 1, color);
  }
}

/** Elipse cheia em pixels inteiros, linha a linha. */
function oval(env: SceneEnv, cx: number, cy: number, rx: number, ry: number, color: string): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.5)));
    rect(env, cx - half, cy + dy, half * 2 + 1, 1, color);
  }
}

function blimp(env: SceneEnv): void {
  const span = SCENE_W + 160;
  const x = Math.round(SCENE_W + 70 - ((env.t * 6) % span));
  const y = 40 + Math.round(Math.sin(env.t * 0.5) * 1);
  const night = env.time === 'night';
  // cauda: duas barbatanas cruzadas
  rect(env, x + 18, y - 9, 6, 7, OUT);
  rect(env, x + 19, y - 8, 4, 5, '#e63946');
  rect(env, x + 18, y + 3, 6, 7, OUT);
  rect(env, x + 19, y + 4, 4, 5, '#e63946');
  // casco
  oval(env, x, y, 25, 8, OUT);
  oval(env, x, y, 24, 7, night ? '#9aa6d8' : '#f2f2ee');
  oval(env, x, y + 4, 22, 3, night ? '#6e7ab0' : '#c8ccd2');
  rect(env, x - 16, y - 1, 34, 2, '#e63946');
  rect(env, x - 12, y - 6, 22, 1, night ? '#c8d0f0' : '#ffffff');
  // cabine e hélice
  rect(env, x - 6, y + 9, 12, 5, OUT);
  rect(env, x - 5, y + 10, 10, 3, '#59606e');
  rect(env, x - 3, y + 10, 6, 1, night ? '#ffe28a' : '#bfe3f8');
  rect(env, x + 26, y - 1, 1, 3, Math.sin(env.t * 20) > 0 ? '#59606e' : '#cfd2d8');
}

/** Avião de hélice com uma faixa de bandeirinhas atrás; cruza o céu e some por um tempo. */
function airplane(env: SceneEnv): void {
  const span = SCENE_W + 420;
  const x = Math.round(((env.t * 22 + 60) % span) - 150);
  const y = 34 + Math.round(Math.sin(env.t * 0.7) * 2);
  const night = env.time === 'night';
  const body = night ? '#c9d0ee' : '#f4f4f0';
  // faixa rebocada: corda e bandeirinhas ondulando
  const colors = ['#e63946', '#ffc93c', '#6aa8e0', '#7bd88f', '#ff6fa8'];
  rect(env, x - 18 - 8 * 7, y + 2, 8 * 7 + 6, 1, '#59606e');
  for (let i = 0; i < 9; i++) {
    const fx = x - 18 - i * 7;
    const fy = y + 2 + Math.round(Math.sin(env.t * 3 - i * 0.9) * 2);
    rect(env, fx, fy, 6, 1, OUT);
    rect(env, fx + 1, fy + 1, 4, 5, OUT);
    rect(env, fx + 2, fy + 1, 2, 4, colors[i % colors.length] ?? '#e63946');
  }
  // cauda, fuselagem, asa e hélice
  rect(env, x - 17, y - 8, 5, 8, OUT);
  rect(env, x - 16, y - 7, 3, 6, '#e63946');
  oval(env, x, y, 15, 5, OUT);
  oval(env, x, y, 14, 4, body);
  rect(env, x - 12, y + 1, 26, 1, '#c0302f');
  rect(env, x + 4, y - 4, 6, 3, OUT);
  rect(env, x + 5, y - 3, 4, 2, night ? '#ffe28a' : '#9fd4f0');
  rect(env, x - 5, y + 1, 14, 3, OUT);
  rect(env, x - 4, y + 2, 12, 1, night ? '#9aa6d8' : '#dde1e6');
  rect(env, x + 15, y - 4, 1, 9, Math.sin(env.t * 30) > 0 ? '#59606e' : '#cfd2d8');
}

function drones(env: SceneEnv): void {
  for (let i = 0; i < 3; i++) {
    const span = SCENE_W + 80;
    const x = Math.round((((env.t * (10 + i * 4) + i * 140) % span) + span) % span) - 40;
    const y = 30 + i * 14 + Math.round(Math.sin(env.t * 1.3 + i * 2) * 2);
    rect(env, x - 3, y, 7, 2, OUT);
    rect(env, x - 5, y - 1, 3, 1, '#9aa0ab');
    rect(env, x + 3, y - 1, 3, 1, '#9aa0ab');
    const on = Math.sin(env.t * 6 + i * 2) > 0;
    rect(env, x, y + 2, 1, 1, on ? '#ff3b30' : '#5a1f1c');
  }
}

/** Céu do nível, chamado pelo cenário logo depois de pintar o céu. */
export function citySky(env: SceneEnv): void {
  const level = Math.min(CITY_LEVEL_COUNT, Math.max(1, env.level));
  if (level === 2) pigeons(env);
  if (level === 3) blimp(env);
  if (level === 4) airplane(env);
  if (level === 4)
    fireworks(env, [
      [70, 40, '#ff6fa8', 0],
      [210, 28, '#ffd43b', 1.2],
      [330, 46, '#6aa8e0', 2.2],
    ]);
  if (level === 5) drones(env);
}

// ---------------------------------------------------------------------------------------------
// Objetos da rua e do terraço
// ---------------------------------------------------------------------------------------------

type Prop =
  | { k: 'tree'; x: number; y: number; p?: number; f?: number }
  | { k: 'hotdog'; x: number; y: number; p?: number }
  | { k: 'bench'; x: number; y: number; p?: number }
  | { k: 'newsstand'; x: number; y: number; p?: number }
  | { k: 'signal'; x: number; y: number; p?: number }
  | { k: 'stall'; x: number; y: number; color: string; p?: number }
  | { k: 'balloons'; x: number; y: number; colors: string[]; p?: number }
  | { k: 'neon'; x: number; y: number; color: string; kind: number; p?: number }
  | { k: 'cafe'; x: number; y: number }
  | { k: 'telescope'; x: number; y: number }
  | { k: 'cake'; x: number; y: number }
  | { k: 'railflags'; x: number; y: number };

/** Árvore de canteiro: tronco curto, copa redonda com sombra e luz. */
function tree(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 9, y - 4, 18, 5, OUT);
  rect(env, x - 8, y - 3, 16, 3, '#8a8f99');
  rect(env, x - 2, y - 22, 5, 19, OUT);
  rect(env, x - 1, y - 21, 3, 18, '#7a4f26');
  disc(env, x, y - 30, 12, OUT);
  disc(env, x, y - 30, 11, '#2f8f4a');
  disc(env, x - 3, y - 33, 7, '#43b05f');
  rect(env, x - 6, y - 37, 3, 2, '#7bd88f');
  rect(env, x + 3, y - 26, 6, 2, '#23703a');
}

function hotdog(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 14, y, 30, 2, 'rgba(0,0,0,0.25)');
  rect(env, x + 1, y - 40, 1, 24, OUT);
  for (let i = 0; i < 5; i++) {
    const w = 38 - i * 7;
    rect(env, x + 1 - w / 2 - 1, y - 40 - i * 2, w + 2, 4, OUT);
    rect(env, x + 1 - w / 2, y - 39 - i * 2, w, 2, i % 2 ? '#f8f8f8' : '#e63946');
  }
  rect(env, x - 13, y - 17, 28, 15, OUT);
  rect(env, x - 12, y - 16, 26, 13, '#c84a3a');
  rect(env, x - 12, y - 16, 26, 3, '#e8b84a');
  rect(env, x - 10, y - 12, 8, 5, '#f4f4f4');
  rect(env, x + 2, y - 12, 10, 5, '#9aa0ab');
  disc(env, x - 8, y - 2, 3, OUT);
  disc(env, x + 8, y - 2, 3, OUT);
  disc(env, x - 8, y - 2, 1, '#9aa0ab');
  disc(env, x + 8, y - 2, 1, '#9aa0ab');
  const steam = Math.round(Math.sin(env.t * 1.2) * 1);
  rect(env, x - 6 + steam, y - 22, 1, 3, 'rgba(255,255,255,0.5)');
  rect(env, x - 4 - steam, y - 26, 1, 3, 'rgba(255,255,255,0.35)');
}

function bench(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 2, y, 38, 2, 'rgba(0,0,0,0.2)');
  rect(env, x + 1, y - 8, 2, 8, OUT);
  rect(env, x + 31, y - 8, 2, 8, OUT);
  rect(env, x, y - 18, 34, 12, OUT);
  for (let i = 0; i < 3; i++)
    rect(env, x + 1, y - 17 + i * 3, 32, 2, i % 2 ? '#9a6a34' : '#b8803f');
  rect(env, x, y - 10, 34, 3, OUT);
  rect(env, x + 1, y - 9, 32, 1, '#c99555');
}

function newsstand(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 2, y, 36, 2, 'rgba(0,0,0,0.25)');
  rect(env, x, y - 36, 32, 36, OUT);
  rect(env, x + 1, y - 35, 30, 34, '#3d6fb5');
  rect(env, x + 1, y - 35, 30, 2, '#7aa6e0');
  rect(env, x + 3, y - 29, 26, 16, '#14161c');
  const mags = ['#e63946', '#ffc93c', '#f4f4f4', '#2a9d8f', '#ff7a2e', '#6aa8e0'];
  mags.forEach((color, i) => {
    rect(env, x + 4 + (i % 3) * 8, y - 28 + Math.floor(i / 3) * 7, 6, 6, color);
  });
  rect(env, x + 1, y - 12, 30, 3, '#d9a84a');
  rect(env, x - 3, y - 40, 38, 6, OUT);
  for (let i = 0; i < 7; i++) rect(env, x - 2 + i * 5, y - 39, 5, 4, i % 2 ? '#f8f8f8' : '#e63946');
}

function signal(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 2, y, 6, 2, 'rgba(0,0,0,0.25)');
  rect(env, x - 1, y - 46, 3, 46, OUT);
  rect(env, x, y - 46, 1, 46, '#6c7380');
  rect(env, x - 4, y - 62, 9, 18, OUT);
  const phase = Math.floor((env.t % 6) / 2);
  const colors = ['#e63946', '#ffc93c', '#3ddc84'];
  colors.forEach((color, i) => {
    const on = phase === (i === 0 ? 0 : i === 1 ? 2 : 1);
    rect(env, x - 2, y - 60 + i * 5, 5, 4, on ? color : '#2a2d36');
  });
}

function stall(env: SceneEnv, x: number, y: number, color: string): void {
  rect(env, x - 2, y, 46, 3, 'rgba(0,0,0,0.22)');
  rect(env, x, y - 30, 2, 30, OUT);
  rect(env, x + 38, y - 30, 2, 30, OUT);
  rect(env, x + 2, y - 26, 36, 12, '#4a2f17');
  const goods = ['#e63946', '#ffc93c', '#2a9d8f', '#ff7a2e', '#6aa8e0', '#ff6fa8'];
  goods.forEach((c, i) => rect(env, x + 4 + i * 6, y - 23, 4, 6, c));
  rect(env, x - 1, y - 14, 42, 14, OUT);
  rect(env, x, y - 13, 40, 12, '#c99555');
  rect(env, x, y - 13, 40, 2, '#e2b873');
  rect(env, x - 4, y - 38, 48, 10, OUT);
  for (let i = 0; i < 8; i++) {
    rect(env, x - 3 + i * 6, y - 37, 6, 6, i % 2 ? '#f8f8f8' : color);
    rect(env, x - 3 + i * 6, y - 31, 6, 2, i % 2 ? color : '#f8f8f8');
  }
}

/** Letreiro de neon vertical: contorno escuro, tubo colorido e um desenho simples por tipo. */
function neon(env: SceneEnv, x: number, y: number, color: string, kind: number): void {
  const night = env.time === 'night';
  const lit = night || env.time === 'morning';
  rect(env, x - 1, y - 8, 3, 8, OUT);
  rect(env, x - 7, y - 40, 15, 33, OUT);
  rect(env, x - 6, y - 39, 13, 31, night ? '#0b0f22' : '#2b303b');
  const tube = lit ? color : '#6c7380';
  const flicker = night && Math.sin(env.t * 9 + x) > 0.92 ? 0.4 : 1;
  env.ctx.globalAlpha = flicker;
  if (kind === 0) {
    rect(env, x - 4, y - 36, 9, 2, tube);
    rect(env, x - 4, y - 36, 2, 9, tube);
    rect(env, x - 4, y - 29, 9, 2, tube);
    rect(env, x + 3, y - 29, 2, 8, tube);
    rect(env, x - 4, y - 21, 9, 2, tube);
  } else if (kind === 1) {
    rect(env, x - 1, y - 36, 3, 26, tube);
    rect(env, x - 5, y - 36, 11, 3, tube);
    rect(env, x - 5, y - 14, 11, 3, tube);
  } else {
    disc(env, x, y - 24, 6, tube);
    disc(env, x, y - 24, 4, night ? '#0b0f22' : '#2b303b');
    rect(env, x - 1, y - 27, 3, 6, tube);
  }
  env.ctx.globalAlpha = 1;
}

function cafe(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 18, y, 38, 2, 'rgba(0,0,0,0.25)');
  rect(env, x, y - 40, 2, 40, OUT);
  for (let i = 0; i < 6; i++) {
    const w = 44 - i * 7;
    rect(env, x + 1 - w / 2 - 1, y - 44 - i * 2, w + 2, 4, OUT);
    rect(env, x + 1 - w / 2, y - 43 - i * 2, w, 2, i % 2 ? '#f8f8f8' : '#ff7a2e');
  }
  rect(env, x - 12, y - 18, 26, 4, OUT);
  rect(env, x - 11, y - 17, 24, 2, '#d9d2c0');
  rect(env, x - 1, y - 14, 4, 14, OUT);
  rect(env, x, y - 14, 2, 14, '#8a909c');
  rect(env, x - 6, y - 21, 3, 3, '#f4f4f4');
  rect(env, x + 6, y - 21, 3, 3, '#e63946');
  for (const side of [-1, 1]) {
    const cx = x + side * 17;
    rect(env, cx - 3, y - 16, 7, 3, OUT);
    rect(env, cx - 2, y - 15, 5, 1, '#c8693a');
    rect(env, cx - 2, y - 13, 2, 13, OUT);
    rect(env, cx + 2, y - 13, 2, 13, OUT);
  }
}

function telescope(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 8, y, 18, 2, 'rgba(0,0,0,0.25)');
  for (const dx of [-7, 0, 7]) {
    const lx = x + dx;
    for (let k = 0; k < 20; k++) rect(env, x + (lx - x) * (k / 20), y - 20 + k, 2, 1, OUT);
  }
  rect(env, x - 12, y - 30, 24, 6, OUT);
  rect(env, x - 11, y - 29, 22, 4, '#c9ced6');
  rect(env, x - 11, y - 29, 22, 1, '#ffffff');
  rect(env, x + 9, y - 32, 6, 9, OUT);
  rect(env, x + 10, y - 31, 4, 7, '#2a6fd6');
}

function cake(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 16, y, 38, 2, 'rgba(0,0,0,0.25)');
  rect(env, x - 15, y - 18, 34, 4, OUT);
  rect(env, x - 14, y - 17, 32, 2, '#f2e6cc');
  rect(env, x - 12, y - 14, 3, 14, OUT);
  rect(env, x + 15, y - 14, 3, 14, OUT);
  rect(env, x - 9, y - 31, 20, 13, OUT);
  rect(env, x - 8, y - 30, 18, 11, '#ff9ec2');
  rect(env, x - 8, y - 30, 18, 3, '#ffffff');
  for (let i = 0; i < 3; i++) {
    rect(env, x - 5 + i * 6, y - 37, 1, 6, '#ffd43b');
    if (Math.sin(env.t * 6 + i) > -0.2) rect(env, x - 5 + i * 6, y - 39, 1, 2, '#ff7a2e');
  }
  rect(env, x + 14, y - 25, 7, 7, '#2a9d8f');
  rect(env, x + 17, y - 25, 1, 7, '#ffd43b');
}

/** Bandeirinhas ligando os postes do corrimão do terraço. */
function railFlags(env: SceneEnv): void {
  for (let x = 0; x < SCENE_W; x += 48) flagLine(env, x, 112, x + 48, 112, 8, x / 48);
}

function drawProp(env: SceneEnv, prop: Prop, x: number): void {
  switch (prop.k) {
    case 'tree':
      return tree(env, x, prop.y);
    case 'hotdog':
      return grown(env, x, prop.y, 1.3, () => hotdog(env, 0, 0));
    case 'bench':
      return bench(env, x, prop.y);
    case 'newsstand':
      return grown(env, x, prop.y, 1.25, () => newsstand(env, 0, 0));
    case 'signal':
      return signal(env, x, prop.y);
    case 'stall':
      return stall(env, x, prop.y, prop.color);
    case 'balloons':
      return balloons(env, x, prop.y, prop.colors, x * 0.05);
    case 'neon':
      return neon(env, x, prop.y, prop.color, prop.kind);
    case 'cafe':
      return cafe(env, x, prop.y);
    case 'telescope':
      return telescope(env, x, prop.y);
    case 'cake':
      return cake(env, x, prop.y);
    case 'railflags':
      return railFlags(env);
  }
}

const PINK = '#ff4fa3';
const CYAN = '#35e0ff';
const LIME = '#a6ff4d';

const QG_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [{ k: 'cafe', x: 258, y: 200 }],
  3: [{ k: 'telescope', x: 304, y: 198 }],
  4: [
    { k: 'railflags', x: 0, y: 0 },
    { k: 'balloons', x: 20, y: 150, colors: ['#e63946', '#ffc93c', '#2a9d8f'] },
    { k: 'balloons', x: 300, y: 150, colors: ['#ff6fa8', '#6aa8e0', '#ff7a2e'] },
    { k: 'cake', x: 262, y: 200 },
  ],
  5: [
    { k: 'neon', x: 40, y: 120, color: PINK, kind: 0 },
    { k: 'neon', x: 112, y: 112, color: CYAN, kind: 2 },
    { k: 'neon', x: 188, y: 120, color: LIME, kind: 1 },
  ],
};

/** Na jornada: posições do mundo, ciclo de 900 px (o mesmo dos postes), objetos raros com ciclo maior. */
const RARE = STREET_PERIOD * 2;
const SIDE = 186;

const JOURNEY_PROPS: Record<number, Prop[]> = {
  1: [],
  2: [
    { k: 'tree', x: 180, y: SIDE },
    { k: 'hotdog', x: 290, y: SIDE + 2 },
    { k: 'bench', x: 745, y: SIDE + 2 },
    { k: 'tree', x: 810, y: SIDE },
  ],
  3: [
    { k: 'signal', x: 262, y: SIDE + 2, p: RARE },
    { k: 'newsstand', x: 730, y: SIDE + 4 },
    { k: 'bench', x: 170, y: SIDE + 2 },
  ],
  4: [
    { k: 'stall', x: 190, y: SIDE + 4, color: '#e63946' },
    { k: 'balloons', x: 170, y: SIDE + 2, colors: ['#e63946', '#ffc93c', '#2a9d8f'] },
    { k: 'stall', x: 760, y: SIDE + 4, color: '#2a9d8f' },
    { k: 'balloons', x: 810, y: SIDE + 2, colors: ['#ff6fa8', '#6aa8e0', '#ff7a2e'] },
  ],
  5: [
    { k: 'neon', x: 170, y: SIDE + 2, color: PINK, kind: 0 },
    { k: 'neon', x: 300, y: SIDE + 2, color: CYAN, kind: 2 },
    { k: 'neon', x: 760, y: SIDE + 2, color: LIME, kind: 1 },
  ],
};

const kit: PropKit<Prop> = {
  period: STREET_PERIOD,
  qg: QG_PROPS,
  journey: JOURNEY_PROPS,
  draw: drawProp,
  light: (env, prop, x) => {
    switch (prop.k) {
      case 'neon': {
        const rgb: [number, number, number] =
          prop.color === PINK
            ? [255, 80, 170]
            : prop.color === CYAN
              ? [60, 220, 255]
              : [170, 255, 80];
        return { x, y: prop.y - 24, radius: 46, color: rgb, intensity: 0.7 };
      }
      case 'stall':
        return { x: x + 20, y: prop.y - 22, radius: 60, color: [255, 200, 120], intensity: 0.45 };
      case 'hotdog':
        return { x, y: prop.y - 12, radius: 40, color: [255, 190, 110], intensity: 0.35 };
      case 'signal':
        return { x, y: prop.y - 54, radius: 22, color: [255, 120, 100], intensity: 0.35 };
      case 'cafe':
        return { x, y: prop.y - 30, radius: 50, color: [255, 210, 140], intensity: 0.4 };
      case 'cake':
        return { x, y: prop.y - 30, radius: 40, color: [255, 200, 140], intensity: 0.4 };
      default:
        return null;
    }
  },
};

export const cityLevelLayers = propLayers(kit, CITY_LEVEL_COUNT);

/** Bandeirinhas entre os postes da rua (no mundo, presas às pontas dos postes). */
export function cityStreetFlags(env: SceneEnv): void {
  if (env.level !== 4 || !env.journey) return;
  LAMP_WORLD.forEach((world, i) => {
    const next = (LAMP_WORLD[i + 1] ?? (LAMP_WORLD[0] ?? 0) + STREET_PERIOD) - world;
    const start = Math.round(scrolled(world, env.scroll, STREET_PERIOD));
    flagLine(env, start + 6, 134, start + next + 6, 134, 12, i);
  });
}

/** Marcas no asfalto: a faixa de pedestres do nível 3, que passa sob os carros. */
export function cityRoadMarks(env: SceneEnv): void {
  if (env.level !== 3 || !env.journey) return;
  const x = Math.round(scrolled(310, env.scroll, STREET_PERIOD * 2));
  if (x < -60 || x > SCENE_W + 20) return;
  for (let i = 0; i < 7; i++)
    rect(env, x + i * 8, 148, 5, 29, env.time === 'night' ? '#c8c8cc' : '#f4f4f6');
}

// ---------------------------------------------------------------------------------------------
// Gente
// ---------------------------------------------------------------------------------------------

const person = (i: number): (typeof CASUAL)[number] => CASUAL[i % CASUAL.length] ?? {};

/** QG: o terraço (a lounger fica em 104 e os vasos em 334 e 368). */
export function cityExtras(level: number): ExtraCharacter[] {
  switch (Math.min(CITY_LEVEL_COUNT, Math.max(1, level))) {
    case 2:
      return [stand(person(2), 300, 178, 'up'), stand(person(1), 232, 202, 'right')];
    case 3:
      return [
        stand(person(4), 232, 198, 'right'),
        stand(person(3), 254, 198, 'left'),
        roamer(person(5), 'run', 20, 370, 50, 214),
      ];
    case 4:
      return [
        stand(person(6), 240, 204, 'down'),
        stand(person(0), 284, 204, 'down'),
        stand(person(7), 64, 176, 'up'),
        roamer(person(2), 'walk', 40, 360, 13, 216),
      ];
    case 5:
      return [
        stand(person(4), 34, 176, 'up'),
        stand(person(1), 236, 176, 'up'),
        stand(person(6), 292, 176, 'up'),
        roamer(person(3), 'walk', 30, 360, 14, 214),
        roamer(person(0), 'walk', 350, 40, 11, 206),
      ];
    default:
      return [];
  }
}

/** Jornada: a calçada vai de y 183 a 220; quem anda fica abaixo da linha do personagem. */
export function cityJourneyExtras(level: number): ExtraCharacter[] {
  switch (Math.min(CITY_LEVEL_COUNT, Math.max(1, level))) {
    case 2:
      return [
        stander(person(1), 248, SIDE + 4, 'right'),
        walker(person(0), 'walk', 100, 12, 208),
        walker(person(4), 'walk', 560, -10, 214),
        stander(person(2), 735, SIDE + 2, 'left'),
      ];
    case 3:
      return [
        stander(person(4), 292, SIDE + 4, 'up', RARE),
        stander(person(3), 312, SIDE + 4, 'up', RARE),
        stander(person(2), 700, SIDE + 6, 'right'),
        walker(person(5), 'run', 40, 40, 212),
        walker(person(6), 'walk', 480, 12, 208),
        walker(person(0), 'walk', 760, -11, 215),
      ];
    case 4:
      return [
        stander(person(1), 252, SIDE + 6, 'left'),
        stander(person(6), 274, SIDE + 6, 'left'),
        stander(person(3), 720, SIDE + 6, 'right'),
        walker(person(7), 'walk', 420, 12, 210),
        walker(person(2), 'walk', 620, -10, 215),
      ];
    case 5:
      return [
        stander(person(4), 200, SIDE + 6, 'right'),
        stander(person(5), 326, SIDE + 6, 'left'),
        stander(person(1), 786, SIDE + 6, 'left'),
        walker(person(6), 'walk', 90, 13, 208),
        walker(person(0), 'walk', 520, -12, 214),
        walker(person(3), 'run', 700, -34, 211),
      ];
    default:
      return [];
  }
}

export type { Light };
