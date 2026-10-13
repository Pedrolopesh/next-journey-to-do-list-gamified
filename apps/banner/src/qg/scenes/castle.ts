import { bands, flame, portal, rect, rng, scrolled, shadedBlock, sky } from './draw';
import type { Light, SceneDef, SceneEnv, TimeOfDay } from './types';
import { SCENE_W } from './types';

const FLOOR = 124;
const CX = SCENE_W / 2;
/** Altura do chão do tablado, onde o trono se apoia. */
const DAIS_TOP = 146;

const OUT = '#14161c';
const GOLD = '#e2b02e';
const GOLD_DARK = '#a8791a';
const GOLD_LIGHT = '#ffe07a';
const VELVET = '#a31f2a';
const VELVET_DARK = '#741420';
const STEEL = '#aab3c2';
const STEEL_DARK = '#6e7889';
const STEEL_LIGHT = '#dbe2ee';

const CANDELABRA = [142, 248] as const;
const CANDLE_Y = 130;

const block = (
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  dark: string,
  light: string,
): void => {
  shadedBlock(env, x, y, w, h, fill, dark, light, OUT);
};

function torch(env: SceneEnv, x: number): void {
  rect(env, x - 3, 67, 6, 22, OUT);
  rect(env, x - 2, 68, 4, 20, '#4a3320');
  rect(env, x - 2, 68, 1, 20, '#6b4a2a');
  block(env, x - 6, 62, 12, 6, '#5a5f6b', '#3a3e48', '#8d93a1');
  flame(env, x, 62, 2);
}

function banner(env: SceneEnv, x: number): void {
  const w = 22;
  rect(env, x - 3, 17, w + 6, 5, OUT);
  rect(env, x - 2, 18, w + 4, 3, '#6b4a2a');
  rect(env, x - 1, 21, w + 2, 58, OUT);
  rect(env, x, 21, w, 56, '#9a1b1b');
  rect(env, x, 21, 2, 56, '#c0302f');
  rect(env, x + w - 3, 21, 3, 56, '#7a1414');
  // ponta de andorinha
  for (let i = 0; i < 6; i++) {
    rect(env, x + i, 77 + i, 1, 1, OUT);
    rect(env, x + w - 1 - i, 77 + i, 1, 1, OUT);
    rect(env, x + i + 1, 77, w / 2 - i - 1, i + 1, '#9a1b1b');
    rect(env, x + w / 2, 77, w / 2 - i - 1, i + 1, '#9a1b1b');
  }
  // brasão: coroa dourada
  rect(env, x + 6, 34, 10, 8, GOLD);
  rect(env, x + 6, 30, 2, 4, GOLD);
  rect(env, x + 10, 28, 2, 6, GOLD);
  rect(env, x + 14, 30, 2, 4, GOLD);
  rect(env, x + 6, 42, 10, 1, GOLD_DARK);
  rect(env, x + 9, 37, 4, 2, '#d03a3a');
  rect(env, x + 4, 52, 14, 2, GOLD);
}

function pillar(env: SceneEnv, cx: number): void {
  const half = 10;
  rect(env, cx - half - 4, 0, half * 2 + 8, 9, OUT);
  rect(env, cx - half - 3, 0, half * 2 + 6, 8, '#9099a8');
  rect(env, cx - half - 3, 6, half * 2 + 6, 2, '#6b7280');
  rect(env, cx - half - 1, 9, half * 2 + 2, 126, OUT);
  rect(env, cx - half, 9, half * 2, 126, '#7c8494');
  rect(env, cx - half, 9, 4, 126, '#a4acba');
  rect(env, cx + half - 5, 9, 5, 126, '#5b6272');
  for (let y = 18; y < 130; y += 18) rect(env, cx - half, y, half * 2, 1, 'rgba(0,0,0,0.18)');
  rect(env, cx - half - 4, 133, half * 2 + 8, 9, OUT);
  rect(env, cx - half - 3, 134, half * 2 + 6, 7, '#8d95a4');
  rect(env, cx - half - 3, 134, half * 2 + 6, 1, '#b9c0cd');
}

