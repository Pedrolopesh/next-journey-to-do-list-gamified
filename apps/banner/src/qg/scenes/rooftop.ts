import { bands, gradientRect, rect, rng, sky, tileArea } from './draw';
import type { Light, SceneDef, SceneEnv, TimeOfDay } from './types';
import { SCENE_W } from './types';

const PARAPET = 146;
const WALL_TOP = PARAPET - 8;
const RAIL_TOP = WALL_TOP - 16;
const FLOOR = PARAPET + 14;
const SHORE = 112;
const OUT = '#14161c';

type Palette = {
  far: string;
  mid: string;
  near: string;
  side: string;
  haze: string;
  lake: string[];
  glint: string;
};

const PAL: Record<TimeOfDay, Palette> = {
  morning: {
    far: '#d6b0c0',
    mid: '#b891ad',
    near: '#8d6f9f',
    side: '#6e5687',
    haze: '255,214,170',
    lake: ['#f2b49a', '#c8849c', '#8a6fa8'],
    glint: '#fff0c8',
  },
  afternoon: {
    far: '#a8c3df',
    mid: '#86a6ca',
    near: '#6384ab',
    side: '#4b6a90',
    haze: '226,240,251',
    lake: ['#cde8f8', '#6fb4e4', '#2f84cc'],
    glint: '#ffffff',
  },
  night: {
    far: '#1f2d5a',
    mid: '#16224a',
    near: '#0d1736',
    side: '#080f27',
    haze: '38,57,111',
    lake: ['#26396f', '#14224f', '#0a1235'],
    glint: '#cfd8ff',
  },
};

type LayerOptions = {
  seed: number;
  base: number;
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  x0: number;
  x1: number;
  color: string;
  side?: string;
  windows?: 'tiny' | 'normal';
  taperFrom?: number;
};

/** Janelas de um prédio: acesas à noite, com reflexo do céu de dia. */
function windows(
  env: SceneEnv,
  random: () => number,
  x: number,
  top: number,
  w: number,
  base: number,
  kind: 'tiny' | 'normal',
): void {
  const colStep = kind === 'tiny' ? 4 : 6;
  const rowStep = kind === 'tiny' ? 5 : 8;
  const ww = kind === 'tiny' ? 1 : 3;
  const wh = kind === 'tiny' ? 2 : 4;
  for (let wy = top + 4; wy < base - 4; wy += rowStep) {
    for (let wx = x + 2; wx < x + w - 3; wx += colStep) {
      const lit = random() > 0.5;
      const warm = random() > 0.22;
      if (env.time === 'night') {
        if (lit) rect(env, wx, wy, ww, wh, warm ? '#ffd36b' : '#8fd8ff');
      } else {
        rect(env, wx, wy, ww, wh, lit ? 'rgba(255,255,255,0.3)' : 'rgba(20,40,80,0.25)');
      }
    }
  }
}

/** Uma faixa de prédios. Os da frente mostram uma lateral (perspectiva em direção ao centro). */
function layer(env: SceneEnv, o: LayerOptions): void {
  const random = rng(o.seed);
  let x = o.x0;
  while (x < o.x1) {
    const w = o.minW + Math.floor(random() * (o.maxW - o.minW));
    let h = o.minH + Math.floor(random() * (o.maxH - o.minH));
    if (o.taperFrom !== undefined && x > o.taperFrom) {
      h = Math.max(8, h * (1 - ((x - o.taperFrom) / (o.x1 - o.taperFrom)) * 0.7));
    }
    const top = o.base - h;
    if (o.side) {
      const dir = x + w / 2 < SCENE_W / 2 ? 1 : -1;
      for (let k = 0; k < 6; k++) {
        const sx = dir > 0 ? x + w + k : x - 1 - k;
        const cut = Math.round(k * 0.6);
        rect(env, sx, top + cut, 1, h - cut, o.side);
      }
    }
    rect(env, x, top, w, h, o.color);
    const r = random();
    if (r > 0.9) rect(env, x + Math.floor(w / 2), top - 8, 1, 8, o.color);
    else if (r > 0.72) rect(env, x + 2, top - 3, w - 4, 3, o.color);
    if (o.windows) windows(env, random, x, top, w, o.base, o.windows);
    x += w + 1 + Math.floor(random() * 3);
  }
}

