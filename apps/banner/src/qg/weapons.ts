import type { Direction } from './compose';

/** Armas desenhadas por cima do figurante (o catálogo LPC não tem armas), na altura do peito. */
export type Weapon = 'rifle';

const OUTLINE = '#15171a';

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

/**
 * Fuzil na mão. De lado, o cano aponta para onde ele olha; de frente, fica erguido junto ao corpo.
 * `step` balança a arma meio pixel por passo, acompanhando a corrida.
 */
export function drawWeapon(
  ctx: CanvasRenderingContext2D,
  weapon: Weapon,
  x: number,
  feetY: number,
  direction: Direction,
  step: number,
): void {
  if (weapon !== 'rifle' || direction === 'up') return;
  const bob = step % 2 === 0 ? 0 : -1;
  const px = Math.round(x);
  const py = Math.round(feetY) - 21 + bob;
  if (direction === 'down') {
    rect(ctx, px + 5, py - 13, 4, 20, OUTLINE);
    rect(ctx, px + 6, py - 12, 2, 12, '#4a4f55');
    rect(ctx, px + 6, py - 1, 2, 6, '#3a3a3a');
    rect(ctx, px + 6, py + 5, 2, 2, '#6b4a2a');
    return;
  }
  ctx.save();
  ctx.translate(px, 0);
  if (direction === 'left') ctx.scale(-1, 1);
  rect(ctx, -3, py - 1, 20, 5, OUTLINE);
  rect(ctx, 6, py, 10, 1, '#4a4f55');
  rect(ctx, 1, py, 6, 3, '#3a3a3a');
  rect(ctx, -2, py + 1, 4, 3, '#6b4a2a');
  rect(ctx, 3, py + 3, 2, 2, '#2a2a2a');
  ctx.restore();
}
