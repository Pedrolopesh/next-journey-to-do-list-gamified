import { rect, shadedBlock } from './draw';
import type { SceneEnv } from './types';

export const OUT = '#1b1f17';

export const block = (
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

export function crate(env: SceneEnv, x: number, base: number, size: number): void {
  block(env, x, base - size, size, size, '#8a6a3a', '#5e4524', '#b08a52');
  rect(env, x + 1, base - size + 1, size - 2, 1, '#b08a52');
  // tampa em X
  for (let i = 2; i < size - 2; i++) {
    rect(env, x + i, base - size + i, 1, 1, '#5e4524');
    rect(env, x + size - 1 - i, base - size + i, 1, 1, '#5e4524');
  }
}

export function barrel(env: SceneEnv, x: number, base: number, color: string): void {
  block(env, x, base - 14, 10, 14, color, '#1d2b17', '#6c8a52');
  rect(env, x, base - 10, 10, 1, OUT);
  rect(env, x, base - 5, 10, 1, OUT);
}

export function sandbags(env: SceneEnv, x: number, base: number, cols: number, rows: number): void {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols - (r % 2); c++) {
      const bx = x + c * 13 + (r % 2) * 6;
      const by = base - (r + 1) * 7;
      block(env, bx, by, 13, 8, '#bda775', '#8d7a4e', '#d6c394');
    }
}

export function sign(env: SceneEnv, x: number, y: number): void {
  rect(env, x, y + 6, 1, 8, OUT);
  rect(env, x - 4, y - 1, 9, 8, OUT);
  rect(env, x - 3, y, 7, 6, '#f2c230');
  // raio
  rect(env, x, y + 1, 2, 1, OUT);
  rect(env, x - 1, y + 2, 2, 1, OUT);
  rect(env, x, y + 3, 2, 1, OUT);
  rect(env, x - 1, y + 4, 1, 1, OUT);
}

export function heliBody(env: SceneEnv, x: number, y: number): void {
  const { ctx } = env;
  const rotor = 27 * Math.abs(Math.cos(env.t * 26));

  // cauda
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 5);
  ctx.lineTo(x - 36, y - 4);
  ctx.lineTo(x - 36, y - 0.5);
  ctx.lineTo(x - 8, y + 3);
  ctx.fill();
  ctx.fillStyle = '#5b6a40';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 4);
  ctx.lineTo(x - 35, y - 3.2);
  ctx.lineTo(x - 35, y - 1);
  ctx.lineTo(x - 8, y + 2);
  ctx.fill();
  // estabilizador e rotor de cauda
  rect(env, x - 38, y - 9, 3, 8, OUT);
  rect(env, x - 37, y - 8, 1, 6, '#5b6a40');
  const tail = 6 * Math.abs(Math.cos(env.t * 34));
  rect(env, x - 41, y - 5 - tail, 1, tail * 2, 'rgba(220,225,230,0.8)');

  // patins
  rect(env, x - 11, y + 9, 24, 2, OUT);
  rect(env, x - 10, y + 9, 22, 1, '#7a8290');
  rect(env, x - 6, y + 5, 2, 5, OUT);
  rect(env, x + 5, y + 5, 2, 5, OUT);

  // fuselagem
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#66774a';
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4b5a35';
  ctx.beginPath();
  ctx.ellipse(x - 1, y + 3, 12, 4, 0, 0, Math.PI);
  ctx.fill();
  // cabine
  ctx.fillStyle = '#9fd3e6';
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 1, 6.5, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(Math.round(x + 3), Math.round(y - 4), 3, 1);
  rect(env, x - 3, y - 5, 1, 9, 'rgba(0,0,0,0.35)');
  // marca na lateral
  rect(env, x - 9, y - 1, 4, 2, '#e6e2c8');

  // mastro e rotor principal
  rect(env, x - 1, y - 11, 3, 4, OUT);
  rect(env, x - 28, y - 12, 56, 2, 'rgba(210,215,220,0.22)');
  rect(env, x - rotor, y - 12, rotor * 2, 1, '#1b1f17');
  rect(env, x - 1, y - 12, 3, 1, '#8d949b');

  // luz de navegação
  if (env.time === 'night' && Math.sin(env.t * 6) > 0) rect(env, x - 37, y - 8, 2, 2, '#ff3a3a');
}

export type MiniZombie = { x: number; feet: number; variant: number };

const SHIRTS = ['#6b4a3a', '#3f5a7a', '#7a7a3a', '#5a3f6e'];
const PANTS = ['#2f3440', '#4a3a2a', '#26323a', '#3a3a3a'];
const SKINS = ['#7fa05a', '#8fb56a', '#6f9467', '#9bb27a'];

/** Zumbi pequeno visto de costas, de braços erguidos para a cerca; balança de leve. */
export function miniZombie(env: SceneEnv, z: MiniZombie, index: number): void {
  const sway = Math.round(Math.sin(env.t * 1.6 + index * 1.9));
  const x = Math.round(z.x) + sway;
  const y = z.feet;
  const skin = SKINS[z.variant] ?? '#7fa05a';
  rect(env, x - 3, y - 17, 7, 18, OUT);
  rect(env, x - 2, y - 5, 2, 5, PANTS[z.variant] ?? '#2f3440');
  rect(env, x + 1, y - 5, 2, 5, PANTS[z.variant] ?? '#2f3440');
  rect(env, x - 2, y - 11, 5, 6, SHIRTS[z.variant] ?? '#6b4a3a');
  const lift = Math.round(Math.sin(env.t * 3 + index) * 1);
  rect(env, x - 4, y - 16 + lift, 1, 6, skin);
  rect(env, x + 3, y - 16 - lift, 1, 6, skin);
  rect(env, x - 1, y - 16, 3, 4, skin);
  rect(env, x - 1, y - 16, 3, 1, '#4a3a2a');
}
