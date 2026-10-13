import {
  celestial,
  gradientRect,
  portal,
  rect,
  rng,
  scrolled,
  shadedBlock,
  stars,
  tileArea,
} from './draw';
import { drawLampCones, drawLampPost, type Lamp, lampLights } from './lampposts';
import type { ExtraCharacter, Light, SceneDef, SceneEnv, TimeOfDay } from './types';
import { SCENE_H, SCENE_W } from './types';

const HORIZON = 120;
const FENCE_BASE = 160;
const FENCE_H = 28;

const OUT = '#1b1f17';

const SKY_BY_TIME: Record<TimeOfDay, string[]> = {
  morning: ['#5a6fb0', '#b98ab0', '#f0a888', '#ffd49c'],
  afternoon: ['#3c86d8', '#78b4ec', '#b8d8f4', '#f0e6c8'],
  night: ['#03061a', '#0a1236', '#18255a', '#3a3050'],
};

/** Postes nos cantos da frente da cerca, com a lâmpada virada para os zumbis de fora. */
const LAMPS: Lamp[] = [
  { x: 72, baseY: 198, h: 84, dir: -1 },
  { x: 318, baseY: 198, h: 84, dir: 1 },
];
const CROWD_X = [40, SCENE_W - 40];
const CROWD_FEET = 188;

type Panel = { ax: number; ay: number; ah: number; bx: number; by: number; bh: number };

/** Cerca em três lados (fundo e laterais) e a frente aberta para o jogador. */
const BACK: Panel = { ax: 90, ay: FENCE_BASE, ah: FENCE_H, bx: 300, by: FENCE_BASE, bh: FENCE_H };
/** As laterais seguem a borda do piso e saem pela parte de baixo da cena: o cercado fecha dos dois lados. */
const LEFT: Panel = { ax: 90, ay: FENCE_BASE, ah: FENCE_H, bx: 61, by: 222, bh: 46 };
const RIGHT: Panel = { ax: 300, ay: FENCE_BASE, ah: FENCE_H, bx: 329, by: 222, bh: 46 };

function at(p: Panel, u: number): { x: number; base: number; h: number } {
  return {
    x: p.ax + (p.bx - p.ax) * u,
    base: p.ay + (p.by - p.ay) * u,
    h: p.ah + (p.bh - p.ah) * u,
  };
}

/** Faíscas na cerca elétrica: mesma conta para o desenho e para a luz. */
function sparks(t: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const slot = Math.floor(t * 8);
  [BACK, LEFT, RIGHT].forEach((panel, i) => {
    const random = rng(slot * 7 + i * 13 + 3);
    if (random() > 0.42) return;
    const point = at(panel, 0.12 + random() * 0.8);
    out.push({ x: point.x, y: point.base - point.h - 3 });
  });
  return out;
}

/** Posição do helicóptero: cruza a cena da esquerda para a direita e recomeça. */
function heliPos(t: number): { x: number; y: number } {
  return { x: ((t * 34) % (SCENE_W + 120)) - 60, y: 46 + Math.sin(t * 1.4) * 3 };
}

const block = (
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  dark: string,
  light: string,
): void => {
  shadedBlock(env, x, y, w, h, fill, dark, light, OUT);
};

