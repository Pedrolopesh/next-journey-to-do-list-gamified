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

/** Bloco em pixel art: contorno de 1 px, cor, realce em cima e sombra embaixo. */
export function shadedBlock(
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  dark: string,
  light: string,
  outline: string,
): void {
  rect(env, x - 1, y - 1, w + 2, h + 2, outline);
  rect(env, x, y, w, h, fill);
  rect(env, x, y, w, 1, light);
  rect(env, x, y + h - 1, w, 1, dark);
}

/**
 * Posição na tela de um objeto do cenário que rola: o cenário passa da esquerda para a direita e
 * recomeça a cada `period` px. `factor` menor que 1 faz camadas distantes andarem mais devagar.
 */
export function scrolled(world: number, scroll: number, period: number, factor = 1): number {
  const margin = 100;
  return ((((world + scroll * factor + margin) % period) + period) % period) - margin;
}

/** Escolhe um valor conforme a hora do dia. */
export function byTime<T>(time: TimeOfDay, morning: T, afternoon: T, night: T): T {
  return time === 'morning' ? morning : time === 'afternoon' ? afternoon : night;
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

/** Nuvem macia: vários "bofes" com sombra embaixo (vetor, sem serrilhado). */
function cloud(env: SceneEnv, x: number, y: number, size: number, color: string): void {
  const { ctx } = env;
  const puffs: [number, number, number][] = [
    [0, 2, 5],
    [8, -2, 8],
    [17, 0, 7],
    [24, 3, 5],
    [12, 3, 7],
  ];
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#5b6b9a';
  for (const [dx, dy, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + (dy + 2) * size, r * size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  for (const [dx, dy, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Brilho suave (radial) em volta de um ponto, somando luz. */
export function glow(
  env: SceneEnv,
  x: number,
  y: number,
  radius: number,
  rgb: [number, number, number],
  alpha: number,
): void {
  const { ctx } = env;
  const [r, g, b] = rgb;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
  gradient.addColorStop(0.35, `rgba(${r},${g},${b},${alpha * 0.4})`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
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

/** Degradê contínuo vertical (céu, névoa) a partir da lista de cores. */
export function gradientRect(
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
): void {
  const gradient = env.ctx.createLinearGradient(0, y, 0, y + h);
  colors.forEach((color, i) => gradient.addColorStop(i / Math.max(1, colors.length - 1), color));
  env.ctx.fillStyle = gradient;
  env.ctx.fillRect(x, y, w, h);
}

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
  const { ctx } = env;
  const random = rng(seed);
  for (let i = 0; i < count; i++) {
    const sx = x + random() * w;
    const sy = y + random() * h;
    const phase = random() * 6;
    const size = random() > 0.85 ? 1.1 : 0.6;
    const alpha = 0.55 + 0.45 * Math.sin(env.t * 2 + phase);
    ctx.fillStyle = `rgba(255,246,216,${Math.max(0.15, alpha)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Sol (manhã baixo, tarde alto) ou lua cheia (noite) com brilho em volta. */
export function celestial(env: SceneEnv, x: number, y: number, w: number, h: number): void {
  const { ctx } = env;
  if (env.time === 'night') {
    const mx = x + w * 0.78;
    const my = y + h * 0.28;
    glow(env, mx, my, 34, [170, 190, 255], 0.35);
    ctx.fillStyle = '#eef2ff';
    ctx.beginPath();
    ctx.arc(mx, my, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,160,200,0.45)';
    for (const [dx, dy, r] of [
      [-3, -2, 2.2],
      [3, 2, 1.8],
      [1, -4, 1.2],
    ] as const) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const morning = env.time === 'morning';
  const sx = x + w * (morning ? 0.22 : 0.76);
  const sy = y + h * (morning ? 0.78 : 0.24);
  glow(env, sx, sy, morning ? 70 : 60, morning ? [255, 190, 120] : [255, 240, 190], 0.55);
  const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, 11);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.7, morning ? '#ffe2a0' : '#fff6c4');
  core.addColorStop(1, morning ? '#ffc680' : '#ffe48a');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(sx, sy, 11, 0, Math.PI * 2);
  ctx.fill();
}

const SKY_STOPS: Record<TimeOfDay, string[]> = {
  morning: ['#4f63b0', '#8a7cc0', '#d79bb4', '#f6b39a', '#ffd9a0'],
  afternoon: ['#2b7bd6', '#5aa5e8', '#8cc6f2', '#c4e2f8', '#e4f2fb'],
  night: ['#03061a', '#0a1236', '#14214f', '#22356b'],
};

/** Céu completo de uma área: degradê, estrelas, astro e nuvens que derivam devagar. */
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
  gradientRect(env, x, y, w, h, SKY_STOPS[env.time]);
  stars(env, x, y, w, h * 0.75, 7, Math.round(w / 6));
  celestial(env, x, y, w, h);
  if (withClouds) {
    const color = env.time === 'night' ? '#3a4a80' : env.time === 'morning' ? '#ffe6da' : '#ffffff';
    const span = w + 90;
    const drift = (env.t * 3) % span;
    cloud(env, x + ((drift + 30) % span) - 45, y + h * 0.3, 1, color);
    cloud(env, x + ((drift + 190) % span) - 45, y + h * 0.55, 1.2, color);
    if (w > 200) cloud(env, x + ((drift + 330) % span) - 45, y + h * 0.18, 0.8, color);
  }
  ctx.restore();
}

/** Chama pequena (tochas, lareira, fogueira) que dança. */
export function flame(env: SceneEnv, x: number, y: number, size = 1): void {
  const wobble = Math.sin(env.t * 11 + x) > 0 ? 1 : 0;
  rect(env, x - 2 * size, y - 3 * size, 4 * size, 4 * size, '#d9480f');
  rect(env, x - 1 * size, y - (5 + wobble) * size, 3 * size, 5 * size, '#ff922b');
  rect(env, x - 1 * size + wobble, y - (7 + wobble) * size, 1 * size + 1, 4 * size, '#ffd43b');
}
