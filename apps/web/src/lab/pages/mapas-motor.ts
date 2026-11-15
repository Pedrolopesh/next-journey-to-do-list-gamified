/** Small tile painter for the ready-made maps of the lab: ground tiles first, then sprites by depth. */

export const TILE = 32;

/** A rectangle of a sheet, in pixels: x, y, width, height. */
export type Rect = readonly [number, number, number, number];
/** A tile of a sheet: column, row. */
export type Cell = readonly [number, number];

type Sprite = { depth: number; draw: (ctx: CanvasRenderingContext2D) => void };
type Lamp = { x: number; y: number; radius: number; color: string };

export type Time = 'morning' | 'afternoon' | 'night';

/**
 * Tiles of a terrain that follows any shape: a 3x3 block (corners, edges and center) at `origin`
 * and, when the sheet has them, the four inner corners at `inner` (2x2: the gap is at the
 * bottom right, bottom left, top right and top left).
 */
export type TileSet = {
  sheet: string;
  origin: Cell;
  inner?: Cell;
  /** Tiles drawn at random in the middle (default: the center of the block). */
  fill?: readonly Cell[];
  /** Leaves the middle empty, to show what is painted below. */
  hollow?: boolean;
};

/** Deterministic random numbers, so a map always looks the same. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MapPainter {
  readonly used = new Set<string>();
  private readonly sprites: Sprite[] = [];
  private readonly ctx: CanvasRenderingContext2D;
  readonly random: () => number;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly cols: number,
    readonly rows: number,
    private readonly images: Map<string, HTMLImageElement>,
    seed: number,
  ) {
    canvas.width = cols * TILE;
    canvas.height = rows * TILE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d indisponivel');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.random = rng(seed);
  }

  private readonly lamps: Lamp[] = [];

  /** Image of a sheet (also records it as used, for the credits). */
  image(sheet: string): HTMLImageElement {
    const img = this.images.get(sheet);
    if (!img) throw new Error(`peca nao carregada: ${sheet}`);
    this.used.add(sheet);
    return img;
  }

  /** Solid color under everything. */
  background(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** One tile of a sheet at a tile position. */
  tile(sheet: string, cell: Cell, x: number, y: number): void {
    this.ctx.drawImage(
      this.image(sheet),
      cell[0] * TILE,
      cell[1] * TILE,
      TILE,
      TILE,
      Math.round(x * TILE),
      Math.round(y * TILE),
      TILE,
      TILE,
    );
  }

  /** Fills a tile rectangle choosing at random among some tiles of the sheet. */
  fill(sheet: string, cells: readonly Cell[], x: number, y: number, w: number, h: number): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cell = cells[Math.floor(this.random() * cells.length)] as Cell;
        this.tile(sheet, cell, x + i, y + j);
      }
    }
  }

  /**
   * Draws an expandable 3x3 block of a terrain sheet: the corners and edges come from the outer
   * tiles and repeat along the sides. With `center` false the middle stays empty (to show what is
   * painted below, like water).
   */
  block(
    sheet: string,
    origin: Cell,
    x: number,
    y: number,
    w: number,
    h: number,
    center = true,
  ): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cx = i === 0 ? 0 : i === w - 1 ? 2 : 1;
        const cy = j === 0 ? 0 : j === h - 1 ? 2 : 1;
        if (!center && cx === 1 && cy === 1) continue;
        this.tile(sheet, [origin[0] + cx, origin[1] + cy], x + i, y + j);
      }
    }
  }

  /** Draws a rectangle of a sheet right away (flat things: rugs, bridges, paths). */
  flat(sheet: string, rect: Rect, x: number, y: number): void {
    this.ctx.drawImage(
      this.image(sheet),
      rect[0],
      rect[1],
      rect[2],
      rect[3],
      Math.round(x * TILE),
      Math.round(y * TILE),
      rect[2],
      rect[3],
    );
  }

  /** Repeats a flat rectangle across a tile area (planks, floors). */
  tiled(sheet: string, rect: Rect, x: number, y: number, w: number, h: number): void {
    for (let j = 0; j < h; j += rect[3] / TILE) {
      for (let i = 0; i < w; i += rect[2] / TILE) {
        this.flat(sheet, rect, x + i, y + j);
      }
    }
  }

  /**
   * Queues a sprite standing on a point (tile units): the bottom center of the rectangle lands
   * there. Sprites are drawn after the ground, farther ones first.
   */
  stand(sheet: string, rect: Rect, x: number, y: number, depthShift = 0): void {
    const img = this.image(sheet);
    const [sx, sy, sw, sh] = rect;
    const dx = Math.round(x * TILE - sw / 2);
    const dy = Math.round(y * TILE - sh);
    this.sprites.push({
      depth: y + depthShift,
      draw: (ctx) => ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh),
    });
  }

  /**
   * Queues something drawn in code (not from a sheet) standing on a point: the function gets the
   * point in pixels and draws upwards from it.
   */
  custom(
    x: number,
    y: number,
    draw: (ctx: CanvasRenderingContext2D, px: number, py: number) => void,
    depthShift = 0,
  ): void {
    const px = Math.round(x * TILE);
    const py = Math.round(y * TILE);
    this.sprites.push({ depth: y + depthShift, draw: (ctx) => draw(ctx, px, py) });
  }

  /** Draws on the ground right away, in code. */
  ground(draw: (ctx: CanvasRenderingContext2D) => void): void {
    draw(this.ctx);
  }

  /** A light that shows at night (position and radius in tiles, color as "r,g,b"). */
  light(x: number, y: number, radius: number, color = '255,176,90'): void {
    this.lamps.push({ x, y, radius, color });
  }

  /** Paints a terrain over every tile where `inside` is true, choosing corners and edges. */
  autotile(inside: (x: number, y: number) => boolean, set: TileSet): void {
    const [ox, oy] = set.origin;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!inside(x, y)) continue;
        const n = inside(x, y - 1);
        const s = inside(x, y + 1);
        const w = inside(x - 1, y);
        const e = inside(x + 1, y);
        let cell: Cell | null;
        if (n && s && w && e) {
          const i = set.inner;
          if (i && !inside(x + 1, y + 1)) cell = [i[0], i[1]];
          else if (i && !inside(x - 1, y + 1)) cell = [i[0] + 1, i[1]];
          else if (i && !inside(x + 1, y - 1)) cell = [i[0], i[1] + 1];
          else if (i && !inside(x - 1, y - 1)) cell = [i[0] + 1, i[1] + 1];
          else if (set.hollow) cell = null;
          else if (set.fill) cell = set.fill[Math.floor(this.random() * set.fill.length)] as Cell;
          else cell = [ox + 1, oy + 1];
        } else {
          cell = [ox + (w ? (e ? 1 : 2) : 0), oy + (n ? (s ? 1 : 2) : 0)];
        }
        if (cell) this.tile(set.sheet, cell, x, y);
      }
    }
  }

  /** Scatters sprites inside a tile area, away from the places already taken. */
  scatter(
    sheet: string,
    rects: readonly Rect[],
    area: { x: number; y: number; w: number; h: number },
    count: number,
    avoid: readonly { x: number; y: number; w: number; h: number }[] = [],
    gap = 1.2,
  ): void {
    const placed: { x: number; y: number }[] = [];
    let tries = 0;
    while (placed.length < count && tries < count * 40) {
      tries++;
      const x = area.x + this.random() * area.w;
      const y = area.y + this.random() * area.h;
      const blocked = avoid.some((a) => x > a.x && x < a.x + a.w && y > a.y && y < a.y + a.h);
      if (blocked || placed.some((p) => Math.hypot(p.x - x, p.y - y) < gap)) continue;
      placed.push({ x, y });
      const rect = rects[Math.floor(this.random() * rects.length)] as Rect;
      this.stand(sheet, rect, x, y);
    }
  }

  /**
   * Draws the queued sprites, from back to front, then the hour of the day: a warm veil in the
   * morning, and at night a dark blue veil with the lights on top. `tint` is an extra veil of
   * the place (fog, heat) and `night` the color of its night.
   */
  finish(time: Time = 'afternoon', tint?: string, night = '#5a66a8'): void {
    const ctx = this.ctx;
    this.sprites.sort((a, b) => a.depth - b.depth);
    for (const s of this.sprites) s.draw(ctx);
    const veil = (color: string, mode: GlobalCompositeOperation): void => {
      ctx.globalCompositeOperation = mode;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    };
    if (tint) veil(tint, 'source-over');
    if (time === 'morning') veil('rgba(255, 190, 120, 0.16)', 'source-over');
    if (time !== 'night') return;
    veil(night, 'multiply');
    ctx.globalCompositeOperation = 'lighter';
    for (const lamp of this.lamps) {
      const x = lamp.x * TILE;
      const y = lamp.y * TILE;
      const r = lamp.radius * TILE;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, `rgba(${lamp.color}, 0.55)`);
      glow.addColorStop(1, `rgba(${lamp.color}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

const cache = new Map<string, Promise<HTMLImageElement>>();

function loadSheet(id: string): Promise<HTMLImageElement> {
  let pending = cache.get(id);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`nao carregou ${id}`));
      img.src = `/lab/cenarios/${id}.png`;
    });
    cache.set(id, pending);
  }
  return pending;
}

/** Loads the sheets of a map (from the lab assets, once each) and waits for all of them. */
export async function loadSheets(ids: readonly string[]): Promise<Map<string, HTMLImageElement>> {
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(ids.map(async (id) => images.set(id, await loadSheet(id))));
  return images;
}