function dunes(env: SceneEnv): void {
  const { ctx } = env;
  // Montanhas distantes
  ctx.fillStyle = '#a58468';
  ctx.beginPath();
  ctx.moveTo(0, HORIZON);
  for (let x = 0; x <= SCENE_W; x += 10)
    ctx.lineTo(x, HORIZON - 7 - Math.abs(Math.sin(x * 0.045 + 1)) * 12);
  ctx.lineTo(SCENE_W, HORIZON);
  ctx.fill();
  // Dunas em duas camadas
  for (const [base, amp, phase, color] of [
    [HORIZON + 1, 4, 0.5, '#c99a66'],
    [HORIZON + 8, 5, 2.2, '#d6aa70'],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    for (let x = 0; x <= SCENE_W; x += 6)
      ctx.lineTo(x, base + Math.sin(x * 0.021 + phase) * amp + Math.sin(x * 0.07) * 1.2);
    ctx.lineTo(SCENE_W, 140);
    ctx.fill();
  }
}

function cactus(env: SceneEnv, x: number, base: number): void {
  const body = '#4f7a3a';
  rect(env, x - 1, base - 20, 6, 21, OUT);
  rect(env, x, base - 19, 4, 19, body);
  rect(env, x, base - 19, 1, 19, '#7fae5c');
  rect(env, x - 5, base - 13, 6, 5, OUT);
  rect(env, x - 4, base - 12, 4, 3, body);
  rect(env, x - 5, base - 17, 3, 6, OUT);
  rect(env, x - 4, base - 16, 1, 5, body);
}

function hangar(env: SceneEnv, cx: number, base: number): void {
  const rx = 38;
  const ry = 24;
  const top = base - 38;
  const arcY = top + ry;
  for (let y = top; y < base; y++) {
    const half =
      y < arcY ? Math.round(rx * Math.sqrt(1 - ((arcY - y) / ry) * ((arcY - y) / ry))) : rx;
    if (half <= 0) continue;
    rect(env, cx - half, y, half * 2, 1, y - top < 3 ? '#8d9a68' : '#6b7a4a');
    rect(env, cx - half - 1, y, 1, 1, OUT);
    rect(env, cx + half, y, 1, 1, OUT);
    rect(env, cx + half - 3, y, 3, 1, '#566339');
    for (let k = -rx; k <= rx; k += 8)
      if (Math.abs(k) < half - 1) rect(env, cx + k, y, 1, 1, '#566339');
  }
  rect(env, cx - rx - 1, base - 1, rx * 2 + 2, 1, OUT);
  // portão
  block(env, cx - 11, base - 20, 22, 20, '#2c3326', '#1b1f17', '#4a5340');
  rect(env, cx, base - 20, 1, 20, OUT);
}

function radar(env: SceneEnv, x: number, base: number): void {
  const { ctx } = env;
  block(env, x - 1, base - 20, 3, 20, '#6e757c', '#4a5056', '#9aa1a8');
  const rx = 2 + 11 * Math.abs(Math.cos(env.t * 0.7));
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.ellipse(x, base - 26, rx + 1, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9ced3';
  ctx.beginPath();
  ctx.ellipse(x, base - 26, rx, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d949b';
  ctx.beginPath();
  ctx.ellipse(x + 1, base - 25, Math.max(1, rx - 3), 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  rect(env, x, base - 34, 1, 7, OUT);
  rect(env, x - 1, base - 35, 3, 2, '#d34a3a');
}

function tower(env: SceneEnv, x: number, base: number): void {
  const night = env.time === 'night';
  // pernas e travessas
  for (const dx of [-8, 6]) {
    rect(env, x + dx - 1, base - 40, 4, 40, OUT);
    rect(env, x + dx, base - 40, 2, 40, '#5a6048');
  }
  for (let k = 0; k < 3; k++) rect(env, x - 8, base - 12 - k * 13, 16, 2, '#4a5038');
  // cabine
  block(env, x - 11, base - 54, 24, 14, '#58634a', '#3e4733', '#7c886a');
  rect(env, x - 8, base - 51, 18, 5, night ? '#ffd980' : '#bfe0e8');
  rect(env, x + 1, base - 51, 1, 5, OUT);
  // telhado e antena
  rect(env, x - 13, base - 57, 28, 3, OUT);
  rect(env, x - 12, base - 56, 26, 1, '#7d8a62');
  rect(env, x + 1, base - 66, 1, 9, OUT);
  rect(env, x, base - 67, 3, 2, Math.sin(env.t * 4) > 0 ? '#ff4a3a' : '#7a2a24');
  // refletor que varre a base à noite
  if (night) {
    const { ctx } = env;
    const angle = 1.25 + Math.sin(env.t * 0.6) * 0.55;
    const sx = x - 11;
    const sy = base - 48;
    const reach = 110;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = ctx.createLinearGradient(
      sx,
      sy,
      sx + Math.cos(angle) * reach,
      sy + Math.sin(angle) * reach,
    );
    beam.addColorStop(0, 'rgba(255,240,190,0.5)');
    beam.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle - 0.12) * reach, sy + Math.sin(angle - 0.12) * reach);
    ctx.lineTo(sx + Math.cos(angle + 0.12) * reach, sy + Math.sin(angle + 0.12) * reach);
    ctx.fill();
    ctx.restore();
  }
}

function flag(env: SceneEnv, x: number, base: number): void {
  rect(env, x - 1, base - 42, 3, 42, OUT);
  rect(env, x, base - 41, 1, 41, '#a8aeb4');
  for (let i = 0; i < 16; i++) {
    const wave = Math.round(Math.sin(env.t * 4 + i * 0.5) * 1.5);
    rect(env, x + 2 + i, base - 40 + wave, 1, 9, OUT);
    rect(env, x + 2 + i, base - 39 + wave, 1, 7, i % 5 === 4 ? '#8a2420' : '#b5322e');
  }
}

function crate(env: SceneEnv, x: number, base: number, size: number): void {
  block(env, x, base - size, size, size, '#8a6a3a', '#5e4524', '#b08a52');
  rect(env, x + 1, base - size + 1, size - 2, 1, '#b08a52');
  // tampa em X
  for (let i = 2; i < size - 2; i++) {
    rect(env, x + i, base - size + i, 1, 1, '#5e4524');
    rect(env, x + size - 1 - i, base - size + i, 1, 1, '#5e4524');
  }
}

function barrel(env: SceneEnv, x: number, base: number, color: string): void {
  block(env, x, base - 14, 10, 14, color, '#1d2b17', '#6c8a52');
  rect(env, x, base - 10, 10, 1, OUT);
  rect(env, x, base - 5, 10, 1, OUT);
}

function sandbags(env: SceneEnv, x: number, base: number, cols: number, rows: number): void {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols - (r % 2); c++) {
      const bx = x + c * 13 + (r % 2) * 6;
      const by = base - (r + 1) * 7;
      block(env, bx, by, 13, 8, '#bda775', '#8d7a4e', '#d6c394');
    }
}

function sign(env: SceneEnv, x: number, y: number): void {
  rect(env, x, y + 6, 1, 8, OUT);
  rect(env, x - 4, y - 1, 9, 8, OUT);
  rect(env, x - 3, y, 7, 6, '#f2c230');
  // raio
  rect(env, x, y + 1, 2, 1, OUT);
  rect(env, x - 1, y + 2, 2, 1, OUT);
  rect(env, x, y + 3, 2, 1, OUT);
  rect(env, x - 1, y + 4, 1, 1, OUT);
}

/** Painel de tela de arame com postes, fios elétricos e isoladores. */
function fence(env: SceneEnv, p: Panel, postEvery: number): void {
  const { ctx } = env;
  const tl = { x: p.ax, y: p.ay - p.ah };
  const tr = { x: p.bx, y: p.by - p.bh };
  const length = Math.hypot(p.bx - p.ax, p.by - p.ay);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(p.bx, p.by);
  ctx.lineTo(p.ax, p.ay);
  ctx.closePath();
  ctx.fillStyle = 'rgba(170,185,195,0.14)';
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(210,220,228,0.55)';
  ctx.lineWidth = 0.6;
  const d = 5 / length;
  for (let u = -d; u <= 1; u += d * 0.9) {
    const top = at(p, u);
    const top2 = at(p, u + d);
    ctx.beginPath();
    ctx.moveTo(top.x, top.base - top.h);
    ctx.lineTo(top2.x, top2.base);
    ctx.moveTo(top2.x, top2.base - top2.h);
    ctx.lineTo(top.x, top.base);
    ctx.stroke();
  }
  ctx.restore();

  // trilho de cima e de baixo
  ctx.strokeStyle = '#4b535b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.moveTo(p.ax, p.ay);
  ctx.lineTo(p.bx, p.by);
  ctx.stroke();

  // postes, isoladores e dois fios elétricos acima da tela
  const count = Math.max(1, Math.round(length / postEvery));
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const post = at(p, u);
    const top = post.base - post.h;
    rect(env, post.x - 1, top - 8, 3, post.h + 8, OUT);
    rect(env, post.x - 1, top - 7, 2, post.h + 7, '#6a727a');
    rect(env, post.x, top - 7, 1, post.h + 7, '#a0a8b0');
    rect(env, post.x - 2, top - 4, 1, 1, '#f2c230');
    rect(env, post.x - 2, top - 7, 1, 1, '#f2c230');
  }
  ctx.lineWidth = 0.7;
  for (const lift of [4, 7]) {
    ctx.strokeStyle = '#c9d0d6';
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y - lift);
    ctx.lineTo(tr.x, tr.y - lift);
    ctx.stroke();
  }
}

