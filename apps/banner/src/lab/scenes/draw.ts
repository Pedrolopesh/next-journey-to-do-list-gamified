import type { SceneEnv, TimeOfDay } from './types';

/** Gerador pseudoaleatório fixo: a mesma semente sempre desenha a mesma cena. */
export function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rect(
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  env.ctx.fillStyle = color;
  env.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Faixas horizontais de cor (degradê em "degraus", como em pixel art). */
export function bands(
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
): void {
  const step = h / colors.length;
  colors.forEach((color, i) => {
    rect(env, x, y + i * step, w, Math.ceil(step) + 1, color);
  });
}

/** Disco em pixels (sem suavização). */
export function disc(env: SceneEnv, cx: number, cy: number, r: number, color: string): void {
  env.ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    env.ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1);
  }
}

export function cloud(env: SceneEnv, x: number, y: number, size: number, color: string): void {
  disc(env, x, y, 5 * size, color);
  disc(env, x + 8 * size, y - 3 * size, 7 * size, color);
  disc(env, x + 17 * size, y, 6 * size, color);
  rect(env, x - 4 * size, y, 26 * size, 5 * size, color);
}

/** Repete um tile de 32x32 numa área, com deslocamento horizontal opcional. */
export function tileArea(
  env: SceneEnv,
  image: HTMLImageElement | undefined,
  sx: number,
  sy: number,
  x: number,
  y: number,
  w: number,
  h: number,
  shift = 0,
): void {
  if (!image) return;
  const { ctx } = env;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const start = -(((shift % 32) + 32) % 32);
  for (let ty = y; ty < y + h; ty += 32) {
    for (let tx = x + start; tx < x + w; tx += 32)
      ctx.drawImage(image, sx, sy, 32, 32, tx, ty, 32, 32);
  }
  ctx.restore();
}

export function sprite(
  env: SceneEnv,
  image: HTMLImageElement | undefined,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
): void {
  if (image) env.ctx.drawImage(image, sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw, sh);
}

export const SKY: Record<TimeOfDay, string[]> = {
  morning: ['#6f86c9', '#8e9bd0', '#b7a6d3', '#e6b3b5', '#f7c6a0', '#fbd9a5'],
  afternoon: ['#3f8fe0', '#5aa5e8', '#7bb9ee', '#9ecbf2', '#bcdcf5', '#d4e8f7'],
  night: ['#070b1f', '#0b1230', '#101a40', '#16234f', '#1d2d5c', '#25376a'],
};

/** Estrelas que piscam, só de noite. */
export function stars(
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  count = 40,
): void {
  if (env.time !== 'night') return;
  const random = rng(seed);
  for (let i = 0; i < count; i++) {
    const sx = x + Math.floor(random() * w);
    const sy = y + Math.floor(random() * h);
    const phase = random() * 6;
    const bright = Math.sin(env.t * 2 + phase) > -0.4;
    rect(env, sx, sy, 1, 1, bright ? '#fff6d8' : '#8a93b8');
  }
}

/** Sol (manhã baixo, tarde alto) ou lua (noite) dentro de uma área de céu. */
export function celestial(env: SceneEnv, x: number, y: number, w: number, h: number): void {
  if (env.time === 'morning') {
    disc(env, x + w * 0.22, y + h * 0.78, 11, '#ffe9b0');
    disc(env, x + w * 0.22, y + h * 0.78, 8, '#fff6cf');
  } else if (env.time === 'afternoon') {
    disc(env, x + w * 0.76, y + h * 0.24, 12, '#fff2b8');
    disc(env, x + w * 0.76, y + h * 0.24, 9, '#fffbe0');
  } else {
    disc(env, x + w * 0.78, y + h * 0.28, 10, '#e8ecff');
    disc(env, x + w * 0.78 + 4, y + h * 0.28 - 2, 8, '#16234f');
  }
}

/** Céu completo de uma área: faixas, estrelas, astro e nuvens que derivam devagar. */
export function sky(
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  withClouds = true,
): void {
  const { ctx } = env;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  bands(env, x, y, w, h, SKY[env.time]);
  stars(env, x, y, w, h * 0.7, 7);
  celestial(env, x, y, w, h);
  if (withClouds) {
    const color = env.time === 'night' ? '#2a3a6e' : env.time === 'morning' ? '#fde0d0' : '#ffffff';
    const drift = (env.t * 3) % (w + 80);
    cloud(env, x + ((drift + 30) % (w + 80)) - 40, y + h * 0.3, 1, color);
    cloud(env, x + ((drift + 190) % (w + 80)) - 40, y + h * 0.55, 1, color);
  }
  ctx.restore();
}

/** Prédios em silhueta com janelas que acendem à noite. */
export function skyline(
  env: SceneEnv,
  seed: number,
  baseY: number,
  minH: number,
  maxH: number,
  color: string,
  options: { windows?: boolean; ruined?: boolean; shift?: number } = {},
): void {
  const random = rng(seed);
  const shift = options.shift ?? 0;
  let x = -20;
  while (x < 410) {
    const w = 22 + Math.floor(random() * 26);
    const h = minH + Math.floor(random() * (maxH - minH));
    const bx = x - (shift % 40);
    rect(env, bx, baseY - h, w, h, color);
    if (options.ruined && random() > 0.45) {
      // topo quebrado: degraus no telhado
      const cut = 6 + Math.floor(random() * 10);
      rect(env, bx + w - cut, baseY - h - 1, cut, 1, color);
      env.ctx.clearRect(bx + w - cut, baseY - h, cut, Math.floor(cut / 2));
    }
    if (options.windows) {
      for (let wy = baseY - h + 5; wy < baseY - 4; wy += 7) {
        for (let wx = bx + 3; wx < bx + w - 3; wx += 6) {
          const lit = random() > 0.55;
          if (env.time === 'night' && lit)
            rect(env, wx, wy, 3, 3, random() > 0.8 ? '#8fd8ff' : '#ffd36b');
          else if (env.time !== 'night')
            rect(env, wx, wy, 3, 3, random() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)');
          else random();
        }
      }
    }
    x += w + 2 + Math.floor(random() * 4);
  }
}

/** Chama pequena (tochas, lareira, fogueira) que dança. */
export function flame(env: SceneEnv, x: number, y: number, size = 1): void {
  const wobble = Math.sin(env.t * 11 + x) > 0 ? 1 : 0;
  rect(env, x - 2 * size, y - 3 * size, 4 * size, 4 * size, '#d9480f');
  rect(env, x - 1 * size, y - (5 + wobble) * size, 3 * size, 5 * size, '#ff922b');
  rect(env, x - 1 * size + wobble, y - (7 + wobble) * size, 1 * size + 1, 4 * size, '#ffd43b');
}