function dais(env: SceneEnv): void {
  // três degraus de pedra
  block(env, 118, 162, 154, 10, '#7b8290', '#4b5160', '#a0a8b6');
  block(env, 130, 154, 130, 9, '#818897', '#4f5565', '#a9b1bf');
  block(env, 142, DAIS_TOP, 106, 9, '#8a91a1', '#555b6b', '#b3bbc9');
  // tapete real que desce pelos degraus
  rect(env, CX - 22, DAIS_TOP + 1, 44, 8, '#8f1d1d');
  rect(env, CX - 22, 155, 44, 8, '#8f1d1d');
  rect(env, CX - 22, 163, 44, 9, '#8f1d1d');
  rect(env, CX - 24, 172, 48, 48, '#8f1d1d');
  rect(env, CX - 24, 172, 3, 48, GOLD);
  rect(env, CX + 21, 172, 3, 48, GOLD);
  rect(env, CX - 24, 172, 48, 1, 'rgba(0,0,0,0.3)');
  for (let y = 178; y < 220; y += 10) rect(env, CX - 4, y, 8, 2, GOLD_DARK);
}

function throne(env: SceneEnv): void {
  const top = 58;
  const base = DAIS_TOP;
  // costas pontudas com moldura dourada
  for (let y = top + 8; y < base - 16; y++) {
    const half = y < top + 26 ? 2 + Math.round(((y - (top + 8)) * 17) / 18) : 19;
    rect(env, CX - half - 1, y, half * 2 + 2, 1, OUT);
  }
  for (let y = top + 8; y < base - 16; y++) {
    const half = y < top + 26 ? 2 + Math.round(((y - (top + 8)) * 17) / 18) : 19;
    rect(env, CX - half, y, half * 2, 1, GOLD);
    rect(env, CX - half, y, 2, 1, GOLD_LIGHT);
    rect(env, CX + half - 2, y, 2, 1, GOLD_DARK);
  }
  // almofada de veludo nas costas
  for (let y = top + 16; y < base - 20; y++) {
    const half = y < top + 30 ? 1 + Math.round(((y - (top + 16)) * 13) / 14) : 14;
    rect(env, CX - half, y, half * 2, 1, VELVET);
    rect(env, CX + half - 3, y, 3, 1, VELVET_DARK);
  }
  // botões (tufos) no veludo
  for (const [dx, dy] of [
    [-7, 0],
    [0, 0],
    [7, 0],
    [-4, 8],
    [4, 8],
    [-7, 16],
    [0, 16],
    [7, 16],
  ] as const) {
    rect(env, CX + dx - 1, top + 40 + dy, 2, 2, GOLD_LIGHT);
  }
  // coroa no topo e joias
  rect(env, CX - 6, top - 1, 12, 9, OUT);
  rect(env, CX - 5, top, 10, 7, GOLD);
  rect(env, CX - 5, top, 10, 1, GOLD_LIGHT);
  for (const dx of [-5, -1, 3]) {
    rect(env, CX + dx - 1, top - 5, 4, 6, OUT);
    rect(env, CX + dx, top - 4, 2, 5, GOLD);
  }
  rect(env, CX - 1, top + 2, 2, 3, '#d03a3a');
  // colunas laterais com bolas
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - 25 : CX + 20;
    rect(env, x - 1, top + 22, 7, base - top - 28, OUT);
    rect(env, x, top + 23, 5, base - top - 30, GOLD);
    rect(env, x, top + 23, 1, base - top - 30, GOLD_LIGHT);
    rect(env, x + 4, top + 23, 1, base - top - 30, GOLD_DARK);
    rect(env, x - 1, top + 19, 7, 5, OUT);
    rect(env, x, top + 20, 5, 3, GOLD_LIGHT);
  }
  // braços e assento
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - 25 : CX + 20;
    block(env, x - 2, base - 28, 9, 6, GOLD, GOLD_DARK, GOLD_LIGHT);
  }
  block(env, CX - 20, base - 22, 40, 7, VELVET, VELVET_DARK, '#d24a52');
  block(env, CX - 24, base - 15, 48, 15, GOLD, GOLD_DARK, GOLD_LIGHT);
  rect(env, CX - 20, base - 11, 40, 1, GOLD_DARK);
  rect(env, CX - 3, base - 10, 6, 5, '#d03a3a');
}