function heliBody(env: SceneEnv, x: number, y: number): void {
  const { ctx } = env;
  const rotor = 27 * Math.abs(Math.cos(env.t * 26));

  // cauda
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 5);
  ctx.lineTo(x - 36, y - 4);
  ctx.lineTo(x - 36, y - 0.5);
  ctx.lineTo(x - 8, y + 3);
  ctx.fill();
  ctx.fillStyle = '#5b6a40';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 4);
  ctx.lineTo(x - 35, y - 3.2);
  ctx.lineTo(x - 35, y - 1);
  ctx.lineTo(x - 8, y + 2);
  ctx.fill();
  // estabilizador e rotor de cauda
  rect(env, x - 38, y - 9, 3, 8, OUT);
  rect(env, x - 37, y - 8, 1, 6, '#5b6a40');
  const tail = 6 * Math.abs(Math.cos(env.t * 34));
  rect(env, x - 41, y - 5 - tail, 1, tail * 2, 'rgba(220,225,230,0.8)');

  // patins
  rect(env, x - 11, y + 9, 24, 2, OUT);
  rect(env, x - 10, y + 9, 22, 1, '#7a8290');
  rect(env, x - 6, y + 5, 2, 5, OUT);
  rect(env, x + 5, y + 5, 2, 5, OUT);

  // fuselagem
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#66774a';
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4b5a35';
  ctx.beginPath();
  ctx.ellipse(x - 1, y + 3, 12, 4, 0, 0, Math.PI);
  ctx.fill();
  // cabine
  ctx.fillStyle = '#9fd3e6';
  ctx.beginPath();
  ctx.ellipse(x + 6, y - 1, 6.5, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(Math.round(x + 3), Math.round(y - 4), 3, 1);
  rect(env, x - 3, y - 5, 1, 9, 'rgba(0,0,0,0.35)');
  // marca na lateral
  rect(env, x - 9, y - 1, 4, 2, '#e6e2c8');

  // mastro e rotor principal
  rect(env, x - 1, y - 11, 3, 4, OUT);
  rect(env, x - 28, y - 12, 56, 2, 'rgba(210,215,220,0.22)');
  rect(env, x - rotor, y - 12, rotor * 2, 1, '#1b1f17');
  rect(env, x - 1, y - 12, 3, 1, '#8d949b');

  // luz de navegação
  if (env.time === 'night' && Math.sin(env.t * 6) > 0) rect(env, x - 37, y - 8, 2, 2, '#ff3a3a');
}