/** Névoa da distância: apaga um pouco as camadas de trás. */
function haze(env: SceneEnv, y0: number, y1: number, alpha: number): void {
  const { ctx } = env;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(${PAL[env.time].haze},0)`);
  g.addColorStop(1, `rgba(${PAL[env.time].haze},${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, SCENE_W, y1 - y0);
}

/** Lago à direita, com a outra margem arborizada, brilhos e o reflexo do astro. */
function lake(env: SceneEnv): void {
  const { ctx } = env;
  const pal = PAL[env.time];
  const x0 = 216;
  gradientRect(env, x0, SHORE, SCENE_W - x0, WALL_TOP - SHORE + 2, pal.lake);
  const random = rng(31);
  for (let x = x0; x < SCENE_W; x += 5) {
    const h = 2 + Math.floor(random() * 4);
    rect(env, x, SHORE - h + 1, 6, h, env.time === 'night' ? '#0c1a2a' : '#4a7a68');
  }
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const gx = x0 + random() * 150;
    const gy = SHORE + 2 + random() * 14;
    const gw = 3 + random() * 6;
    ctx.globalAlpha = 0.12 + 0.28 * Math.pow(Math.sin(env.t * 2 + i * 1.3), 2);
    rect(env, gx, gy, gw, 1, pal.glint);
  }
  const rx = env.time === 'afternoon' ? 296 : env.time === 'night' ? 304 : null;
  if (rx !== null) {
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 0.75;
      rect(env, rx - 8 + Math.sin(env.t * 2 + i) * 2, SHORE + 3 + i * 3, 16 - i * 2, 1, pal.glint);
    }
  }
  if (env.time === 'night') {
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(env.t * 1.5 + i);
      rect(env, x0 + 4 + i * 6, SHORE + 3, 1, 8 + (i % 3) * 2, i % 3 ? '#ffd36b' : '#8fd8ff');
    }
  }
  ctx.restore();
}

const TOWER = { x: 146, w: 22, h: 96 };

/** Torre alta de referência com antena e luz vermelha piscando. */
function tower(env: SceneEnv): void {
  const pal = PAL[env.time];
  const base = WALL_TOP + 4;
  const top = base - TOWER.h;
  for (let k = 0; k < 6; k++)
    rect(env, TOWER.x + TOWER.w + k, top + Math.round(k * 0.6), 1, TOWER.h, pal.side);
  rect(env, TOWER.x, top, TOWER.w, TOWER.h, pal.near);
  rect(env, TOWER.x + 4, top - 6, TOWER.w - 8, 6, pal.near);
  rect(env, TOWER.x + 10, top - 22, 2, 16, pal.near);
  const random = rng(77);
  windows(env, random, TOWER.x, top, TOWER.w, base, 'normal');
  if (Math.sin(env.t * 4) > 0) rect(env, TOWER.x + 9, top - 24, 4, 3, '#ff3b30');
}

function city(env: SceneEnv): void {
  const pal = PAL[env.time];
  sky(env, 0, 0, SCENE_W, SHORE + 8);
  layer(env, {
    seed: 3,
    base: SHORE + 2,
    minH: 8,
    maxH: 22,
    minW: 8,
    maxW: 16,
    x0: -4,
    x1: SCENE_W + 10,
    color: pal.far,
  });
  haze(env, 60, SHORE + 4, 0.35);
  lake(env);
  layer(env, {
    seed: 9,
    base: 132,
    minH: 14,
    maxH: 42,
    minW: 12,
    maxW: 22,
    x0: -4,
    x1: 246,
    color: pal.mid,
    windows: 'tiny',
    taperFrom: 150,
  });
  haze(env, 80, 136, 0.22);
  layer(env, {
    seed: 14,
    base: WALL_TOP + 4,
    minH: 36,
    maxH: 78,
    minW: 20,
    maxW: 32,
    x0: -10,
    x1: 232,
    color: pal.near,
    side: pal.side,
    windows: 'normal',
    taperFrom: 170,
  });
  tower(env);
}

type Point = [number, number];

/** Preenche um polígono em pixels inteiros (sem serrilhado suave), linha a linha. */
function poly(ctx: CanvasRenderingContext2D, pts: Point[], color: string): void {
  ctx.fillStyle = color;
  const ys = pts.map((p) => p[1]);
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  for (let y = minY; y < maxY; y++) {
    const cy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      if (!p1 || !p2) continue;
      if ((p1[1] <= cy && p2[1] > cy) || (p2[1] <= cy && p1[1] > cy)) {
        xs.push(p1[0] + ((cy - p1[1]) / (p2[1] - p1[1])) * (p2[0] - p1[0]));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.round(xs[k] ?? 0);
      const to = Math.round(xs[k + 1] ?? 0);
      if (to > from) ctx.fillRect(from, y, to - from, 1);
    }
  }
}

