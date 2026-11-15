import { type MapPainter, TILE, type Time } from '../pages/mapas-motor';
import { pick } from './grade';

/**
 * Buildings assembled from parts: walls, doors and windows come from the free sheets; the roof is
 * drawn in code, because the roof sheets only fit fixed sizes. One description gives one building.
 */

const BRICK = 'rev-structure-walls-brick-wall-a';
const SIDING = 'rev-structure-walls-siding-plain';
const DOOR = 'rev-structure-doors-32x64px-doors-15-panel-door-a';
const ARCH = 'rev-structure-doors-64x64px-arched-doors-arched-double-doors-a';
const WINDOW = 'rev-structure-windows-stone-windows-a';

export const BUILDING_SHEETS = [BRICK, SIDING, DOOR, ARCH, WINDOW];

/** Brick colors of the sheet, by the origin of each 3x3 block. */
const BRICKS = {
  creme: [0, 0],
  cinza: [3, 0],
  ardosia: [0, 3],
  vermelho: [3, 3],
  escuro: [0, 6],
  marrom: [3, 6],
} as const;
export type BrickColor = keyof typeof BRICKS;

export const ROOFS = {
  telha: ['#b5553a', '#8f3f2b', '#d0704f'],
  ardosia: ['#5a6478', '#454d60', '#77829a'],
  madeira: ['#8a6238', '#6b4a28', '#a57a48'],
  escuro: ['#3a3348', '#2a2536', '#51496b'],
  verde: ['#4f7a52', '#3a5c3e', '#6a9a6c'],
  neve: ['#e8eef5', '#c5d2e0', '#ffffff'],
} as const;
export type RoofColor = keyof typeof ROOFS;

export type Building = {
  name?: string;
  /** Width in tiles (3 to 10). */
  w: number;
  /** Each floor is two tiles tall. */
  floors: number;
  wall: { kind: 'brick'; color: BrickColor } | { kind: 'siding'; color: number; shade: number };
  roof: 'gable' | 'hipped' | 'flat';
  roofColor: RoofColor;
  door: { kind: 'panel' | 'arch'; color: number };
  /** `dark` leaves the windows off even at night (abandoned place). */
  windows: 'normal' | 'dark' | 'none';
  chimney?: boolean;
  battlements?: boolean;
};

export const buildingHeight = (b: Building): number =>
  b.floors * 2 + (b.roof === 'flat' ? 0.6 : 1.4);

function wallTile(
  b: Building,
  col: 0 | 1 | 2,
  row: 0 | 1 | 2,
  i: number,
): [string, number, number] {
  if (b.wall.kind === 'brick') {
    const [ox, oy] = BRICKS[b.wall.color];
    return [BRICK, (ox + col) * TILE, (oy + row) * TILE];
  }
  // Siding blocks are 5 tiles wide: edge, three middles, edge
  const x = b.wall.color * 5 + (col === 0 ? 0 : col === 2 ? 4 : 1 + (i % 3));
  return [SIDING, x * TILE, (b.wall.shade * 3 + row) * TILE];
}

/** Draws the roof and returns the mouth of the chimney, when there is one (in pixels). */
function drawRoof(
  ctx: CanvasRenderingContext2D,
  b: Building,
  left: number,
  top: number,
): [number, number] | null {
  const [base, dark, lite] = ROOFS[b.roofColor];
  const width = b.w * TILE;
  if (b.roof === 'flat') {
    ctx.fillStyle = 'rgba(16, 14, 26, 0.6)';
    ctx.fillRect(left - 2, top - 4, width + 4, 5);
    ctx.fillStyle = dark;
    ctx.fillRect(left - 2, top - 7, width + 4, 3);
    return null;
  }
  const rows = 8;
  const rowH = 6;
  for (let i = 0; i < rows; i++) {
    const inset = b.roof === 'hipped' ? i * 4 : 0;
    const x = left - 6 + inset;
    const y = top + 8 - (i + 1) * rowH;
    const w = width + 12 - inset * 2;
    ctx.fillStyle = i % 2 ? base : dark;
    ctx.fillRect(x, y, w, rowH);
    ctx.fillStyle = i % 2 ? lite : base;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let s = (i % 2) * 5 + 3; s < w - 1; s += 10) ctx.fillRect(x + s, y + 1, 1, rowH - 1);
  }
  ctx.fillStyle = lite;
  const ridgeInset = b.roof === 'hipped' ? rows * 4 : 0;
  ctx.fillRect(left - 6 + ridgeInset, top + 8 - rows * rowH - 2, width + 12 - ridgeInset * 2, 3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(left, top + 8, width, 4);
  if (b.chimney) {
    const cx = left + Math.round(width * 0.72);
    const cy = top + 8 - rows * rowH - 12;
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(cx, cy, 12, 22);
    ctx.fillStyle = '#a5553f';
    ctx.fillRect(cx, cy, 4, 22);
    ctx.fillStyle = '#3d2b18';
    ctx.fillRect(cx - 2, cy - 3, 16, 4);
    return [cx + 6, cy - 3];
  }
  return null;
}

