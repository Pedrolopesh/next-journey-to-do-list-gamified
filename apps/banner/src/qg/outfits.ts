import type { Direction } from './compose';

/**
 * Roupas desenhadas por cima do figurante, porque o catálogo LPC só tem camisas, calças e sapatos.
 * Servem para quem precisa de uma silhueta própria: cavaleiro de elmo e peitoral, mago de chapéu
 * pontudo e túnica longa.
 */
export type Outfit = { kind: 'knight' | 'wizard'; color?: string };

const OUTLINE = '#14161c';

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function knight(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Direction, step: number) {
  const back = dir === 'up';
  const side = dir === 'left' || dir === 'right';
  const w = side ? 12 : 16;
  const bob = step % 2 === 0 ? 0 : -1;
  // peitoral
  rect(ctx, x - w / 2 - 1, y - 28 + bob, w + 2, 15, OUTLINE);
  rect(ctx, x - w / 2, y - 27 + bob, w, 13, '#aab3c2');
  rect(ctx, x - w / 2, y - 27 + bob, 3, 13, '#dbe2ee');
  rect(ctx, x - w / 2, y - 16 + bob, w, 2, '#6e7889');
  if (!side) rect(ctx, x - 1, y - 26 + bob, 2, 11, '#6e7889');
  // elmo
  rect(ctx, x - 8, y - 47, 16, 14, OUTLINE);
  rect(ctx, x - 7, y - 46, 14, 12, '#aab3c2');
  rect(ctx, x - 7, y - 46, 4, 12, '#dbe2ee');
  rect(ctx, x + 4, y - 46, 3, 12, '#6e7889');
  if (!back) {
    const vx = dir === 'left' ? x - 7 : dir === 'right' ? x - 1 : x - 5;
    rect(ctx, vx, y - 41, side ? 8 : 10, 3, OUTLINE);
  }
  // pluma
  rect(ctx, x - 1, y - 54, 3, 8, OUTLINE);
  rect(ctx, x, y - 53, 2, 6, '#c0302f');
}

function wizard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
  step: number,
  color: string,
) {
  const side = dir === 'left' || dir === 'right';
  const half = side ? 6 : 8;
  const sway = step % 2 === 0 ? 0 : 1;
  // túnica comprida até os pés, um pouco mais larga na barra
  for (let row = 0; row < 24; row++) {
    const flare = Math.floor(row / 8);
    const hw = half + flare + (row > 18 ? sway : 0);
    rect(ctx, x - hw - 1, y - 27 + row, hw * 2 + 2, 1, OUTLINE);
  }
  for (let row = 0; row < 24; row++) {
    const flare = Math.floor(row / 8);
    const hw = half + flare + (row > 18 ? sway : 0);
    rect(ctx, x - hw, y - 27 + row, hw * 2, 1, color);
    rect(ctx, x - hw, y - 27 + row, 2, 1, 'rgba(255,255,255,0.25)');
    rect(ctx, x + hw - 2, y - 27 + row, 2, 1, 'rgba(0,0,0,0.25)');
  }
  // cinto dourado
  rect(ctx, x - half, y - 17, half * 2, 2, '#e2b02e');
  // chapéu pontudo com aba, faixa e estrela
  rect(ctx, x - 11, y - 41, 22, 4, OUTLINE);
  rect(ctx, x - 10, y - 40, 20, 2, color);
  for (let row = 0; row < 16; row++) {
    const hw = Math.max(1, 6 - Math.floor(row / 3));
    const lean = Math.floor(row / 6);
    rect(ctx, x - hw - 1 + lean, y - 56 + row, hw * 2 + 2, 1, OUTLINE);
  }
  for (let row = 0; row < 16; row++) {
    const hw = Math.max(1, 6 - Math.floor(row / 3));
    const lean = Math.floor(row / 6);
    rect(ctx, x - hw + lean, y - 56 + row, hw * 2, 1, color);
  }
  rect(ctx, x - 6, y - 42, 12, 2, '#e2b02e');
  rect(ctx, x - 1, y - 49, 2, 2, '#ffe07a');
}

/** Desenha a roupa de `outfit` sobre o figurante (pés em `feetY`). `step` é o quadro da animação. */
export function drawOutfit(
  ctx: CanvasRenderingContext2D,
  outfit: Outfit,
  x: number,
  feetY: number,
  direction: Direction,
  step: number,
): void {
  const px = Math.round(x);
  const py = Math.round(feetY);
  if (outfit.kind === 'knight') knight(ctx, px, py, direction, step);
  else wizard(ctx, px, py, direction, step, outfit.color ?? '#5b2e91');
}