const LOUNGER_W = 100;
const LOUNGER_H = 64;
const LOUNGER_OX = 32;
const LOUNGER_OY = 52;
let loungerSprite: HTMLCanvasElement | null = null;

/** Desenha a espreguiçadeira uma vez (diagonal, vista de trás e de lado), com contorno de 1 px. */
function buildLounger(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = LOUNGER_W;
  canvas.height = LOUNGER_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const L = 46;
  const W = 20;
  /** Ponto do chão (l: comprimento, w: largura, z: altura) projetado na tela. */
  const P = (l: number, w: number, z = 0): Point => [
    LOUNGER_OX + l + w * 0.55,
    LOUNGER_OY - l * 0.5 + w * 0.45 - z,
  ];
  const BLUE = '#2d6cdf';
  const BLUE_DARK = '#1d4aa0';
  const WHITE = '#f8f8f8';
  const WHITE_DARK = '#c3c9d3';
  const WOOD = '#c88a46';
  const seatZ = (l: number): number => (l <= 34 ? 8 : 8 + ((l - 34) * 6) / 12);

  // topo do assento e do apoio de pés, em listras
  for (let k = 0; k * 4 < L; k++) {
    const a = k * 4;
    const b = a + 4;
    poly(
      ctx,
      [P(a, 0, seatZ(a)), P(b, 0, seatZ(b)), P(b, W, seatZ(b)), P(a, W, seatZ(a))],
      k % 2 ? BLUE : WHITE,
    );
  }
  // lateral perto de nós
  for (let k = 0; k * 4 < L; k++) {
    const a = k * 4;
    const b = a + 4;
    poly(
      ctx,
      [P(a, W, seatZ(a)), P(b, W, seatZ(b)), P(b, W, seatZ(b) - 5), P(a, W, seatZ(a) - 5)],
      k % 2 ? BLUE_DARK : WHITE_DARK,
    );
  }
  // travessa de madeira sob o assento
  poly(ctx, [P(0, W, 3), P(34, W, 3), P(L, W, 9), P(L, W, 7), P(34, W, 1), P(0, W, 1)], WOOD);
  // encosto: borda lateral e a parte de trás, listrada na vertical
  poly(ctx, [P(0, W, 8), P(-10, W, 30), P(-5, W, 30), P(5, W, 8)], BLUE_DARK);
  for (let k = 0; k < 5; k++) {
    const w1 = k * 4;
    const w2 = w1 + 4;
    poly(ctx, [P(0, w1, 8), P(0, w2, 8), P(-10, w2, 30), P(-10, w1, 30)], k % 2 ? BLUE : WHITE);
  }
  poly(ctx, [P(0, W, 8), P(-10, W, 30), P(-10, W, 28), P(0, W, 6)], WOOD);
  // topo do encosto com realce
  poly(ctx, [P(-10, 0, 30), P(-10, W, 30), P(-5, W, 30), P(-5, 0, 30)], WHITE_DARK);

  // mesinha com drink, ao lado da cabeceira
  ctx.fillStyle = '#b9b4a8';
  ctx.fillRect(11, 43, 2, 9);
  ctx.fillRect(8, 51, 8, 1);
  ctx.fillStyle = '#e4dfd2';
  ctx.fillRect(6, 41, 12, 2);
  ctx.fillStyle = '#a9a498';
  ctx.fillRect(6, 42, 12, 1);
  ctx.fillStyle = '#d9ecff';
  ctx.fillRect(9, 34, 4, 7);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(9, 37, 4, 4);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(12, 31, 1, 5);

  // contorno escuro em volta de tudo
  const { data } = ctx.getImageData(0, 0, LOUNGER_W, LOUNGER_H);
  const solid = (x: number, y: number): boolean =>
    x >= 0 &&
    y >= 0 &&
    x < LOUNGER_W &&
    y < LOUNGER_H &&
    (data[(y * LOUNGER_W + x) * 4 + 3] ?? 0) > 0;
  ctx.fillStyle = OUT;
  for (let y = 0; y < LOUNGER_H; y++) {
    for (let x = 0; x < LOUNGER_W; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))
        ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/** Espreguiçadeira em diagonal, de frente para o sol (dir 1: sol à direita; -1: à esquerda). */
function lounger(env: SceneEnv, cx: number, baseY: number, dir: 1 | -1): void {
  const { ctx } = env;
  loungerSprite ??= buildLounger();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx + dir * 24, baseY - 8, 32, 6.5, dir * -0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(cx, baseY - LOUNGER_OY);
  ctx.scale(dir, 1);
  ctx.drawImage(loungerSprite, -LOUNGER_OX, 0);
  ctx.restore();
}

type LeafColors = { line: string; dark: string; mid: string; light: string; rib: string };

/** Folha em pixel art: elipse girada com contorno, sombra embaixo e nervura central. */
function leaf(
  env: SceneEnv,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  c: LeafColors,
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const reach = Math.ceil(Math.max(rx, ry)) + 2;
  for (let pass = 0; pass < 2; pass++) {
    const ex = pass === 0 ? rx + 1.2 : rx;
    const ey = pass === 0 ? ry + 1.2 : ry;
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const u = dx * cos + dy * sin;
        const v = -dx * sin + dy * cos;
        if ((u * u) / (ex * ex) + (v * v) / (ey * ey) > 1) continue;
        let color = c.line;
        if (pass === 1) {
          color = v > ry * 0.3 ? c.dark : v < -ry * 0.35 ? c.light : c.mid;
          if (Math.abs(v) < 0.6 && u > -rx * 0.4) color = c.rib;
        }
        rect(env, cx + dx, cy + dy, 1, 1, color);
      }
    }
  }
}