/** Queues a building standing on a point (middle of its base, in tiles). */
export function placeBuilding(
  p: MapPainter,
  b: Building,
  x: number,
  y: number,
  time: Time = 'afternoon',
): void {
  const images = new Map(BUILDING_SHEETS.map((s) => [s, p.image(s)]));
  const rowsTall = b.floors * 2;
  const lit = time === 'night' && b.windows === 'normal';
  const windowCol = b.windows === 'dark' ? 0 : lit ? 2 : 1;
  const offsets: number[] = [];
  for (let off = 1.5; off <= b.w / 2 - 0.5; off += 1.5) offsets.push(-off, off);

  p.custom(x, y, (ctx, px, py) => {
    const left = px - (b.w * TILE) / 2;
    const top = py - rowsTall * TILE;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(left - 3, py - 3, b.w * TILE + 6, 6);
    for (let j = 0; j < rowsTall; j++) {
      const row = j === 0 ? 0 : j === rowsTall - 1 ? 2 : 1;
      for (let i = 0; i < b.w; i++) {
        const col = i === 0 ? 0 : i === b.w - 1 ? 2 : 1;
        const [sheet, sx, sy] = wallTile(b, col, row, i);
        const img = images.get(sheet) as HTMLImageElement;
        ctx.drawImage(img, sx, sy, TILE, TILE, left + i * TILE, top + j * TILE, TILE, TILE);
      }
    }
    if (b.battlements) {
      const [sheet, sx, sy] = wallTile(b, 1, 1, 0);
      const img = images.get(sheet) as HTMLImageElement;
      for (let i = 0; i < b.w * TILE; i += 16) {
        ctx.drawImage(img, sx, sy, 10, 10, left + i + 3, top - 16, 10, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(left + i + 3, top - 16, 10, 2);
      }
    }
    const mouth = drawRoof(ctx, b, left, top);
    if (mouth) p.mark('smoke', mouth[0], mouth[1]);
    if (b.windows !== 'none') {
      const img = images.get(WINDOW) as HTMLImageElement;
      for (let f = 0; f < b.floors; f++) {
        const wy = py - (f * 2 + 2) * TILE + 12;
        const list = f === 0 ? offsets : [0, ...offsets];
        for (const off of list) {
          ctx.drawImage(
            img,
            windowCol * TILE,
            96,
            TILE,
            TILE,
            px + off * TILE - 16,
            wy,
            TILE,
            TILE,
          );
        }
      }
    }
    if (b.door.kind === 'arch') {
      const img = images.get(ARCH) as HTMLImageElement;
      ctx.drawImage(img, 0, 32 + (b.door.color % 4) * 96, 64, 64, px - 32, py - 64, 64, 64);
    } else {
      const img = images.get(DOOR) as HTMLImageElement;
      ctx.drawImage(img, 224, 38 + (b.door.color % 8) * 128, 32, 58, px - 16, py - 58, 32, 58);
    }
  });
  if (lit) {
    for (let f = 0; f < b.floors; f++) {
      for (const off of f === 0 ? offsets : [0, ...offsets]) {
        p.light(x + off, y - f * 2 - 1.2, 1.6, '255,214,120');
      }
    }
  }
}

export type BuildingStyle = 'vila' | 'cidade' | 'castelo' | 'ruina' | 'neve';

/** A building at random inside a style (what a map of that kind asks for). */
export function randomBuilding(random: () => number, style: BuildingStyle): Building {
  const int = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));
  if (style === 'castelo') {
    return {
      w: int(5, 8),
      floors: int(2, 3),
      wall: { kind: 'brick', color: pick(random, ['cinza', 'ardosia'] as const) },
      roof: 'flat',
      roofColor: 'ardosia',
      door: { kind: 'arch', color: int(0, 3) },
      windows: 'normal',
      battlements: true,
    };
  }
  if (style === 'cidade' || style === 'ruina') {
    const flat = random() < 0.5;
    return {
      w: int(4, 6),
      floors: int(2, 3),
      wall:
        random() < 0.6
          ? {
              kind: 'brick',
              color: pick(random, ['cinza', 'ardosia', 'vermelho', 'creme'] as const),
            }
          : { kind: 'siding', color: int(0, 9), shade: int(1, 3) },
      roof: flat ? 'flat' : 'hipped',
      roofColor: pick(random, ['ardosia', 'escuro', 'telha'] as const),
      door: { kind: random() < 0.3 ? 'arch' : 'panel', color: int(0, 7) },
      windows: style === 'ruina' ? 'dark' : 'normal',
      chimney: !flat && style !== 'ruina' && random() < 0.5,
    };
  }
  return {
    w: int(4, 6),
    floors: random() < 0.3 ? 2 : 1,
    wall:
      random() < 0.5
        ? { kind: 'brick', color: pick(random, ['creme', 'vermelho', 'marrom'] as const) }
        : { kind: 'siding', color: int(0, 9), shade: int(0, 2) },
    roof: random() < 0.6 ? 'gable' : 'hipped',
    roofColor:
      style === 'neve' ? 'neve' : pick(random, ['telha', 'ardosia', 'madeira', 'verde'] as const),
    door: { kind: 'panel', color: int(0, 7) },
    windows: 'normal',
    chimney: random() < 0.6,
  };
}