type ArmorKind = 'spear' | 'shield' | 'sword';

function armor(env: SceneEnv, cx: number, base: number, kind: ArmorKind = 'spear'): void {
  // pedestal
  block(env, cx - 10, base - 4, 20, 4, '#6b7280', '#3f4552', '#8d95a4');
  // lança de enfeite
  rect(env, cx + 13, base - 54, 2, 50, OUT);
  rect(env, cx + 13, base - 53, 1, 48, '#8a6a3a');
  rect(env, cx + 11, base - 62, 6, 9, OUT);
  rect(env, cx + 12, base - 60, 4, 7, STEEL_LIGHT);
  rect(env, cx + 13, base - 62, 2, 2, STEEL_LIGHT);
  // pernas
  block(env, cx - 6, base - 18, 5, 14, STEEL, STEEL_DARK, STEEL_LIGHT);
  block(env, cx + 1, base - 18, 5, 14, STEEL, STEEL_DARK, STEEL_LIGHT);
  // braços
  block(env, cx - 12, base - 34, 4, 16, STEEL, STEEL_DARK, STEEL_LIGHT);
  block(env, cx + 8, base - 34, 4, 16, STEEL, STEEL_DARK, STEEL_LIGHT);
  // tronco
  block(env, cx - 8, base - 36, 16, 18, STEEL, STEEL_DARK, STEEL_LIGHT);
  rect(env, cx - 1, base - 35, 2, 16, STEEL_DARK);
  rect(env, cx - 7, base - 34, 3, 12, STEEL_LIGHT);
  rect(env, cx - 8, base - 22, 16, 1, STEEL_DARK);
  // elmo com viseira e pluma
  block(env, cx - 6, base - 47, 12, 12, STEEL, STEEL_DARK, STEEL_LIGHT);
  rect(env, cx - 4, base - 43, 8, 2, OUT);
  rect(env, cx - 1, base - 41, 2, 4, STEEL_DARK);
  rect(env, cx - 1, base - 54, 3, 7, OUT);
  rect(env, cx, base - 53, 2, 6, '#c0302f');
  if (kind === 'shield') {
    block(env, cx - 21, base - 38, 12, 16, '#2f5fb0', '#1f3f7a', '#5a8ae0');
    rect(env, cx - 16, base - 36, 2, 12, GOLD);
    rect(env, cx - 19, base - 31, 8, 2, GOLD);
    rect(env, cx - 17, base - 23, 4, 2, OUT);
  }
  if (kind === 'sword') {
    rect(env, cx - 18, base - 54, 4, 26, OUT);
    rect(env, cx - 17, base - 53, 2, 22, STEEL_LIGHT);
    rect(env, cx - 16, base - 53, 1, 22, STEEL_DARK);
    rect(env, cx - 21, base - 31, 10, 3, OUT);
    rect(env, cx - 20, base - 30, 8, 1, GOLD);
    rect(env, cx - 17, base - 28, 2, 6, '#5a3412');
  }
}