function helicopter(env: SceneEnv): void {
  const { ctx } = env;
  const { x, y } = heliPos(env.t);
  // sombra no chão
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, 199, 17, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // holofote à noite
  if (env.time === 'night') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const tx = x + 28;
    const beam = ctx.createLinearGradient(x + 7, y + 9, tx, 197);
    beam.addColorStop(0, 'rgba(255,248,210,0.55)');
    beam.addColorStop(1, 'rgba(255,248,210,0.12)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 9);
    ctx.lineTo(x + 8, y + 10);
    ctx.lineTo(tx + 14, 197);
    ctx.lineTo(tx - 14, 197);
    ctx.fill();
    ctx.restore();
  }
  heliBody(env, x, y);
}

type Crowd = { x: number; feet: number; sel: Partial<ExtraCharacter['selection']> };

const CLOTH = [
  ['torso-tshirt', 'gray', 'legs-pants', 'charcoal'],
  ['torso-longsleeve-2', 'maroon', 'legs-pants', 'navy'],
  ['torso-sleeveless-2', 'tan', 'legs-shorts', 'brown'],
  ['torso-tshirt', 'forest', 'legs-pants', 'black'],
  ['torso-cardigan', 'slate', 'legs-pants', 'charcoal'],
] as const;

const HAIRS = [null, 'hair-buzzcut', 'hair-natural', null, 'hair-curly-short', 'hair-bob'] as const;

/** 5 zumbis de cada lado, em fila irregular encostados na tela. */
function crowd(side: 'left' | 'right'): ExtraCharacter[] {
  const spots: [number, number][] = [
    [62, 174],
    [10, 178],
    [34, 186],
    [52, 196],
    [20, 204],
  ];
  const list: Crowd[] = spots.map(([x, feet], i) => {
    const [torso, torsoColor, legs, legsColor] =
      CLOTH[(i + (side === 'left' ? 0 : 2)) % CLOTH.length] ?? CLOTH[0];
    const hair = HAIRS[(i * 2 + (side === 'left' ? 1 : 4)) % HAIRS.length] ?? null;
    return {
      x: side === 'left' ? x : SCENE_W - x,
      feet,
      sel: {
        bodyType: (i + (side === 'left' ? 0 : 1)) % 3 === 0 ? 'female' : 'male',
        skin: i % 2 ? 'zombie' : 'zombie_green',
        hair,
        hairColor: i % 2 ? 'dark_gray' : 'dark_brown',
        torso,
        torsoColor,
        legs,
        legsColor,
        feet: null,
      },
    };
  });
  // quem está mais ao fundo (pés mais altos) é desenhado primeiro
  return list
    .sort((a, b) => a.feet - b.feet)
    .map((z) => ({
      x: z.x,
      feetY: z.feet,
      anim: 'idle',
      direction: side === 'left' ? 'right' : 'left',
      selection: z.sel,
    }));
}