const GREEN: LeafColors = {
  line: '#0d3a22',
  dark: '#1e7a43',
  mid: '#2fa152',
  light: '#58cf78',
  rib: '#9be8ae',
};
const FERN: LeafColors = {
  line: '#0f3d28',
  dark: '#238a58',
  mid: '#37b373',
  light: '#74dc9c',
  rib: '#b4f2c8',
};

type PotColors = { base: string; light: string; dark: string; band: string; rim: string };

/** Vaso em pixel art: borda, faixa decorada com losangos, corpo que afina e pires. */
function pot(env: SceneEnv, cx: number, baseY: number, w: number, h: number, c: PotColors): void {
  const { ctx } = env;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, w * 0.7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const top = baseY - h;
  // corpo que afina para baixo
  for (let r = 4; r < h - 2; r++) {
    const width = Math.round(w - ((r - 4) / (h - 6)) * (w * 0.32));
    const x = cx - Math.floor(width / 2);
    rect(env, x - 1, top + r, width + 2, 1, OUT);
    rect(env, x, top + r, width, 1, c.base);
    rect(env, x, top + r, 3, 1, c.light);
    rect(env, x + width - 4, top + r, 4, 1, c.dark);
  }
  // faixa decorada
  for (let i = 0; i < w; i += 6) {
    const bx = cx - Math.floor(w / 2) + i + 2;
    rect(env, bx + 1, top + 7, 1, 1, c.band);
    rect(env, bx, top + 8, 3, 1, c.band);
    rect(env, bx + 1, top + 9, 1, 1, c.band);
  }
  // borda
  rect(env, cx - Math.floor(w / 2) - 3, top - 1, w + 6, 6, OUT);
  rect(env, cx - Math.floor(w / 2) - 2, top, w + 4, 4, c.rim);
  rect(env, cx - Math.floor(w / 2) - 2, top, w + 4, 1, c.light);
  rect(env, cx - Math.floor(w / 2) - 2, top + 3, w + 4, 1, c.dark);
  // pires
  rect(env, cx - Math.floor(w / 3) - 1, baseY - 3, Math.floor((w * 2) / 3) + 2, 4, OUT);
  rect(env, cx - Math.floor(w / 3), baseY - 2, Math.floor((w * 2) / 3), 2, c.dark);
}