function weaponRack(env: SceneEnv, x: number, base: number): void {
  const wood = '#7a4a22';
  const woodDark = '#4a2c12';
  const woodLight = '#a0693a';
  // armas apoiadas, de trás para a frente (levantadas para as pontas aparecerem)
  env.ctx.save();
  env.ctx.translate(0, -10);
  // espada
  rect(env, x + 6, base - 46, 4, 30, OUT);
  rect(env, x + 7, base - 45, 2, 28, STEEL_LIGHT);
  rect(env, x + 8, base - 45, 1, 28, STEEL_DARK);
  rect(env, x + 3, base - 19, 10, 4, OUT);
  rect(env, x + 4, base - 18, 8, 2, GOLD);
  rect(env, x + 7, base - 15, 2, 8, OUT);
  rect(env, x + 7, base - 14, 2, 6, '#5a3412');
  rect(env, x + 6, base - 8, 4, 3, GOLD_DARK);
  // lança
  rect(env, x + 15, base - 6, 4, -46, OUT);
  rect(env, x + 16, base - 6, 2, -44, '#8a6a3a');
  rect(env, x + 14, base - 60, 6, 9, OUT);
  rect(env, x + 15, base - 59, 4, 7, STEEL_LIGHT);
  rect(env, x + 16, base - 62, 2, 3, STEEL_LIGHT);
  rect(env, x + 17, base - 59, 1, 7, STEEL_DARK);
  // machado de duas lâminas
  rect(env, x + 24, base - 6, 4, -40, OUT);
  rect(env, x + 25, base - 6, 2, -38, '#8a6a3a');
  rect(env, x + 19, base - 47, 14, 10, OUT);
  rect(env, x + 20, base - 46, 5, 8, STEEL);
  rect(env, x + 27, base - 46, 5, 8, STEEL);
  rect(env, x + 20, base - 46, 5, 1, STEEL_LIGHT);
  rect(env, x + 27, base - 46, 5, 1, STEEL_LIGHT);
  rect(env, x + 25, base - 46, 2, 8, STEEL_DARK);
  // maça com cabeça de espinhos
  rect(env, x + 34, base - 6, 4, -34, OUT);
  rect(env, x + 35, base - 6, 2, -32, '#8a6a3a');
  rect(env, x + 31, base - 46, 10, 10, OUT);
  rect(env, x + 32, base - 45, 8, 8, STEEL_DARK);
  rect(env, x + 32, base - 45, 3, 3, STEEL_LIGHT);
  rect(env, x + 35, base - 48, 2, 2, STEEL);
  rect(env, x + 29, base - 42, 2, 2, STEEL);
  rect(env, x + 41, base - 42, 2, 2, STEEL);
  env.ctx.restore();
  // suporte de madeira por cima das armas
  rect(env, x - 1, base - 36, 4, 36, OUT);
  rect(env, x, base - 35, 2, 34, wood);
  rect(env, x + 40, base - 36, 4, 36, OUT);
  rect(env, x + 41, base - 35, 2, 34, wood);
  for (const y of [base - 24, base - 11]) {
    rect(env, x - 2, y - 1, 48, 6, OUT);
    rect(env, x - 1, y, 46, 4, wood);
    rect(env, x - 1, y, 46, 1, woodLight);
    rect(env, x - 1, y + 3, 46, 1, woodDark);
  }
  block(env, x - 3, base - 3, 50, 4, wood, woodDark, woodLight);
}

function candelabra(env: SceneEnv, x: number): void {
  const base = 170;
  block(env, x - 5, base - 3, 10, 3, GOLD, GOLD_DARK, GOLD_LIGHT);
  rect(env, x - 1, CANDLE_Y + 6, 3, base - CANDLE_Y - 9, OUT);
  rect(env, x, CANDLE_Y + 6, 1, base - CANDLE_Y - 9, GOLD);
  rect(env, x - 7, CANDLE_Y + 4, 15, 3, OUT);
  rect(env, x - 6, CANDLE_Y + 5, 13, 1, GOLD);
  for (const dx of [-6, 0, 6]) {
    rect(env, x + dx - 1, CANDLE_Y - 2, 3, 7, OUT);
    rect(env, x + dx, CANDLE_Y - 1, 1, 6, '#f4ecd0');
    flame(env, x + dx, CANDLE_Y - 3, 1);
  }
}

function chest(env: SceneEnv, x: number, base: number): void {
  const w = 32;
  rect(env, x - 1, base - 19, w + 2, 19, OUT);
  rect(env, x, base - 18, w, 17, '#7a4a22');
  rect(env, x, base - 18, w, 1, '#a0693a');
  rect(env, x, base - 2, w, 1, '#4a2c12');
  for (let i = 2; i < w; i += 5) rect(env, x + i, base - 17, 1, 15, 'rgba(0,0,0,0.25)');
  // tampa arredondada
  rect(env, x - 1, base - 27, w + 2, 9, OUT);
  rect(env, x + 1, base - 26, w - 2, 8, '#8d5a2c');
  rect(env, x + 1, base - 26, w - 2, 1, '#b57a42');
  rect(env, x + 1, base - 19, w - 2, 1, '#4a2c12');
  // ferragens e fechadura
  for (const dx of [3, w - 7]) {
    rect(env, x + dx, base - 27, 4, 26, '#3a3d46');
    rect(env, x + dx, base - 27, 1, 26, '#6b7280');
  }
  block(env, x + w / 2 - 3, base - 22, 6, 7, GOLD, GOLD_DARK, GOLD_LIGHT);
  rect(env, x + w / 2 - 1, base - 20, 2, 3, OUT);
  // brilho de ouro que pisca
  if (Math.sin(env.t * 3) > 0.4) rect(env, x + 10, base - 30, 2, 2, GOLD_LIGHT);
}