/** Rodada em que a base se repete (distância percorrida pela calçada de areia). */
const JOURNEY_PERIOD = 820;
const BASE_PERIOD = 1100;
/** O fundo anda mais devagar que o chão: a base passa em segundo plano. */
const BASE_FACTOR = 0.45;
const MOUNTAIN_FACTOR = 0.04;
const MOUNTAIN_PERIOD = 520;
const BASE_LINE = 146;
const FENCE_LINE = 154;
const FENCE_TOP_H = 24;
const BASE_START = -20;
const BASE_END = 590;
const BASE_WIDTH = BASE_END - BASE_START + 40;

/** Montanhas: algumas arredondadas, outras bem pontudas, repetindo devagar. */
const PEAKS: { x: number; h: number; w: number; sharp: boolean }[] = [
  { x: 40, h: 14, w: 60, sharp: false },
  { x: 130, h: 34, w: 46, sharp: true },
  { x: 215, h: 15, w: 62, sharp: false },
  { x: 300, h: 26, w: 40, sharp: true },
  { x: 372, h: 12, w: 54, sharp: false },
  { x: 450, h: 38, w: 38, sharp: true },
];

function mountainHeight(x: number): { h: number; shade: boolean } {
  let best = 0;
  let shade = false;
  for (const peak of PEAKS) {
    let dx =
      ((((x - peak.x + MOUNTAIN_PERIOD / 2) % MOUNTAIN_PERIOD) + MOUNTAIN_PERIOD) %
        MOUNTAIN_PERIOD) -
      MOUNTAIN_PERIOD / 2;
    const side = dx > 0;
    dx = Math.abs(dx);
    if (dx >= peak.w) continue;
    const t = 1 - dx / peak.w;
    const h = peak.sharp ? peak.h * t : peak.h * Math.sin((t * Math.PI) / 2);
    if (h > best) {
      best = h;
      shade = side && peak.sharp;
    }
  }
  return { h: best + 5, shade };
}

function journeyMountains(env: SceneEnv): void {
  const shift = env.scroll * MOUNTAIN_FACTOR;
  for (let x = 0; x < SCENE_W; x += 2) {
    const { h, shade } = mountainHeight(x + shift);
    rect(env, x, HORIZON - h, 2, h + 1, shade ? '#8c6e56' : '#a58468');
    if (!shade && h > 20) rect(env, x, HORIZON - h, 2, 1, '#cfb496');
  }
}

function journeyDunes(env: SceneEnv): void {
  const { ctx } = env;
  for (const [base, amp, phase, color, factor] of [
    [HORIZON + 1, 4, 0.5, '#c99a66', 0.12],
    [HORIZON + 8, 5, 2.2, '#d6aa70', 0.2],
  ] as const) {
    const shift = env.scroll * factor;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    for (let x = 0; x <= SCENE_W; x += 6) {
      const wx = x + shift;
      ctx.lineTo(x, base + Math.sin(wx * 0.021 + phase) * amp + Math.sin(wx * 0.07) * 1.2);
    }
    ctx.lineTo(SCENE_W, 140);
    ctx.fill();
  }
}

type Walker = { x: number; feet: number; variant: number };

/** Zumbis parados encostados na cerca, em grupos de tamanhos diferentes. */
const WALKERS: Walker[] = (() => {
  const random = rng(5);
  const centers: [number, number][] = [
    [40, 3],
    [150, 2],
    [285, 4],
    [415, 3],
    [535, 2],
  ];
  const out: Walker[] = [];
  for (const [cx, count] of centers) {
    for (let i = 0; i < count; i++) {
      out.push({
        x: cx + (i - count / 2) * 11 + random() * 6,
        feet: FENCE_LINE + 4 + Math.floor(random() * 10),
        variant: Math.floor(random() * 4),
      });
    }
  }
  return out;
})();
const SHIRTS = ['#6b4a3a', '#3f5a7a', '#7a7a3a', '#5a3f6e'];
const PANTS = ['#2f3440', '#4a3a2a', '#26323a', '#3a3a3a'];
const SKINS = ['#7fa05a', '#8fb56a', '#6f9467', '#9bb27a'];