/** Planta grande de folhas largas, em leque, que balança de leve. */
function leafyPlant(env: SceneEnv, cx: number, potTop: number): void {
  const sway = Math.sin(env.t * 1.1) * 0.05;
  const leaves: [number, number, number, number][] = [
    [-1.25, 11, 9, 4.6],
    [1.25, 11, 9, 4.6],
    [-0.8, 17, 10, 5],
    [0.8, 17, 10, 5],
    [-0.35, 22, 11, 5.2],
    [0.35, 22, 11, 5.2],
    [0, 12, 8, 4],
  ];
  leaves.forEach(([a, dist, rx, ry], i) => {
    const angle = a + sway * (1 + i * 0.15);
    const lx = cx + Math.sin(angle) * dist;
    const ly = potTop - Math.cos(angle) * dist;
    leaf(env, Math.round(lx), Math.round(ly), rx, ry, angle - Math.PI / 2, i % 2 ? GREEN : FERN);
  });
}

/** Moita de folhas finas e altas com flores rosas no topo. */
function flowerPlant(env: SceneEnv, cx: number, potTop: number): void {
  const sway = Math.sin(env.t * 1.3 + 1) * 0.04;
  const stems: [number, number][] = [
    [-0.7, 20],
    [-0.4, 27],
    [-0.15, 32],
    [0.15, 31],
    [0.4, 26],
    [0.7, 19],
  ];
  stems.forEach(([a, len], i) => {
    const angle = a + sway;
    leaf(
      env,
      Math.round(cx + Math.sin(angle) * (len * 0.55)),
      Math.round(potTop - Math.cos(angle) * (len * 0.55)),
      len * 0.55,
      2.6,
      angle - Math.PI / 2,
      i % 2 ? GREEN : FERN,
    );
  });
  const flowers: [number, number][] = [
    [-0.55, 34],
    [-0.1, 40],
    [0.45, 32],
    [0.15, 35],
  ];
  flowers.forEach(([a, len], i) => {
    const angle = a + sway;
    const fx = Math.round(cx + Math.sin(angle) * len);
    const fy = Math.round(potTop - Math.cos(angle) * len);
    const petal = i % 2 ? '#ff7aa8' : '#ffa3c4';
    rect(env, fx - 3, fy - 1, 7, 3, OUT);
    rect(env, fx - 1, fy - 3, 3, 7, OUT);
    rect(env, fx - 2, fy, 5, 1, petal);
    rect(env, fx, fy - 2, 1, 5, petal);
    rect(env, fx - 1, fy - 1, 3, 3, petal);
    rect(env, fx, fy, 1, 1, '#ffd166');
  });
}

const POLE_GAP = 48;
const POLE_TOP = RAIL_TOP - 9;
const SAG = 6;

/** Corrimão de metal: balaústres finos, travessa de baixo, corrimão com realce e postes com tampa. */
function railing(env: SceneEnv): void {
  rect(env, 0, WALL_TOP - 2, SCENE_W, 3, '#b6bbc4');
  for (let x = 3; x < SCENE_W; x += 6)
    rect(env, x, RAIL_TOP + 3, 1, WALL_TOP - RAIL_TOP - 6, '#7f8591');
  rect(env, 0, WALL_TOP - 6, SCENE_W, 2, '#9aa0ab');
  rect(env, 0, WALL_TOP - 6, SCENE_W, 1, '#c9ced6');
  rect(env, 0, RAIL_TOP, SCENE_W, 3, '#aeb4be');
  rect(env, 0, RAIL_TOP, SCENE_W, 1, '#e6eaf0');
  rect(env, 0, RAIL_TOP + 2, SCENE_W, 1, '#6f7581');
  rect(env, 0, RAIL_TOP + 3, SCENE_W, 1, '#3d424c');
  for (let x = 0; x <= SCENE_W + POLE_GAP; x += POLE_GAP) {
    rect(env, x - 2, POLE_TOP, 4, WALL_TOP - POLE_TOP - 1, '#7d838f');
    rect(env, x - 2, POLE_TOP, 1, WALL_TOP - POLE_TOP - 1, '#c9ced6');
    rect(env, x + 1, POLE_TOP, 1, WALL_TOP - POLE_TOP - 1, '#565c68');
    rect(env, x - 3, POLE_TOP - 2, 6, 2, '#d8dce3');
    rect(env, x - 3, POLE_TOP - 2, 6, 1, '#ffffff');
    rect(env, x - 1, POLE_TOP - 4, 2, 2, '#aeb4be');
  }
}

