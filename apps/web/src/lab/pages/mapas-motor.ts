/** Small tile painter for the ready-made maps of the lab: ground tiles first, then sprites by depth. */

export const TILE = 32;

/** A rectangle of a sheet, in pixels: x, y, width, height. */
export type Rect = readonly [number, number, number, number];
/** A tile of a sheet: column, row. */
export type Cell = readonly [number, number];

type Sprite = { sheet: string; rect: Rect; x: number; y: number; depth: number };

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

  private image(sheet: string): HTMLImageElement {
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
    this.sprites.push({ sheet, rect, x, y, depth: y + depthShift });
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

  /** Draws the queued sprites, from back to front. */
  finish(): void {
    this.sprites.sort((a, b) => a.depth - b.depth);
    for (const s of this.sprites) {
      const [sx, sy, sw, sh] = s.rect;
      this.ctx.drawImage(
        this.image(s.sheet),
        sx,
        sy,
        sw,
        sh,
        Math.round(s.x * TILE - sw / 2),
        Math.round(s.y * TILE - sh),
        sw,
        sh,
      );
    }
  }
}

/** Loads the sheets of a map (from the lab assets) and waits for all of them. */
export async function loadSheets(ids: readonly string[]): Promise<Map<string, HTMLImageElement>> {
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    ids.map(
      (id) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            images.set(id, img);
            resolve();
          };
          img.onerror = () => reject(new Error(`nao carregou ${id}`));
          img.src = `/lab/cenarios/${id}.png`;
        }),
    ),
  );
  return images;
}