/** Zumbi pequeno visto de costas, de braços erguidos para a cerca; balança de leve. */
function miniZombie(env: SceneEnv, z: Walker, index: number): void {
  const sway = Math.round(Math.sin(env.t * 1.6 + index * 1.9));
  const x = Math.round(z.x) + sway;
  const y = z.feet;
  const skin = SKINS[z.variant] ?? '#7fa05a';
  rect(env, x - 3, y - 17, 7, 18, OUT);
  rect(env, x - 2, y - 5, 2, 5, PANTS[z.variant] ?? '#2f3440');
  rect(env, x + 1, y - 5, 2, 5, PANTS[z.variant] ?? '#2f3440');
  rect(env, x - 2, y - 11, 5, 6, SHIRTS[z.variant] ?? '#6b4a3a');
  const lift = Math.round(Math.sin(env.t * 3 + index) * 1);
  rect(env, x - 4, y - 16 + lift, 1, 6, skin);
  rect(env, x + 3, y - 16 - lift, 1, 6, skin);
  rect(env, x - 1, y - 16, 3, 4, skin);
  rect(env, x - 1, y - 16, 3, 1, '#4a3a2a');
}

function journeyFence(env: SceneEnv, dx: number): void {
  fence(
    env,
    {
      ax: dx + BASE_START,
      ay: FENCE_LINE,
      ah: FENCE_TOP_H,
      bx: dx + BASE_END,
      by: FENCE_LINE,
      bh: FENCE_TOP_H,
    },
    42,
  );
}

/** Faíscas na cerca visível: a mesma conta alimenta o desenho e a luz. */
function journeySparks(env: SceneEnv): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const slot = Math.floor(env.t * 8);
  for (const { dx } of baseSegments(env)) {
    const random = rng(slot * 7 + 3);
    if (random() > 0.5) continue;
    const x = dx + BASE_START + 20 + random() * (BASE_END - BASE_START - 40);
    if (x > 0 && x < SCENE_W) out.push({ x, y: FENCE_LINE - FENCE_TOP_H + 4 });
  }
  return out;
}

function baseSegments(env: SceneEnv): { dx: number; k: number }[] {
  const shift = env.scroll * BASE_FACTOR;
  const first = Math.floor((shift - BASE_WIDTH) / BASE_PERIOD);
  const out: { dx: number; k: number }[] = [];
  for (let k = first; k <= first + 3; k++) {
    const dx = k * BASE_PERIOD - shift;
    if (dx + BASE_START < SCENE_W + 40 && dx + BASE_END > -40) out.push({ dx, k });
  }
  return out;
}

/** Posição (tela) dos pontos de luz da base: lâmpada do hangar e refletor da torre. */
function baseLights(env: SceneEnv): Light[] {
  const out: Light[] = [];
  for (const { dx } of baseSegments(env)) {
    out.push({ x: dx + 90, y: 118, radius: 40, color: [255, 220, 150], intensity: 0.5 });
    out.push({ x: dx + 262, y: 92, radius: 30, color: [255, 220, 140], intensity: 0.6 });
    out.push({ x: dx + 400, y: 118, radius: 40, color: [255, 220, 150], intensity: 0.5 });
  }
  return out;
}