function windowAbove(env: SceneEnv): void {
  const { ctx } = env;
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(CX - 23, 52);
    ctx.lineTo(CX - 23, 28);
    ctx.arc(CX, 28, 23, Math.PI, Math.PI * 2);
    ctx.lineTo(CX + 23, 52);
    ctx.closePath();
  };
  ctx.save();
  path();
  ctx.clip();
  sky(env, CX - 23, 4, 46, 50, false);
  ctx.restore();
  ctx.save();
  path();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = '#8b93a1';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  rect(env, CX - 1, 6, 2, 46, '#4a4f58');
  rect(env, CX - 23, 32, 46, 2, '#4a4f58');
  block(env, CX - 28, 52, 56, 4, '#8b93a1', '#5b6272', '#b3bbc9');
}

const WALL_FACTOR = 0.8;
const WALL_PERIOD = 1250;
const FLOOR_PERIOD = 1000;
const CARPET_TOP = 168;
const CARPET_BOTTOM = 197;

/** Número fixo entre 0 e 1 por posição, para a parede não cintilar enquanto rola. */
function noise(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Duas espadas cruzadas sobre uma placa de madeira. */
function crossedSwords(env: SceneEnv, x: number, y: number): void {
  block(env, x - 11, y + 2, 22, 28, '#5a3a1e', '#3a2410', '#7a5030');
  for (const flip of [1, -1]) {
    for (let i = 0; i < 24; i++) {
      const px = x - 11 * flip + i * flip;
      rect(env, px - 1, y + 1 + i, 4, 3, OUT);
    }
  }
  for (const flip of [1, -1]) {
    for (let i = 0; i < 24; i++) {
      const px = x - 11 * flip + i * flip;
      rect(env, px, y + 2 + i, 2, 1, i % 2 ? STEEL : STEEL_LIGHT);
    }
    rect(env, x - 13 * flip - 2, y + 25, 6, 3, GOLD_DARK);
  }
  rect(env, x - 2, y + 11, 4, 4, GOLD);
}

/** Espada pendurada na horizontal, presa por dois suportes. */
function wallSword(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 19, y - 1, 36, 5, OUT);
  rect(env, x - 18, y, 30, 3, STEEL_LIGHT);
  rect(env, x - 18, y + 2, 30, 1, STEEL_DARK);
  rect(env, x + 11, y - 4, 4, 11, OUT);
  rect(env, x + 12, y - 3, 2, 9, GOLD);
  rect(env, x + 15, y, 8, 3, '#5a3412');
  rect(env, x + 23, y - 1, 3, 5, GOLD_DARK);
  for (const bx of [x - 10, x + 4]) {
    rect(env, bx, y - 3, 3, 9, '#3a3d46');
    rect(env, bx, y - 3, 1, 9, '#6b7280');
  }
}

/** Sequências espalhadas, de propósito sem ritmo fixo. */
const WALL_SET: { kind: 'banner' | 'torch' | 'cross' | 'sword' | 'pillar'; x: number }[] = [
  { kind: 'banner', x: 90 },
  { kind: 'torch', x: 205 },
  { kind: 'cross', x: 330 },
  { kind: 'torch', x: 455 },
  { kind: 'sword', x: 560 },
  { kind: 'pillar', x: 660 },
  { kind: 'banner', x: 775 },
  { kind: 'torch', x: 905 },
  { kind: 'cross', x: 1010 },
  { kind: 'sword', x: 1090 },
  { kind: 'torch', x: 1190 },
];
const ARMORS: { kind: ArmorKind; x: number }[] = [
  { kind: 'spear', x: 150 },
  { kind: 'shield', x: 395 },
  { kind: 'sword', x: 520 },
  { kind: 'spear', x: 745 },
  { kind: 'sword', x: 880 },
  { kind: 'spear', x: 1060 },
  { kind: 'shield', x: 1170 },
];
const RACK_X = 610;
const CHESTS = [330, 880];
const CANDLES = [120, 540, 770];

