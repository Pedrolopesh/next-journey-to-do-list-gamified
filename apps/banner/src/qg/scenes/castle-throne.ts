import { rect, shadedBlock } from './draw';
import type { SceneEnv } from './types';

const OUT = '#14161c';
const GOLD = '#e2b02e';
const GOLD_DARK = '#a8791a';
const GOLD_LIGHT = '#ffe07a';
const VELVET = '#a31f2a';
const VELVET_DARK = '#741420';

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

/** Trono dourado com costas pontudas e almofada de veludo; `base` é o chão sob o assento. */
export function drawThrone(env: SceneEnv, CX: number, base: number): void {
  const top = base - 88;
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