/** Jornada: deserto com a base militar passando ao fundo e o personagem sozinho na estrada de areia. */
function journey(env: SceneEnv): void {
  gradientRect(env, 0, 0, SCENE_W, HORIZON + 16, SKY_BY_TIME[env.time]);
  stars(env, 0, 0, SCENE_W, 90, 11, 50);
  celestial(env, 0, 0, SCENE_W, HORIZON);
  journeyMountains(env);
  journeyDunes(env);
  gradientRect(env, 0, HORIZON + 8, SCENE_W, SCENE_H - HORIZON - 8, [
    '#d6aa70',
    '#cda068',
    '#c08f5a',
  ]);
  const random = rng(23);
  for (let i = 0; i < 70; i++) {
    const dark = random() > 0.5;
    rect(
      env,
      scrolled(random() * JOURNEY_PERIOD, env.scroll, JOURNEY_PERIOD),
      132 + random() * 88,
      2 + random() * 3,
      1,
      dark ? 'rgba(120,80,40,0.22)' : 'rgba(255,230,170,0.22)',
    );
  }
  for (const { dx } of baseSegments(env)) {
    rect(
      env,
      dx + BASE_START,
      BASE_LINE,
      BASE_END - BASE_START,
      FENCE_LINE - BASE_LINE + 1,
      '#8f9088',
    );
    rect(env, dx + BASE_START, BASE_LINE, BASE_END - BASE_START, 1, 'rgba(0,0,0,0.25)');
    hangar(env, dx + 90, BASE_LINE);
    radar(env, dx + 190, BASE_LINE);
    flag(env, dx + 214, BASE_LINE);
    tower(env, dx + 262, BASE_LINE + 2);
    hangar(env, dx + 400, BASE_LINE);
    crate(env, dx + 330, BASE_LINE + 6, 11);
    crate(env, dx + 343, BASE_LINE + 6, 9);
    barrel(env, dx + 322, BASE_LINE + 8, '#3f5a2e');
    sandbags(env, dx + 470, BASE_LINE + 8, 3, 2);
    journeyFence(env, dx);
    sign(env, dx + 30, FENCE_LINE - 30);
    sign(env, dx + 300, FENCE_LINE - 30);
    sign(env, dx + 560, FENCE_LINE - 30);
    WALKERS.forEach((walker, i) => {
      miniZombie(env, { ...walker, x: dx + walker.x }, i);
    });
  }
  // Zumbis soltos no deserto, longe da base
  for (const { dx } of baseSegments(env)) {
    miniZombie(env, { x: dx + 780, feet: 158, variant: 1 }, 40);
    miniZombie(env, { x: dx + 960, feet: 164, variant: 3 }, 41);
  }
  const at = (world: number): number => scrolled(world, env.scroll, JOURNEY_PERIOD);
  cactus(env, at(70), 172);
  cactus(env, at(430), 168);
  sandbags(env, at(250), 178, 2, 2);
  barrel(env, at(560), 176, '#6b7a4a');
  cactus(env, at(700), 174);
  // faíscas na cerca
  const { ctx } = env;
  ctx.save();
  for (const s of journeySparks(env)) {
    ctx.strokeStyle = 'rgba(150,225,255,0.95)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x - 4, s.y + 2);
    ctx.lineTo(s.x - 1, s.y - 2);
    ctx.lineTo(s.x + 1, s.y + 2);
    ctx.lineTo(s.x + 4, s.y - 2);
    ctx.stroke();
    rect(env, s.x - 1, s.y, 2, 1, '#ffffff');
  }
  ctx.restore();
  helicopter(env);
  if (env.arrivedFor !== null) portal(env, env.arrivedFor, 170);
}