const wallX = (env: SceneEnv, world: number): number =>
  Math.round(scrolled(world, env.scroll, WALL_PERIOD, WALL_FACTOR));
const floorX = (env: SceneEnv, world: number): number =>
  Math.round(scrolled(world, env.scroll, FLOOR_PERIOD));

/** Castelo na jornada: o personagem anda sobre o tapete real e o salão passa com peças espalhadas. */
function journey(env: SceneEnv): void {
  const shift = env.scroll * WALL_FACTOR;
  bands(env, 0, 0, SCENE_W, FLOOR, ['#6b7280', '#656b78', '#5f6572']);
  const startCol = Math.floor(shift / 32) - 1;
  for (let row = 0; row * 12 < FLOOR; row++) {
    const y = row * 12;
    const offset = row % 2 ? 0 : 16;
    for (let col = startCol; col < startCol + 15; col++) {
      const x = col * 32 + offset - shift;
      if (x > SCENE_W || x < -34) continue;
      rect(env, x, y, 31, 11, `rgba(255,255,255,${0.02 + noise(col, row) * 0.05})`);
      rect(env, x + 31, y, 1, 12, 'rgba(0,0,0,0.25)');
    }
    rect(env, 0, y + 11, SCENE_W, 1, 'rgba(0,0,0,0.25)');
  }
  bands(env, 0, FLOOR, SCENE_W, 100, ['#4a4f58', '#434852', '#3c414a']);
  for (let y = FLOOR; y < 220; y += 24) rect(env, 0, y, SCENE_W, 1, 'rgba(0,0,0,0.3)');
  const joint = -(((env.scroll % 48) + 48) % 48);
  for (let x = joint; x < SCENE_W; x += 48) rect(env, x, FLOOR, 1, 100, 'rgba(0,0,0,0.2)');

  for (const item of WALL_SET) {
    const x = wallX(env, item.x);
    if (x < -40 || x > SCENE_W + 40) continue;
    if (item.kind === 'banner') banner(env, x - 11);
    else if (item.kind === 'torch') torch(env, x);
    else if (item.kind === 'cross') crossedSwords(env, x, 36);
    else if (item.kind === 'sword') wallSword(env, x, 56);
    else pillar(env, x);
  }
  for (const item of ARMORS) {
    const x = wallX(env, item.x);
    if (x > -40 && x < SCENE_W + 40) armor(env, x, 150, item.kind);
  }
  const rack = wallX(env, RACK_X);
  if (rack > -60 && rack < SCENE_W + 20) weaponRack(env, rack - 20, 152);

  // Tapete real por todo o caminho
  rect(env, 0, CARPET_TOP, SCENE_W, CARPET_BOTTOM - CARPET_TOP, '#8f1d1d');
  rect(env, 0, CARPET_TOP, SCENE_W, 1, 'rgba(0,0,0,0.3)');
  rect(env, 0, CARPET_TOP + 1, SCENE_W, 3, GOLD);
  rect(env, 0, CARPET_TOP + 1, SCENE_W, 1, GOLD_LIGHT);
  rect(env, 0, CARPET_BOTTOM - 4, SCENE_W, 3, GOLD);
  rect(env, 0, CARPET_BOTTOM - 1, SCENE_W, 1, 'rgba(0,0,0,0.35)');
  const motif = 40;
  const first = -(((env.scroll % motif) + motif) % motif);
  for (let x = first; x < SCENE_W; x += motif) {
    rect(env, x + 14, 180, 12, 3, GOLD_DARK);
    rect(env, x + 17, 177, 6, 9, GOLD_DARK);
    rect(env, x + 19, 180, 2, 3, GOLD_LIGHT);
  }

  for (const world of CANDLES) candelabra(env, floorX(env, world));
  for (const world of CHESTS) {
    const x = floorX(env, world);
    if (x > -50 && x < SCENE_W + 20) chest(env, x, 166);
  }
  if (env.arrivedFor !== null) portal(env, env.arrivedFor, 166);
}

