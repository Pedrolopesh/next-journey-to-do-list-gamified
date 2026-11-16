import { type MapPainter, type Rect, TILE } from '../pages/mapas-motor';
import { BUSHES, plants, ROCKS, type Season, SHEET } from '../pages/mapas-pecas';

/**
 * Relief: a cliff terrace across the top of the map, with what hangs on its wall (waterfall, cave,
 * ladder, vines). The cliff sheets only have corner tiles, so the straight edge is made of two
 * half tiles side by side; that is what lets the terrace have any width.
 */

export const cliff = (s: Season): string => `rev-terrain-cliff-${s}`;

/** Row of the grass lip, and how many rows of wall hang below it. */
export const LIP_ROW = 1;
export const WALL_ROWS = 3;
/** The wall stops this many tiles before each side of the screen. */
export const SIDE_GAP = 2;
/** First row of free ground under the wall. */
export const FOOT_ROW = LIP_ROW + WALL_ROWS + 1;

// What hangs on the wall stops short of the grass at its foot, or it would show as a patch
const FRINGE = 8;
const CAVE: Rect = [224, 288, 96, 96 - FRINGE];
const LADDER: Rect = [352, 288, 32, 96 - FRINGE];
const VINES: Rect = [0, 288, 96, 96 - FRINGE];
/** Width of the waterfall and how far its pool reaches below the wall, in pixels. */
const FALL_W = 52;
const POOL_H = 30;

export type TerraceExtras = {
  waterfall?: number;
  cave?: number;
  ladder?: number;
  vines?: number[];
};

export function terrace(p: MapPainter, season: Season, extras: TerraceExtras): void {
  const sheet = cliff(season);
  const img = p.image(sheet);
  const half = TILE / 2;
  p.ground((ctx) => {
    const strip = (srcRow: number, row: number): void => {
      for (let x = SIDE_GAP; x < p.cols - SIDE_GAP; x++) {
        ctx.drawImage(
          img,
          5 * TILE + half,
          srcRow * TILE,
          half,
          TILE,
          x * TILE,
          row * TILE,
          half,
          TILE,
        );
        ctx.drawImage(
          img,
          6 * TILE,
          srcRow * TILE,
          half,
          TILE,
          x * TILE + half,
          row * TILE,
          half,
          TILE,
        );
      }
    };
    strip(7, LIP_ROW);
    for (let k = 0; k < WALL_ROWS; k++) {
      strip(k === WALL_ROWS - 1 ? 8 : k % 2 ? 4 : 3, LIP_ROW + 1 + k);
    }
  });
  const foot = FOOT_ROW;
  // The sheet has no side wall, so each end of the cliff is buried under a rock slide
  const big = ROCKS.slice(0, 2);
  const small = ROCKS.slice(2);
  for (const [end, out] of [
    [SIDE_GAP, -1],
    [p.cols - SIDE_GAP, 1],
  ] as const) {
    const lean = (): number => (p.random() - 0.5) * 0.3;
    const rock = (list: Rect[]): Rect => list[Math.floor(p.random() * list.length)] as Rect;
    // A heap that is narrow at the top of the wall and spreads outwards at its foot
    p.stand(SHEET.rocks, rock(big), end - out * 0.3 + lean(), LIP_ROW + 1.6);
    p.stand(SHEET.rocks, rock(big), end + out * 0.3 + lean(), LIP_ROW + 2.5);
    p.stand(SHEET.rocks, rock(big), end - out * 0.5 + lean(), foot - 0.6);
    p.stand(SHEET.rocks, rock(big), end + out * 1.2 + lean(), foot - 0.9);
    p.stand(SHEET.rocks, rock(big), end + out * 0.4 + lean(), foot + 0.1);
    p.stand(SHEET.rocks, rock(big), end + out * 2 + lean(), foot + 0.2);
    p.stand(SHEET.rocks, rock(small), end + out * 3, foot + 0.4);
    p.stand(SHEET.rocks, rock(small), end - out * 1.3, foot + 0.5);
    p.stand(SHEET.rocks, rock(small), end + out * 1.2, foot + 0.6);
    p.stand(plants(season), rock(BUSHES), end + out * 1.1, LIP_ROW + 1.3);
    p.stand(plants(season), rock(BUSHES), end + out * 2.3, LIP_ROW + 2.9);
    p.stand(plants(season), rock(BUSHES), end - out * 0.2, LIP_ROW + 0.9);
  }
  const hang = foot - FRINGE / TILE;
  for (const x of extras.vines ?? []) p.stand(sheet, VINES, x, hang, -3);
  if (extras.cave !== undefined) p.stand(sheet, CAVE, extras.cave, hang, -3);
  if (extras.ladder !== undefined) p.stand(sheet, LADDER, extras.ladder, hang, -3);
  if (extras.waterfall !== undefined) {
    const frozen = season === 'winter';
    const top = LIP_ROW * TILE + 18;
    const x = extras.waterfall;
    p.custom(x, foot, (ctx, px, py) => waterfall(ctx, px, top, py, frozen), -0.9);
    p.stand(SHEET.rocks, small[0] as Rect, x - 1.5, foot + 0.8);
    p.stand(SHEET.rocks, small[1] as Rect, x + 1.45, foot + 0.9);
    p.stand(SHEET.rocks, small[1] as Rect, x - 0.9, foot + 1.02);
    if (!frozen)
      p.mark('fall', Math.round(x * TILE - FALL_W / 2), top, FALL_W, foot * TILE + 8 - top);
  }
}

