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

/** Posição do eixo x de um pixel local do objeto, espelhado conforme a direção. */
function mirrored(cx: number, dir: 1 | -1) {
  return (lx: number, w: number): number => (dir > 0 ? cx + lx : cx - lx - w);
}

/** Espreguiçadeira de perfil: encosto inclinado, almofada listrada e apoio de pés, virada para o sol. */
function lounger(env: SceneEnv, cx: number, baseY: number, dir: 1 | -1): void {
  const { ctx } = env;
  const X = mirrored(cx, dir);
  const px = (lx: number, ly: number, w: number, h: number, color: string): void =>
    rect(env, X(lx, w), baseY + ly, w, h, color);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 33, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // pernas do quadro
  px(-15, -10, 5, 10, OUT);
  px(-14, -9, 3, 9, '#efe9db');
  px(19, -10, 5, 10, OUT);
  px(20, -9, 3, 9, '#efe9db');
  // apoio dos pés
  px(20, -17, 10, 8, OUT);
  px(21, -16, 8, 6, '#2bb3ab');
  px(21, -16, 8, 1, '#5fd6cf');
  // assento
  px(-13, -14, 35, 7, OUT);
  for (let i = 0; i < 8; i++) {
    px(-12 + i * 4, -13, 4, 5, i % 2 ? '#f6f6f2' : '#2bb3ab');
  }
  px(-12, -13, 33, 1, '#7fe3dc');
  px(-12, -9, 33, 1, '#1c837e');
  // encosto inclinado
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 15; i++) {
      const lx = -13 - Math.round(i * 0.85);
      const ly = -14 - Math.round(i * 1.15);
      if (pass === 0) px(lx - 1, ly - 1, 11, 6, OUT);
      else px(lx, ly, 9, 4, i % 4 < 2 ? '#2bb3ab' : '#f6f6f2');
    }
  }
  // travesseiro
  px(-29, -35, 9, 5, OUT);
  px(-28, -34, 7, 3, '#f7e4c0');
  px(-28, -34, 7, 1, '#fff6e0');
  // mesinha ao lado com copo
  px(-50, -15, 15, 3, OUT);
  px(-49, -14, 13, 1, '#e4dfd2');
  px(-49, -13, 13, 1, '#a9a498');
  px(-44, -12, 3, 12, OUT);
  px(-43, -12, 1, 12, '#b9b4a8');
  px(-47, -24, 5, 9, OUT);
  px(-46, -23, 3, 7, 'rgba(225,242,255,0.9)');
  px(-46, -20, 3, 4, '#ffb347');
  px(-43, -27, 1, 6, '#e63946');
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

function railing(env: SceneEnv): void {
  rect(env, 0, WALL_TOP - 2, SCENE_W, 3, '#b6bbc4');
  for (let x = 6; x < SCENE_W; x += 16)
    rect(env, x, RAIL_TOP + 2, 2, WALL_TOP - RAIL_TOP - 3, '#9aa0ab');
  rect(env, 0, RAIL_TOP, SCENE_W, 2, '#c4c9d1');
  rect(env, 0, RAIL_TOP + 8, SCENE_W, 1, '#8a909b');
}

/** Pontos do pisca-pisca: uma lâmpada a cada 12 px, em cima do corrimão. */
const BULBS = Array.from({ length: 33 }, (_, i) => ({
  x: 4 + i * 12,
  y: RAIL_TOP - 4 + (i % 2 ? 2 : 0),
}));

function stringLights(env: SceneEnv): void {
  const { ctx } = env;
  ctx.strokeStyle = '#25252d';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  BULBS.forEach((b, i) => {
    if (i === 0) ctx.moveTo(b.x, b.y);
    else {
      const prev = BULBS[i - 1];
      if (prev) ctx.quadraticCurveTo((prev.x + b.x) / 2, Math.max(prev.y, b.y) + 2, b.x, b.y);
    }
  });
  ctx.stroke();
  const lit = env.time === 'night';
  for (const b of BULBS) {
    rect(env, b.x - 1, b.y, 2, 1, '#25252d');
    rect(env, b.x - 1, b.y + 1, 2, 3, lit ? '#fff0b8' : '#e7e1cc');
  }
}

export const rooftop: SceneDef = {
  id: 'rooftop',
  name: 'Topo do prédio',
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
    lounger(env, 118, 192, env.time === 'morning' ? -1 : 1);
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
      { x: 195, y: 150, radius: 150, color: [120, 140, 255], intensity: 0.16, at: ['night'] },
    ];
    BULBS.forEach((b, i) => {
      const twinkle = 0.55 + 0.45 * Math.sin(env.t * 2.2 + i * 1.7);
      out.push({
        x: b.x,
        y: b.y + 2,
        radius: 5,
        color: [255, 236, 170],
        intensity: 1.4 * twinkle,
        at: ['night'],
      });
      out.push({
        x: b.x,
        y: b.y + 2,
        radius: 16,
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
    night: { color: '#2b3a88', alpha: 0.5 },
  },
};
