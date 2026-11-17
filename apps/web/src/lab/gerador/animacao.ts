import type { Mark } from '../pages/mapas-motor';
import { BIOMES, type Recipe } from './receita';

/**
 * Motion on top of a painted map. The map itself is painted once and kept; a few times per
 * second the visible stretch is restored from that copy and the moving things are drawn over it:
 * glints on water and lava, the waterfall coming down, sparks and flicker on fires, smoke from
 * chimneys and what floats in the air (leaves, snow, embers, ash, fireflies).
 *
 * Nothing here keeps state between frames: every position comes from the clock, so the motion
 * is the same on every screen and continues across the turn of a looping map.
 */

export type Air = 'none' | 'leaves' | 'green' | 'snow' | 'embers' | 'ash' | 'fireflies' | 'rain';

/** A light of the map, in pixels. */
export type Glow = { x: number; y: number; radius: number; color: string };

export type Motion = {
  marks: Mark[];
  glows: Glow[];
  air: Air;
  night: boolean;
  /** Width of one screen in pixels: the air is sown per screen. */
  screen: number;
};

const FIRE = '255,150,60';
const LAVA = '255,90,30';
const FRAME_MS = 80;
const MARGIN = 48;

/** What floats in the air of a place, by its season and hour. */
export function airOf(recipe: Recipe): Air {
  const biome = BIOMES[recipe.biome];
  if (biome.indoor) return 'none';
  if (recipe.biome === 'inferno') return 'embers';
  if (recipe.biome === 'apocalipse') return 'ash';
  if (recipe.season === 'winter') return 'snow';
  if (recipe.weather === 'rain') return 'rain';
  if (!biome.trees.length) return 'none';
  if (recipe.season === 'autumn') return 'leaves';
  if (recipe.time === 'night') return 'fireflies';
  return 'green';
}

const AIR_COUNT: Record<Air, number> = {
  none: 0,
  leaves: 26,
  green: 8,
  snow: 46,
  embers: 30,
  ash: 24,
  fireflies: 12,
  rain: 90,
};
const LEAF_COLORS = ['#d9772b', '#c2452d', '#e0a93a', '#a85a24'];
const GREEN_COLORS = ['#7fbf5a', '#5a9a44', '#a8d06a'];