const WATER = {
  edge: '#2a6f9c',
  body: ['#3f9bc4', '#4aa8cf', '#3a90ba', '#57b4d8'],
  light: '#8fd3ea',
  foam: '#eaf8fc',
};
const ICE = {
  edge: '#86b6c9',
  body: ['#bfe3ee', '#cdeaf3', '#b2d9e6', '#d8f0f6'],
  light: '#eefafd',
  foam: '#ffffff',
};

/** A fixed number from 0 to 1 for a key. */
const fixed = (key: number): number => {
  const s = Math.sin(key * 91.7 + 13.3) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * The waterfall, drawn in code: a sheet of water (or ice) down the wall, centred on `cx`, from
 * `top` to the foot of the wall at `foot`, and the pool it falls into.
 */
function waterfall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  foot: number,
  frozen: boolean,
): void {
  const c = frozen ? ICE : WATER;
  const oval = (y: number, rx: number, ry: number, color: string): void => {
    ctx.fillStyle = color;
    for (let dy = -ry; dy <= ry; dy++) {
      const half = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2));
      ctx.fillRect(cx - half, y + dy, half * 2, 1);
    }
  };
  // The pool
  const mid = foot + POOL_H / 2 + 1;
  oval(mid, 45, POOL_H / 2, c.edge);
  oval(mid, 42, POOL_H / 2 - 2, c.body[0] as string);
  oval(mid + 2, 30, POOL_H / 2 - 6, c.body[1] as string);
  // The sheet of water, in columns of slightly different blues
  const x0 = cx - FALL_W / 2;
  const bottom = foot + 8;
  for (let i = 0; i < FALL_W; i += 2) {
    const side = i < 2 || i >= FALL_W - 2;
    // The edge comes out of the lip a little lower, so the top is not a straight cut
    const drop = side ? 4 : i < 6 || i >= FALL_W - 6 ? 2 : 0;
    ctx.fillStyle = side ? c.edge : (c.body[Math.floor(fixed(i) * c.body.length)] as string);
    ctx.fillRect(x0 + i, top + drop, 2, bottom - top - drop);
    ctx.fillStyle = c.foam;
    ctx.fillRect(x0 + i, top + drop, 2, 2);
    ctx.fillStyle = c.light;
    ctx.fillRect(x0 + i, top + drop + 2, 2, 3);
  }
  // Lighter threads running down
  ctx.fillStyle = c.light;
  for (let k = 0; k < 14; k++) {
    const x = x0 + 4 + Math.floor(fixed(k + 0.3) * ((FALL_W - 10) / 2)) * 2;
    const y = top + 8 + Math.floor(fixed(k + 0.6) * (bottom - top - 40));
    ctx.fillRect(x, y, 2, 10 + Math.floor(fixed(k + 0.9) * 18));
  }
  // Foam where it hits the pool
  ctx.fillStyle = c.foam;
  for (let k = 0; k < 9; k++) {
    const x = x0 - 4 + Math.floor(fixed(k + 0.2) * (FALL_W + 4));
    ctx.fillRect(x, bottom - 3 + Math.floor(fixed(k + 0.5) * 6), 4 + (k % 3) * 2, 2);
  }
}
