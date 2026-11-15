import { type MapPainter, type Rect, TILE } from '../pages/mapas-motor';
import { BUSHES, plants, ROCKS, type Season, SHEET } from '../pages/mapas-pecas';

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
/** The wall stops this many tiles before each side of the screen. */
export const SIDE_GAP = 2;
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
    p.stand(SHEET.rocks, rock(big), end - out * 0.2 + lean(), LIP_ROW + 1.5);
    p.stand(SHEET.rocks, rock(big), end + out * 0.25 + lean(), LIP_ROW + 2.6);
    p.stand(SHEET.rocks, rock(big), end - out * 0.1 + lean(), foot - 0.1);
    p.stand(SHEET.rocks, rock(big), end + out * 0.9 + lean(), foot + 0.25);
    p.stand(SHEET.rocks, rock(small), end + out * 1.7, foot + 0.4);
    p.stand(SHEET.rocks, rock(small), end - out * 1, foot + 0.5);
    p.stand(plants(season), rock(BUSHES), end + out * 0.9, LIP_ROW + 1.1);
    p.stand(plants(season), rock(BUSHES), end + out * 1.4, LIP_ROW + 2.9);
  }
  for (const x of extras.vines ?? []) p.stand(sheet, VINES, x, foot, -3);
  if (extras.cave !== undefined) p.stand(sheet, CAVE, extras.cave, foot, -3);
  if (extras.ladder !== undefined) p.stand(sheet, LADDER, extras.ladder, foot, -3);
  if (extras.waterfall !== undefined) {
    p.stand(WATERFALL, FALL, extras.waterfall, foot + 1.1, -2);
    if (season !== 'winter')
      p.mark(
        'fall',
        Math.round(extras.waterfall * TILE - FALL[2] / 2),
        Math.round((foot + 1.1) * TILE - FALL[3]),
        FALL[2],
        FALL[3],
      );
  }
}