/** A fixed number from 0 to 1 for a key (always the same for the same key). */
const fixed = (key: number): number => {
  const s = Math.sin(key * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const wrap = (v: number, size: number): number => ((v % size) + size) % size;

type Fall = { x: number; y: number; w: number; h: number; water: Uint8Array };

class Animator {
  private readonly base: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly falls: Fall[] = [];

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly motion: Motion,
  ) {
    this.base = document.createElement('canvas');
    this.base.width = canvas.width;
    this.base.height = canvas.height;
    const copy = this.base.getContext('2d');
    const ctx = canvas.getContext('2d');
    if (!copy || !ctx) throw new Error('canvas 2d indisponivel');
    // Rain greys the whole map, moving or not
    if (motion.air === 'rain') {
      ctx.fillStyle = `rgba(48,66,102,${motion.night ? 0.14 : 0.24})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    copy.drawImage(canvas, 0, 0);
    this.ctx = ctx;
    // The waterfall is a picture: its water is found by color, so only the water moves
    for (const m of motion.marks) {
      if (m.kind !== 'fall') continue;
      const x = Math.max(0, Math.round(m.x));
      const y = Math.max(0, Math.round(m.y));
      const w = Math.min(m.w, canvas.width - x);
      const h = Math.min(m.h, canvas.height - y);
      if (w <= 0 || h <= 0) continue;
      const data = copy.getImageData(x, y, w, h).data;
      const water = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4] as number;
        const b = data[i * 4 + 2] as number;
        water[i] = b > 110 && b > r + 24 ? 1 : 0;
      }
      this.falls.push({ x, y, w, h, water });
    }
  }

  /** Puts the still map back (when the motion is turned off). */
  still(): void {
    this.ctx.drawImage(this.base, 0, 0);
  }

  /** One frame: only what is on screen is redrawn. Returns false when the canvas is gone. */
  frame(t: number): boolean {
    const canvas = this.canvas;
    const frame = canvas.parentElement;
    if (!canvas.isConnected || !frame) return false;
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.bottom < 0 || box.top > window.innerHeight) return true;
    const view = frame.getBoundingClientRect();
    const scale = canvas.width / box.width;
    const from = Math.max(0, (view.left - box.left) * scale);
    const to = Math.min(canvas.width, (view.right - box.left) * scale);
    if (to > from) this.paint(t, from, to);
    // The copy that makes the loop seamless shows the start of the map: keep it moving too
    const tail = canvas.nextElementSibling;
    if (tail instanceof HTMLCanvasElement) {
      const start = tail.getBoundingClientRect();
      const shown = Math.min(tail.width, (view.right - start.left) * scale);
      if (shown > 0) {
        const width = Math.min(shown, canvas.width);
        this.paint(t, 0, width);
        const out = tail.getContext('2d');
        for (let x = 0; x < shown; x += canvas.width) {
          out?.drawImage(canvas, 0, 0, width, canvas.height, x, 0, width, canvas.height);
        }
      }
    }
    return true;
  }

  private paint(t: number, from: number, to: number): void {
    const ctx = this.ctx;
    const height = this.canvas.height;
    const x0 = Math.max(0, Math.floor(from));
    const x1 = Math.min(this.canvas.width, Math.ceil(to));
    const inside = (x: number, pad = MARGIN): boolean => x > x0 - pad && x < x1 + pad;
    const dim = this.motion.night ? 0.55 : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, x1 - x0, height);
    ctx.clip();
    ctx.drawImage(this.base, x0, 0, x1 - x0, height, x0, 0, x1 - x0, height);

    const beat = Math.floor(t * 6);
    for (const m of this.motion.marks) {
      if (!inside(m.x)) continue;
      if (m.kind === 'water' || m.kind === 'lava') {
        const key = m.x * 7 + m.y * 13;
        const color = m.kind === 'lava' ? '255,232,150' : '255,255,255';
        for (let k = 0; k < 2; k++) {
          const phase = (Math.floor(fixed(key + k) * 26) + beat) % 26;
          if (phase > 5) continue;
          const alpha = ([0.16, 0.32, 0.48, 0.48, 0.32, 0.16][phase] as number) * dim;
          const x = m.x + Math.floor(fixed(key + k + 0.5) * 20) + phase;
          const y = m.y + 4 + Math.floor(fixed(key + k + 0.9) * 24);
          ctx.fillStyle = `rgba(${color},${alpha})`;
          ctx.fillRect(x, y, 6, 1);
          ctx.fillRect(x + 2, y + 1, 3, 1);
        }
      } else if (m.kind === 'smoke') {
        for (let k = 0; k < 5; k++) {
          const life = (t * 0.3 + k / 5) % 1;
          const size = 4 + Math.floor(life * 7);
          const x = m.x + Math.sin(life * 5 + k) * 4 + life * 12 - size / 2;
          const y = m.y - life * 50 - size;
          ctx.fillStyle = `rgba(214,214,224,${(1 - life) * 0.5 * (this.motion.night ? 0.6 : 1)})`;
          ctx.fillRect(Math.round(x), Math.round(y), size, size);
        }
      }
    }

    for (const f of this.falls) {
      if (!inside(f.x, f.w + MARGIN)) continue;
      for (let c = 0; c < f.w; c += 3) {
        const speed = 70 + fixed(c) * 50;
        for (let s = 0; s < 3; s++) {
          const y = Math.floor(wrap(fixed(c * 3 + s) * f.h + t * speed, f.h));
          for (let d = 0; d < 10; d += 2) {
            const row = y + d;
            if (row >= f.h || !f.water[row * f.w + c]) continue;
            ctx.fillStyle = `rgba(255,255,255,${(0.6 - d * 0.05) * dim})`;
            ctx.fillRect(f.x + c, f.y + row, 2, 2);
          }
        }
      }
      // Foam jumping where it hits the pool
      for (let k = 0; k < 7; k++) {
        const x = f.x - 4 + fixed(k + 0.2) * (f.w + 4);
        const y = f.y + f.h - 5 + Math.sin(t * 7 + k * 2.1) * 3;
        ctx.fillStyle = `rgba(255,255,255,${0.85 * dim})`;
        ctx.fillRect(Math.round(x), Math.round(y), 3, 2);
      }
    }

    // Fires: sparks going up and a glow that trembles. Lava breathes slowly
    ctx.globalCompositeOperation = 'lighter';
    for (const g of this.motion.glows) {
      if (!inside(g.x, g.radius + MARGIN)) continue;
      const fire = g.color === FIRE;
      if (!fire && !(g.color === LAVA && this.motion.night)) continue;
      const wave = fire
        ? Math.sin(t * 9 + g.x) * Math.sin(t * 5.3 + g.x * 2)
        : Math.sin(t * 1.4 + g.x * 0.05);
      const strength = (this.motion.night ? 0.16 : 0.07) * (0.6 + 0.4 * wave);
      const radius = g.radius * (this.motion.night ? 0.8 : 0.45);
      const glow = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, radius);
      glow.addColorStop(0, `rgba(${g.color},${Math.max(0, strength)})`);
      glow.addColorStop(1, `rgba(${g.color},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(g.x - radius, g.y - radius, radius * 2, radius * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const g of this.motion.glows) {
      if (g.color !== FIRE || !inside(g.x)) continue;
      for (let k = 0; k < 4; k++) {
        const life = (t * 0.9 + fixed(g.x + k * 3.1)) % 1;
        const x = g.x + (fixed(k + g.x) - 0.5) * 14 + Math.sin(life * 6 + k) * 3;
        const y = g.y + 6 - life * 30;
        ctx.fillStyle = `rgba(255,${200 - Math.floor(life * 90)},90,${1 - life})`;
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
    }

    this.air(t, x0, x1);
    ctx.restore();
  }

  private air(t: number, x0: number, x1: number): void {
    const { air, night, screen } = this.motion;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const count = Math.round((AIR_COUNT[air] * width) / screen);
    const fade = night ? 0.7 : 1;
    if (air === 'rain') {
      this.rain(t, x0, x1, count, fade);
      return;
    }
    for (let i = 0; i < count; i++) {
      const a = fixed(i);
      const b = fixed(i + 0.37);
      const c = fixed(i + 0.71);
      let x: number;
      let y: number;
      if (air === 'fireflies') {
        x = a * width + Math.sin(t * 0.5 + i) * 18;
        y = 40 + b * (height - 80) + Math.cos(t * 0.37 + i * 2) * 12;
      } else if (air === 'embers') {
        x = wrap(a * width + Math.sin(t * 1.1 + i) * 8 + t * 6, width);
        y = wrap(b * height - t * (16 + c * 16), height);
      } else {
        const fall = air === 'snow' ? 24 + c * 18 : air === 'ash' ? 9 + c * 8 : 14 + c * 12;
        const wind = air === 'snow' ? 6 : air === 'ash' ? 4 : 18 + c * 14;
        x = wrap(a * width + t * wind + Math.sin(t * 1.3 + i) * 10, width);
        y = wrap(b * height + t * fall, height);
      }
      if (x < x0 - 8 || x > x1 + 8) continue;
      const px = Math.round(x);
      const py = Math.round(y);
      if (air === 'fireflies') {
        const blink = Math.max(0, Math.sin(t * 2 + i * 1.7));
        ctx.fillStyle = `rgba(230,255,140,${blink * 0.22})`;
        ctx.fillRect(px - 2, py - 2, 6, 6);
        ctx.fillStyle = `rgba(240,255,170,${blink})`;
        ctx.fillRect(px, py, 2, 2);
      } else if (air === 'embers') {
        ctx.fillStyle = `rgba(255,${150 + Math.floor(c * 80)},60,${0.5 + 0.5 * Math.sin(t * 4 + i)})`;
        ctx.fillRect(px, py, 2, 2);
      } else if (air === 'snow') {
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
        ctx.fillRect(px, py, c > 0.7 ? 3 : 2, 2);
      } else if (air === 'ash') {
        ctx.fillStyle = `rgba(190,186,180,${0.5 * fade})`;
        ctx.fillRect(px, py, 2, 2);
      } else {
        const colors = air === 'leaves' ? LEAF_COLORS : GREEN_COLORS;
        ctx.globalAlpha = fade;
        ctx.fillStyle = colors[i % colors.length] as string;
        // The leaf turns as it falls
        if ((Math.floor(t * 4) + i) % 2) ctx.fillRect(px, py, 3, 2);
        else ctx.fillRect(px, py, 2, 3);
        ctx.globalAlpha = 1;
      }
    }
  }

  /** Slanted streaks coming down fast, and the small splashes they leave on the ground. */
  private rain(t: number, x0: number, x1: number, count: number, fade: number): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.fillStyle = `rgba(206,226,250,${0.6 * fade})`;
    for (let i = 0; i < count; i++) {
      const speed = 520 + fixed(i + 0.71) * 160;
      const y = wrap(fixed(i + 0.37) * (height + 40) + t * speed, height + 40) - 20;
      const x = wrap(fixed(i) * width - t * speed * 0.28, width);
      if (x < x0 - 8 || x > x1 + 8) continue;
      const px = Math.round(x);
      const py = Math.round(y);
      for (let s = 0; s < 4; s++) ctx.fillRect(px + s, py - s * 3, 1, 3);
    }
    for (let i = 0; i < count / 2; i++) {
      const clock = t * 2.2 + fixed(i + 0.13) * 5;
      const turn = Math.floor(clock);
      const life = clock - turn;
      const x = Math.round(fixed(i * 3.3 + turn * 0.77) * width);
      if (x < x0 - 8 || x > x1 + 8) continue;
      const y = Math.round(24 + fixed(i * 1.7 + turn * 0.31) * (height - 30));
      const reach = 1 + Math.floor(life * 4);
      ctx.fillStyle = `rgba(222,238,255,${(1 - life) * 0.7 * fade})`;
      ctx.fillRect(x - reach - 1, y, 2, 1);
      ctx.fillRect(x + reach, y, 2, 1);
      if (life < 0.4) ctx.fillRect(x, y - 2, 1, 2);
    }
  }
}

const running = new Set<Animator>();
let enabled =
  typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let timer = 0;
let last = 0;

function tick(now: number): void {
  timer = 0;
  if (!enabled || !running.size) return;
  if (now - last >= FRAME_MS) {
    last = now;
    for (const item of running) if (!item.frame(now / 1000)) running.delete(item);
  }
  timer = requestAnimationFrame(tick);
}

/** Starts the motion of a painted map (it stops by itself when the canvas leaves the page). */
export function animate(canvas: HTMLCanvasElement, motion: Motion): void {
  running.add(new Animator(canvas, motion));
  if (enabled && !timer) timer = requestAnimationFrame(tick);
}

export const motionOn = (): boolean => enabled;

/** Turns the motion of every map on or off. */
export function setMotion(on: boolean): void {
  enabled = on;
  if (on) {
    if (!timer) timer = requestAnimationFrame(tick);
    return;
  }
  for (const item of running) {
    if (item.canvas.isConnected) item.still();
    else running.delete(item);
  }
}