export const zombie: SceneDef = {
  id: 'zombie',
  name: 'Apocalipse zumbi',
  blurb: 'Base militar no deserto, cerca elétrica, zumbis nas bordas e um helicóptero em ronda.',
  groundY: 182,
  journey,
  back(env) {
    const { ctx } = env;
    // céu
    gradientRect(env, 0, 0, SCENE_W, HORIZON + 16, SKY_BY_TIME[env.time]);
    stars(env, 0, 0, SCENE_W, 90, 11, 50);
    celestial(env, 0, 0, SCENE_W, HORIZON);
    dunes(env);

    // chão de areia
    gradientRect(env, 0, HORIZON + 8, SCENE_W, SCENE_H - HORIZON - 8, [
      '#d6aa70',
      '#cda068',
      '#c08f5a',
    ]);
    const random = rng(23);
    for (let i = 0; i < 90; i++) {
      const dark = random() > 0.5;
      rect(
        env,
        random() * SCENE_W,
        132 + random() * 88,
        2 + random() * 3,
        1,
        dark ? 'rgba(120,80,40,0.22)' : 'rgba(255,230,170,0.22)',
      );
    }
    cactus(env, 22, 154);
    cactus(env, 357, 150);

    // construções ao fundo (atrás da cerca)
    hangar(env, 140, FENCE_BASE - 6);
    radar(env, 224, FENCE_BASE - 6);
    flag(env, 246, FENCE_BASE - 6);
    tower(env, 280, FENCE_BASE - 4);

    // piso de concreto da base (trapézio dentro da cerca)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(BACK.ax, FENCE_BASE);
    ctx.lineTo(BACK.bx, FENCE_BASE);
    ctx.lineTo(329, SCENE_H);
    ctx.lineTo(61, SCENE_H);
    ctx.closePath();
    ctx.clip();
    tileArea(env, env.tiles.cement, 0, 160, 60, FENCE_BASE, 272, 62);
    rect(env, 60, FENCE_BASE, 272, 62, 'rgba(190,150,100,0.14)');
    ctx.restore();
    // faixa de segurança amarela
    ctx.strokeStyle = 'rgba(242,194,48,0.85)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(BACK.ax + 2, FENCE_BASE + 2);
    ctx.lineTo(BACK.bx - 2, FENCE_BASE + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // cerca dos fundos
    fence(env, BACK, 42);

    // suprimentos dentro da base
    crate(env, 104, 192, 14);
    crate(env, 118, 192, 12);
    crate(env, 108, 178, 12);
    barrel(env, 130, 194, '#3f5a2e');
    sandbags(env, 262, 198, 3, 3);
    barrel(env, 304 - 4, 190, '#6b7a4a');
  },
  front(env) {
    // cercas laterais por cima dos zumbis e placas de perigo
    fence(env, LEFT, 38);
    fence(env, RIGHT, 38);
    // postes dos cantos: a luz cai sobre os zumbis de fora
    LAMPS.forEach((lamp, i) => {
      drawLampPost(env, lamp);
      drawLampCones(env, [lamp], CROWD_X[i] ?? 0, CROWD_FEET);
    });
    sign(env, 100, 140);
    sign(env, 290, 140);
    for (const panel of [LEFT, RIGHT]) {
      const point = at(panel, 0.28);
      sign(env, point.x, point.base - point.h - 12);
    }

    // faíscas
    const { ctx } = env;
    ctx.save();
    for (const s of sparks(env.t)) {
      ctx.strokeStyle = 'rgba(150,225,255,0.95)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 4, s.y + 2);
      ctx.lineTo(s.x - 1, s.y - 2);
      ctx.lineTo(s.x + 1, s.y + 2);
      ctx.lineTo(s.x + 4, s.y - 2);
      ctx.stroke();
      rect(env, s.x - 1, s.y, 2, 1, '#ffffff');
    }
    ctx.restore();

    helicopter(env);
  },
  lights(env): Light[] {
    if (env.journey) {
      const heli = heliPos(env.t);
      return [
        ...journeySparks(env).map((s) => ({
          x: s.x,
          y: s.y,
          radius: 22,
          color: [120, 200, 255] as [number, number, number],
          intensity: 0.7,
          at: ['morning', 'afternoon', 'night'] as TimeOfDay[],
        })),
        ...baseLights(env),
        { x: 304, y: 34, radius: 320, color: [160, 175, 255], intensity: 0.34 },
        { x: 195, y: 150, radius: 240, color: [150, 165, 240], intensity: 0.28 },
        { x: heli.x + 28, y: 196, radius: 38, color: [255, 245, 210], intensity: 0.6 },
      ];
    }
    const lights: Light[] = sparks(env.t).map((s) => ({
      x: s.x,
      y: s.y,
      radius: 22,
      color: [120, 200, 255],
      intensity: 0.7,
      at: ['morning', 'afternoon', 'night'],
    }));
    const heli = heliPos(env.t);
    return [
      ...lights,
      ...LAMPS.flatMap((lamp, i) => lampLights([lamp], CROWD_X[i] ?? 0, CROWD_FEET)),
      // luar sobre toda a base
      { x: 304, y: 34, radius: 320, color: [160, 175, 255], intensity: 0.34 },
      { x: 195, y: 150, radius: 240, color: [150, 165, 240], intensity: 0.28 },
      // holofotes nos postes dos cantos e lâmpada do hangar
      { x: 90, y: 130, radius: 55, color: [255, 235, 170], intensity: 0.5 },
      { x: 300, y: 130, radius: 55, color: [255, 235, 170], intensity: 0.5 },
      { x: 140, y: 140, radius: 28, color: [255, 220, 150], intensity: 0.5 },
      { x: 268, y: 106, radius: 24, color: [255, 220, 140], intensity: 0.6 },
      // luz do helicóptero no chão
      { x: heli.x + 28, y: 196, radius: 38, color: [255, 245, 210], intensity: 0.6 },
    ];
  },
  extras: [...crowd('left'), ...crowd('right')],
  tint: {
    morning: { color: '#ffc89a', alpha: 0.2 },
    afternoon: { color: '#fff0c0', alpha: 0.1 },
    night: { color: '#3a4f95', alpha: 0.4 },
  },
};