/** Luzes da jornada: tochas e velas que passam e o luar. */
function journeyLights(env: SceneEnv): Light[] {
  const glow = (x: number, y: number, radius: number, intensity: number): Light => ({
    x,
    y,
    radius,
    color: [255, 150, 60],
    intensity,
    flicker: true,
    at: ['night', 'morning', 'afternoon'],
  });
  const out: Light[] = [];
  for (const item of WALL_SET) {
    if (item.kind !== 'torch') continue;
    const x = wallX(env, item.x);
    if (x > -100 && x < SCENE_W + 100) out.push(glow(x, 62, 90, 0.5));
  }
  for (const world of CANDLES) {
    const x = floorX(env, world);
    if (x > -60 && x < SCENE_W + 60) out.push(glow(x, CANDLE_Y - 4, 46, 0.55));
  }
  out.push({ x: CX, y: 40, radius: 110, color: [150, 170, 255], intensity: 0.3, at: ['night'] });
  out.push({ x: CX, y: 120, radius: 90, color: [255, 224, 140], intensity: 0.18, at: ['night'] });
  return out;
}

export const castle: SceneDef = {
  id: 'castle',
  name: 'Castelo',
  blurb: 'Salão do trono com tablado, tapete real, armaduras, candelabros, estandartes e baú.',
  groundY: 178,
  journey,
  back(env) {
    // Parede de blocos de pedra
    bands(env, 0, 0, SCENE_W, FLOOR, ['#6b7280', '#656b78', '#5f6572']);
    const random = rng(2);
    for (let y = 0; y < FLOOR; y += 12) {
      const offset = (y / 12) % 2 ? 0 : 16;
      for (let x = -16 + offset; x < SCENE_W; x += 32) {
        rect(env, x, y, 31, 11, `rgba(255,255,255,${0.02 + random() * 0.05})`);
        rect(env, x + 31, y, 1, 12, 'rgba(0,0,0,0.25)');
      }
      rect(env, 0, y + 11, SCENE_W, 1, 'rgba(0,0,0,0.25)');
    }
    // Piso de lajes
    bands(env, 0, FLOOR, SCENE_W, 100, ['#4a4f58', '#434852', '#3c414a']);
    for (let y = FLOOR; y < 220; y += 24) rect(env, 0, y, SCENE_W, 1, 'rgba(0,0,0,0.3)');
    for (let x = 0; x < SCENE_W; x += 48) rect(env, x, FLOOR, 1, 100, 'rgba(0,0,0,0.2)');

    windowAbove(env);
    banner(env, 76);
    banner(env, 292);
    torch(env, 132);
    torch(env, 260);
    pillar(env, 22);
    pillar(env, SCENE_W - 22);
    weaponRack(env, 40, 152);
    armor(env, 100, 150);
    armor(env, 290, 150);
    dais(env);
    throne(env);
    for (const x of CANDELABRA) candelabra(env, x);
    chest(env, 318, 198);
  },
  lights: (env): Light[] =>
    env.journey
      ? journeyLights(env)
      : [
          ...[132, 260].map((x) => ({
            x,
            y: 62,
            radius: 90,
            color: [255, 150, 60] as [number, number, number],
            intensity: 0.5,
            flicker: true,
            at: ['night', 'morning', 'afternoon'] as TimeOfDay[],
          })),
          ...CANDELABRA.map((x) => ({
            x,
            y: CANDLE_Y - 4,
            radius: 46,
            color: [255, 170, 80] as [number, number, number],
            intensity: 0.55,
            flicker: true,
            at: ['night', 'morning', 'afternoon'] as TimeOfDay[],
          })),
          { x: CX, y: 40, radius: 110, color: [150, 170, 255], intensity: 0.3, at: ['night'] },
          { x: CX, y: 120, radius: 90, color: [255, 224, 140], intensity: 0.18, at: ['night'] },
        ],
  tint: {
    morning: { color: '#ffe0c0', alpha: 0.2 },
    afternoon: { color: '#fff4de', alpha: 0.08 },
    night: { color: '#27357f', alpha: 0.5 },
  },
};
