/** Boolean grid of a map (one value per tile), used to say where a terrain goes. */
export class Grid {
  private readonly cells: Uint8Array;

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.cells = new Uint8Array(cols * rows);
  }

  static from(cols: number, rows: number, fn: (x: number, y: number) => boolean): Grid {
    const grid = new Grid(cols, rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid.set(x, y, fn(x, y));
    return grid;
  }

  /** Outside the map the value of the nearest tile repeats, so the terrain runs off the edge. */
  get = (x: number, y: number): boolean => {
    const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(x)));
    const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(y)));
    return this.cells[cy * this.cols + cx] === 1;
  };

  set(x: number, y: number, value: boolean): void {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.cells[y * this.cols + x] = value ? 1 : 0;
  }

  /** Marks a rectangle. */
  box(x: number, y: number, w: number, h: number, value = true): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, value);
    return this;
  }

  /**
   * Removes the tiles that the corner and edge pieces cannot draw: strips one tile wide (nothing
   * above and below, or nothing on both sides). Repeats until none is left.
   */
  tidy(): this {
    for (let pass = 0; pass < 8; pass++) {
      let changed = false;
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          if (!this.get(x, y)) continue;
          const lone =
            (!this.get(x, y - 1) && !this.get(x, y + 1)) ||
            (!this.get(x - 1, y) && !this.get(x + 1, y));
          if (lone) {
            this.set(x, y, false);
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
    return this;
  }
}

export type Box = { x: number; y: number; w: number; h: number };
export const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });
export const inBox = (b: Box, x: number, y: number): boolean =>
  x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

export const pick = <T>(random: () => number, list: readonly T[]): T =>
  list[Math.floor(random() * list.length)] as T;