/** Ponto da curva do fio entre dois postes (t de 0 a 1). */
function wirePoint(x0: number, t: number): { x: number; y: number } {
  const y0 = POLE_TOP - 1;
  const control = y0 + SAG * 2;
  return {
    x: x0 + t * POLE_GAP,
    y: (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * control + t * t * y0,
  };
}

/** Lâmpadas do pisca-pisca: cinco por trecho de fio, penduradas entre os postes. */
const BULBS: { x: number; y: number }[] = [];
for (let seg = 0; seg * POLE_GAP < SCENE_W; seg++) {
  for (let k = 1; k <= 5; k++) {
    const pt = wirePoint(seg * POLE_GAP, k / 6);
    BULBS.push({ x: Math.round(pt.x), y: Math.round(pt.y) });
  }
}

function stringLights(env: SceneEnv): void {
  const { ctx } = env;
  ctx.strokeStyle = '#1f1f27';
  ctx.lineWidth = 0.9;
  for (let seg = 0; seg * POLE_GAP < SCENE_W; seg++) {
    const x0 = seg * POLE_GAP;
    const y0 = POLE_TOP - 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + POLE_GAP / 2, y0 + SAG * 2, x0 + POLE_GAP, y0);
    ctx.stroke();
  }
  const lit = env.time === 'night';
  for (const b of BULBS) {
    rect(env, b.x - 1, b.y, 2, 2, '#1f1f27'); // soquete
    // lâmpada em formato de gota/cruz de pixels
    rect(env, b.x - 1, b.y + 3, 3, 2, lit ? '#ffd45e' : '#cfc9b2');
    rect(env, b.x, b.y + 2, 1, 4, lit ? '#ffd45e' : '#cfc9b2');
    rect(env, b.x, b.y + 3, 1, 2, lit ? '#fffbe6' : '#f4f0e0');
  }
}

export const rooftop: SceneDef = {
  id: 'rooftop',
  name: 'Cidade',
  blurb: 'Terraço com a cidade em perspectiva e um lago ao fundo; pisca-pisca no corrimão à noite.',
  groundY: 190,
  back(env) {
    city(env);
    // Muro, piso e corrimão baixo (deixa a vista aparecer)
    bands(env, 0, WALL_TOP, SCENE_W, 22, ['#8a8f99', '#7b808b', '#6c717c']);
    tileArea(env, env.tiles.cement, 0, 160, 0, FLOOR, SCENE_W, 70);
    rect(env, 0, FLOOR, SCENE_W, 2, 'rgba(0,0,0,0.3)');
    railing(env);
    stringLights(env);
    // Espreguiçadeira virada para o sol (manhã: à esquerda; tarde e noite: à direita)
    lounger(env, 104, 192, env.time === 'morning' ? -1 : 1);
    // Vasos grandes com plantas
    pot(env, 334, 192, 26, 24, {
      base: '#c8693a',
      light: '#e58f5a',
      dark: '#9a4a28',
      band: '#f3cf8e',
      rim: '#d9774a',
    });
    leafyPlant(env, 334, 192 - 24);
    pot(env, 368, 192, 20, 28, {
      base: '#e9dcc0',
      light: '#fff6e0',
      dark: '#bfae8a',
      band: '#2f8f93',
      rim: '#f2e6cc',
    });
    flowerPlant(env, 368, 192 - 28);
  },
  lights: (env) => {
    const out: Light[] = [
      {
        x: TOWER.x + 11,
        y: WALL_TOP + 4 - TOWER.h - 23,
        radius: 22,
        color: [255, 60, 50],
        intensity: Math.sin(env.t * 4) > 0 ? 0.6 : 0.05,
        at: ['night', 'morning', 'afternoon'],
      },
      { x: 304, y: 30, radius: 300, color: [150, 175, 255], intensity: 0.34, at: ['night'] },
      { x: 195, y: 150, radius: 230, color: [140, 165, 240], intensity: 0.3, at: ['night'] },
    ];
    BULBS.forEach((b, i) => {
      const twinkle = 0.55 + 0.45 * Math.sin(env.t * 2.2 + i * 1.7);
      out.push({
        x: b.x,
        y: b.y + 4,
        radius: 5,
        color: [255, 236, 170],
        intensity: 1.4 * twinkle,
        at: ['night'],
      });
      out.push({
        x: b.x,
        y: b.y + 4,
        radius: 17,
        color: [255, 220, 140],
        intensity: 0.6 * twinkle,
        at: ['night'],
      });
    });
    return out;
  },
  tint: {
    morning: { color: '#ffd2b0', alpha: 0.22 },
    afternoon: { color: '#fffdf0', alpha: 0.04 },
    night: { color: '#3b4fa0', alpha: 0.34 },
  },
};
