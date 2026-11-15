import { type MapPainter, type Rect, TILE } from '../pages/mapas-motor';
import type { Season } from '../pages/mapas-pecas';

/**
 * Relief: a cliff terrace across the top of the map, with what hangs on its wall (waterfall, cave,
 * ladder, vines). The cliff sheets only have corner tiles, so the straight edge is made of two
 * half tiles side by side; that is what lets the terrace have any width.
 */

export const cliff = (s: Season): string => `rev-terrain-cliff-${s}`;
export const WATERFALL = 'rev-terrain-waterfall';

/** Row of the grass lip, and how many rows of wall hang below it. */
export const LIP_ROW = 1;
export const WALL_ROWS = 3;
/** First row of free ground under the wall. */
export const FOOT_ROW = LIP_ROW + WALL_ROWS + 1;

const CAVE: Rect = [224, 288, 96, 96];
const LADDER: Rect = [352, 288, 32, 96];
const VINES: Rect = [0, 288, 96, 96];
const FALL: Rect = [0, 0, 96, 160];

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
      for (let x = 0; x < p.cols; x++) {
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
  for (const x of extras.vines ?? []) p.stand(sheet, VINES, x, foot, -3);
  if (extras.cave !== undefined) p.stand(sheet, CAVE, extras.cave, foot, -3);
  if (extras.ladder !== undefined) p.stand(sheet, LADDER, extras.ladder, foot, -3);
  if (extras.waterfall !== undefined) p.stand(WATERFALL, FALL, extras.waterfall, foot + 1.1, -2);
}