/** Fixed examples shown in the lab, one of each kind the builder makes. */
export const BUILDING_EXAMPLES: Building[] = [
  {
    name: 'Casa de tijolo claro',
    w: 5,
    floors: 1,
    wall: { kind: 'brick', color: 'creme' },
    roof: 'gable',
    roofColor: 'telha',
    door: { kind: 'panel', color: 0 },
    windows: 'normal',
    chimney: true,
  },
  {
    name: 'Casa de tábuas',
    w: 4,
    floors: 1,
    wall: { kind: 'siding', color: 2, shade: 0 },
    roof: 'hipped',
    roofColor: 'madeira',
    door: { kind: 'panel', color: 2 },
    windows: 'normal',
  },
  {
    name: 'Sobrado de tijolo vermelho',
    w: 5,
    floors: 2,
    wall: { kind: 'brick', color: 'vermelho' },
    roof: 'gable',
    roofColor: 'ardosia',
    door: { kind: 'panel', color: 1 },
    windows: 'normal',
    chimney: true,
  },
  {
    name: 'Armazém',
    w: 7,
    floors: 1,
    wall: { kind: 'siding', color: 3, shade: 1 },
    roof: 'gable',
    roofColor: 'escuro',
    door: { kind: 'arch', color: 2 },
    windows: 'none',
  },
  {
    name: 'Prédio de cidade',
    w: 5,
    floors: 3,
    wall: { kind: 'brick', color: 'cinza' },
    roof: 'flat',
    roofColor: 'ardosia',
    door: { kind: 'panel', color: 4 },
    windows: 'normal',
  },
  {
    name: 'Prédio de tábuas azuis',
    w: 4,
    floors: 3,
    wall: { kind: 'siding', color: 1, shade: 2 },
    roof: 'hipped',
    roofColor: 'escuro',
    door: { kind: 'panel', color: 5 },
    windows: 'normal',
  },
  {
    name: 'Torre',
    w: 3,
    floors: 3,
    wall: { kind: 'brick', color: 'ardosia' },
    roof: 'hipped',
    roofColor: 'telha',
    door: { kind: 'panel', color: 3 },
    windows: 'normal',
  },
  {
    name: 'Portão do castelo',
    w: 8,
    floors: 2,
    wall: { kind: 'brick', color: 'cinza' },
    roof: 'flat',
    roofColor: 'ardosia',
    door: { kind: 'arch', color: 1 },
    windows: 'normal',
    battlements: true,
  },
  {
    name: 'Cabana na neve',
    w: 4,
    floors: 1,
    wall: { kind: 'siding', color: 3, shade: 2 },
    roof: 'gable',
    roofColor: 'neve',
    door: { kind: 'panel', color: 2 },
    windows: 'normal',
    chimney: true,
  },
  {
    name: 'Casa abandonada',
    w: 5,
    floors: 2,
    wall: { kind: 'brick', color: 'escuro' },
    roof: 'hipped',
    roofColor: 'escuro',
    door: { kind: 'panel', color: 6 },
    windows: 'dark',
  },
  {
    name: 'Taverna',
    w: 6,
    floors: 2,
    wall: { kind: 'brick', color: 'marrom' },
    roof: 'gable',
    roofColor: 'verde',
    door: { kind: 'arch', color: 0 },
    windows: 'normal',
    chimney: true,
  },
  {
    name: 'Guarita',
    w: 3,
    floors: 2,
    wall: { kind: 'brick', color: 'cinza' },
    roof: 'flat',
    roofColor: 'ardosia',
    door: { kind: 'panel', color: 7 },
    windows: 'normal',
    battlements: true,
  },
];
