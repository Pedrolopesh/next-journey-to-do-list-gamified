import { byTime, flame, glow, gradientRect, portal, rect, rng, scrolled, tileArea } from './draw';
import {
  HELL_GROUND,
  HELL_LEVEL_COUNT,
  HELL_LEVELS,
  hellExtras,
  hellJourneyExtras,
  hellLevelLayers,
  hellSky,
} from './hell-levels';
import type { Light, SceneDef, SceneEnv, TimeOfDay } from './types';
import { SCENE_H, SCENE_W } from './types';

const HORIZON = 126;
const OUT = '#120406';

const SKY_BY_TIME = {
  morning: ['#3a0c10', '#58121a', '#7d1c1c', '#a52c1c', '#cf4a1c', '#e8702a'],
  afternoon: ['#5a0e0e', '#8a1a12', '#b52a12', '#dd4414', '#f26a1c', '#ff9a3c'],
  night: ['#0a0305', '#14060a', '#200a0c', '#2e0f0d', '#44160e', '#5c1d0f'],
} as const;

const by = <T>(time: TimeOfDay, day: T, night: T): T => byTime(time, day, day, night);

const BRAZIERS = [124, 266] as const;
const BRAZIER_BASE = 162;
const CX = SCENE_W / 2;
const DAIS_TOP = 146;
/** Rio de lava que corre atrás do trono, de ponta a ponta. */
const LAKE = { x0: -10, top: HORIZON, bottom: 158 };
const GEYSERS = [
  { x: 58, phase: 0 },
  { x: 338, phase: 2.6 },
] as const;
const GEYSER_BASE = 148;
const VOLCANO = { x: 112, peak: 62 };

/** Altura atual do gêiser (0 quando está quieto). */
function geyserHeight(t: number, phase: number): number {
  const a = ((t + phase) % 6) / 6;
  return a < 0.35 ? Math.sin((a / 0.35) * Math.PI) * 44 : 0;
}

function embers(env: SceneEnv): void {
  const random = rng(77);
  for (let i = 0; i < 46; i++) {
    const baseX = random() * SCENE_W;
    const speed = 8 + random() * 14;
    const y = SCENE_H - ((env.t * speed + random() * SCENE_H) % SCENE_H);
    const x = baseX + Math.sin(env.t + i) * 6;
    rect(env, x, y, 2, 2, i % 3 ? '#ff8a2a' : '#ffd24a');
  }
}

/** Faixas de fumaça escura que derivam pelo céu. */
function smokeBanks(env: SceneEnv): void {
  const { ctx } = env;
  const color = by(env.time, '40,10,12', '12,4,6');
  for (let i = 0; i < 4; i++) {
    const x = ((env.t * (3 + i) + i * 110) % (SCENE_W + 220)) - 110;
    const y = 18 + i * 20;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
    gradient.addColorStop(0, `rgba(${color},0.5)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.28);
    ctx.translate(-x, -y);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 80, y - 80, 160, 160);
    ctx.restore();
  }
}

function mountainLayer(
  env: SceneEnv,
  seed: number,
  base: number,
  minH: number,
  span: number,
  color: string,
  rim: string,
): void {
  const { ctx } = env;
  const random = rng(seed);
  for (let x = -20; x < SCENE_W + 30; x += 34) {
    const h = minH + random() * span;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 8, base);
    ctx.lineTo(x + 6, base - h * 0.62);
    ctx.lineTo(x + 12, base - h * 0.7);
    ctx.lineTo(x + 18, base - h);
    ctx.lineTo(x + 25, base - h * 0.55);
    ctx.lineTo(x + 31, base - h * 0.6);
    ctx.lineTo(x + 46, base);
    ctx.fill();
    // brilho de lava na aresta que olha para o rio
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 18, base - h);
    ctx.lineTo(x + 25, base - h * 0.55);
    ctx.stroke();
  }
}

function volcano(env: SceneEnv, x: number = VOLCANO.x): void {
  const { ctx } = env;
  const { peak } = VOLCANO;
  const body = by(env.time, '#2a0a0c', '#150507');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - 70, HORIZON);
  ctx.lineTo(x - 14, peak + 4);
  ctx.lineTo(x - 8, peak);
  ctx.lineTo(x + 8, peak);
  ctx.lineTo(x + 14, peak + 4);
  ctx.lineTo(x + 70, HORIZON);
  ctx.fill();
  // lava escorrendo pelas encostas
  ctx.strokeStyle = '#ff7a1a';
  ctx.lineWidth = 1.4;
  for (const [dx, len] of [
    [-6, 38],
    [2, 52],
    [8, 30],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + dx, peak + 2);
    ctx.lineTo(x + dx * 3 + (dx < 0 ? -4 : 4), peak + len);
    ctx.stroke();
  }
  // cratera incandescente
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(x - 8, peak - 1, 16, 3);
  glow(env, x, peak, 60, [255, 120, 40], 0.7);
  // coluna de fumaça e cinzas
  for (let i = 0; i < 7; i++) {
    const age = (env.t * 0.18 + i / 7) % 1;
    const sx = x + age * 46 + Math.sin(env.t + i) * 3;
    const sy = peak - age * 52;
    ctx.fillStyle = `rgba(${by(env.time, '50,18,16', '20,8,10')},${(0.75 * (1 - age)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 5 + age * 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lavaLake(
  env: SceneEnv,
  shift = 0,
  geyserXs: readonly number[] = GEYSERS.map((g) => g.x),
): void {
  const { ctx } = env;
  // margem inferior ondulada, de ponta a ponta
  const shore: [number, number][] = [[LAKE.x0, LAKE.top]];
  for (let x = LAKE.x0; x <= SCENE_W + 10; x += 20)
    shore.push([x, LAKE.bottom + Math.round(Math.sin((x + shift) / 37) * 2)]);
  shore.push([SCENE_W + 10, LAKE.top]);
  const path = (): void => {
    ctx.beginPath();
    shore.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
  };
  // margem de rocha escura com brilho
  path();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = '#ff9a3c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  path();
  ctx.clip();
  const w = SCENE_W - LAKE.x0 + 10;
  tileArea(
    env,
    env.tiles.lava,
    0,
    160,
    LAKE.x0 - 10,
    LAKE.top,
    w,
    LAKE.bottom - LAKE.top + 4,
    env.t * 10 + shift,
  );
  gradientRect(env, LAKE.x0 - 10, LAKE.top, w, LAKE.bottom - LAKE.top + 4, [
    'rgba(120,20,6,0.45)',
    'rgba(255,220,120,0.18)',
  ]);
  // reflexo do sol/lua sobre a lava
  const rx = 300;
  for (let i = 0; i < 6; i++) {
    const wobble = Math.round(Math.sin(env.t * 2 + i) * 3);
    rect(
      env,
      rx - 8 + wobble + i,
      LAKE.top + 2 + i * 5,
      16 - i * 2,
      2,
      by(env.time, '#fff0b0', '#ff6a4a'),
    );
  }
  // bolhas que crescem e estouram
  const random = rng(12);
  for (let i = 0; i < 11; i++) {
    const x = LAKE.x0 + 14 + random() * (SCENE_W - LAKE.x0 - 24);
    const y = LAKE.top + 4 + random() * (LAKE.bottom - LAKE.top - 8);
    const phase = (env.t * 0.6 + random() * 3) % 1;
    ctx.strokeStyle = phase > 0.85 ? '#fff0b0' : '#ffd24a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, phase * 3.2), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  // gêiseres de lava
  for (const [gi, g0] of GEYSERS.entries()) {
    const g = { x: geyserXs[gi] ?? g0.x, phase: g0.phase };
    const h = geyserHeight(env.t, g.phase);
    if (h <= 0) continue;
    rect(env, g.x - 3, GEYSER_BASE - h, 6, h, '#ff6a1a');
    rect(env, g.x - 1, GEYSER_BASE - h, 2, h, '#ffd24a');
    rect(env, g.x - 5, GEYSER_BASE - h - 2, 10, 4, '#ff8a2a');
    for (let k = 0; k < 5; k++) {
      const a = (env.t * 2 + k * 0.37 + g.phase) % 1;
      rect(env, g.x + (k - 2) * 5 * a, GEYSER_BASE - h - 3 + a * a * h * 0.8, 2, 2, '#ffb347');
    }
  }
}

function dais(env: SceneEnv): void {
  const rock = by(env.time, '#4a2a2e', '#2e1a20');
  const rockLight = by(env.time, '#7a4a4a', '#4a2a32');
  const rockDark = by(env.time, '#2a1418', '#180a0e');
  const steps: [number, number, number, number][] = [
    [118, 162, 154, 10],
    [130, 154, 130, 9],
    [142, DAIS_TOP, 106, 9],
  ];
  for (const [x, y, w, h] of steps) {
    rect(env, x - 1, y - 1, w + 2, h + 2, OUT);
    rect(env, x, y, w, h, rock);
    rect(env, x, y, w, 1, rockLight);
    rect(env, x, y + h - 1, w, 1, rockDark);
    // veios de lava na face do degrau
    rect(env, x + 6, y + h - 3, 14, 1, '#ff7a1a');
    rect(env, x + w - 24, y + h - 4, 18, 1, '#ff7a1a');
  }
  // tapete de brasa que desce pelos degraus
  rect(env, CX - 18, DAIS_TOP + 1, 36, 8, '#6a1018');
  rect(env, CX - 18, 155, 36, 8, '#6a1018');
  rect(env, CX - 18, 163, 36, 9, '#6a1018');
  rect(env, CX - 20, 172, 40, 48, '#6a1018');
  rect(env, CX - 20, 172, 2, 48, '#ff7a1a');
  rect(env, CX + 18, 172, 2, 48, '#ff7a1a');
}

function throne(env: SceneEnv): void {
  const { ctx } = env;
  const base = DAIS_TOP;
  const top = 62;
  const body = by(env.time, '#2e1822', '#1c0e14');
  const trim = '#8a2a3a';
  const bone = '#e8dcc0';
  const glowColor = Math.sin(env.t * 2) > -0.3 ? '#ff4a2a' : '#ff8a3a';

  // chifres curvos nas laterais
  for (const side of [-1, 1]) {
    for (const [color, width] of [
      [OUT, 6],
      [bone, 4],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(CX + side * 20, top + 36);
      ctx.quadraticCurveTo(CX + side * 40, top + 30, CX + side * 36, top + 4);
      ctx.stroke();
    }
  }
  // costas pontiagudas
  const outline: [number, number][] = [
    [-22, base - 16],
    [-27, base - 50],
    [-19, base - 56],
    [-16, top + 20],
    [-9, top + 24],
    [-6, top + 10],
    [0, top],
    [6, top + 10],
    [9, top + 24],
    [16, top + 20],
    [19, base - 56],
    [27, base - 50],
    [22, base - 16],
  ];
  const trace = (grow: number): void => {
    ctx.beginPath();
    outline.forEach(([dx, y], i) => {
      const x = CX + dx + Math.sign(dx) * grow;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  trace(1);
  ctx.fillStyle = OUT;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  trace(0);
  ctx.fillStyle = body;
  ctx.fill();
  // painel interno com runa brilhante
  rect(env, CX - 12, top + 30, 24, base - top - 64, '#4a1420');
  rect(env, CX - 12, top + 30, 2, base - top - 64, '#7a2030');
  rect(env, CX - 1, top + 36, 2, 26, glowColor);
  rect(env, CX - 7, top + 44, 14, 2, glowColor);
  rect(env, CX - 5, top + 52, 10, 2, glowColor);
  rect(env, CX - 3, top + 58, 6, 2, glowColor);
  // crânio no topo
  skull(env, CX - 6, top - 12);
  // colunas de ossos nas laterais
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - 30 : CX + 24;
    rect(env, x - 1, top + 32, 8, base - top - 50, OUT);
    rect(env, x, top + 33, 6, base - top - 52, trim);
    rect(env, x, top + 33, 1, base - top - 52, '#c0485a');
    for (let k = 0; k < 3; k++) rect(env, x + 1, top + 42 + k * 12, 4, 2, bone);
  }
  // braços com crânios nas pontas
  for (const side of [-1, 1]) {
    const x = side < 0 ? CX - 32 : CX + 23;
    rect(env, x - 1, base - 30, 12, 9, OUT);
    rect(env, x, base - 29, 10, 7, body);
    rect(env, x, base - 29, 10, 1, trim);
    rect(env, x + (side < 0 ? 0 : 3), base - 36, 7, 7, OUT);
    rect(env, x + (side < 0 ? 1 : 4), base - 35, 5, 5, bone);
    rect(env, x + (side < 0 ? 2 : 5), base - 33, 1, 1, glowColor);
    rect(env, x + (side < 0 ? 4 : 7), base - 33, 1, 1, glowColor);
  }
  // assento de couro sangue e base
  rect(env, CX - 21, base - 23, 42, 8, OUT);
  rect(env, CX - 20, base - 22, 40, 6, '#7a1420');
  rect(env, CX - 20, base - 22, 40, 1, '#c0303c');
  rect(env, CX - 25, base - 15, 50, 15, OUT);
  rect(env, CX - 24, base - 14, 48, 13, body);
  rect(env, CX - 24, base - 14, 48, 1, trim);
  rect(env, CX - 24, base - 2, 48, 1, '#150a0e');
  for (const dx of [-17, -8, 8, 17]) rect(env, CX + dx, base - 11, 1, 6, glowColor);
}

function stalagmite(env: SceneEnv, x: number, base: number, h: number, flip = 1): void {
  const { ctx } = env;
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.moveTo(x - 9 * flip, base + 1);
  ctx.lineTo(x - 2 * flip, base - h - 1);
  ctx.lineTo(x + 8 * flip, base - h * 0.5);
  ctx.lineTo(x + 12 * flip, base + 1);
  ctx.fill();
  ctx.fillStyle = by(env.time, '#3a1418', '#220a0e');
  ctx.beginPath();
  ctx.moveTo(x - 8 * flip, base);
  ctx.lineTo(x - 2 * flip, base - h);
  ctx.lineTo(x + 7 * flip, base - h * 0.5);
  ctx.lineTo(x + 11 * flip, base);
  ctx.fill();
  ctx.fillStyle = '#7a2a38';
  ctx.beginPath();
  ctx.moveTo(x - 2 * flip, base - h);
  ctx.lineTo(x - 4 * flip, base - h * 0.4);
  ctx.lineTo(x - 2 * flip, base - h * 0.4);
  ctx.fill();
  rect(env, x - 8 * flip, base - 1, 2, 1, '#ff7a1a');
}

function skull(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 1, y - 1, 14, 12, OUT);
  rect(env, x, y, 12, 9, '#e8e0cc');
  rect(env, x, y, 12, 1, '#fff8e8');
  rect(env, x + 9, y, 3, 9, '#c8bfa8');
  rect(env, x + 2, y + 9, 8, 4, OUT);
  rect(env, x + 3, y + 9, 6, 3, '#d4ccb8');
  rect(env, x + 4, y + 9, 1, 3, OUT);
  rect(env, x + 7, y + 9, 1, 3, OUT);
  rect(env, x + 2, y + 3, 3, 3, OUT);
  rect(env, x + 7, y + 3, 3, 3, OUT);
  const pulse = Math.sin(env.t * 3 + x) > 0 ? '#ff4a2a' : '#ff8a3a';
  rect(env, x + 3, y + 4, 1, 1, pulse);
  rect(env, x + 8, y + 4, 1, 1, pulse);
  rect(env, x + 5, y + 6, 2, 2, OUT);
}

function skullPike(env: SceneEnv, x: number, base: number): void {
  rect(env, x - 1, base - 44, 4, 46, OUT);
  rect(env, x, base - 44, 2, 44, '#4a2a22');
  skull(env, x - 5, base - 56);
  rect(env, x - 4, base - 44, 10, 2, OUT);
}

function ribcage(env: SceneEnv, x: number, base: number): void {
  const { ctx } = env;
  rect(env, x - 1, base - 30, 4, 32, OUT);
  rect(env, x, base - 29, 2, 30, '#d8cfb8');
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const y = base - 26 + i * 6;
    const w = 13 - i * 2;
    for (const side of [-1, 1]) {
      for (const [color, width] of [
        [OUT, 4],
        ['#d8cfb8', 2],
      ] as const) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x + 1, y);
        ctx.quadraticCurveTo(x + 1 + side * w, y - 2, x + 1 + side * w, y + 6);
        ctx.stroke();
      }
    }
  }
}

function trident(env: SceneEnv, x: number, base: number): void {
  const iron = by(env.time, '#4a4a58', '#33333f');
  rect(env, x - 1, base - 70, 5, 72, OUT);
  rect(env, x, base - 70, 3, 70, iron);
  rect(env, x, base - 70, 1, 70, '#8a8a9c');
  for (const dx of [-8, 8]) {
    rect(env, x + dx - 1, base - 88, 5, 20, OUT);
    rect(env, x + dx, base - 87, 3, 18, iron);
    rect(env, x + dx, base - 87, 1, 18, '#8a8a9c');
  }
  rect(env, x - 1, base - 94, 5, 28, OUT);
  rect(env, x, base - 93, 3, 26, iron);
  rect(env, x - 9, base - 70, 21, 4, OUT);
  rect(env, x - 8, base - 69, 19, 2, iron);
  // pontas incandescentes
  for (const dx of [-8, 0, 8]) rect(env, x + dx, base - (dx === 0 ? 96 : 90), 3, 3, '#ff7a1a');
}

function brazier(env: SceneEnv, x: number): void {
  const iron = '#2a2a33';
  // tripé
  for (const [dx, dir] of [
    [-7, -1],
    [7, 1],
  ] as const) {
    for (let i = 0; i < 14; i++) {
      rect(env, x + dx + dir * Math.round(i * 0.2) - 1, BRAZIER_BASE - 14 + i, 3, 1, OUT);
      rect(env, x + dx + dir * Math.round(i * 0.2), BRAZIER_BASE - 14 + i, 1, 1, '#5a5a6a');
    }
  }
  rect(env, x - 1, BRAZIER_BASE - 14, 3, 14, OUT);
  rect(env, x, BRAZIER_BASE - 13, 1, 13, '#4a4a58');
  // bacia
  rect(env, x - 12, BRAZIER_BASE - 22, 24, 9, OUT);
  rect(env, x - 11, BRAZIER_BASE - 21, 22, 7, iron);
  rect(env, x - 11, BRAZIER_BASE - 21, 22, 1, '#6a6a7c');
  rect(env, x - 12, BRAZIER_BASE - 24, 24, 3, OUT);
  rect(env, x - 11, BRAZIER_BASE - 23, 22, 1, '#ff7a1a');
  flame(env, x - 4, BRAZIER_BASE - 23, 2);
  flame(env, x + 5, BRAZIER_BASE - 23, 2);
  flame(env, x, BRAZIER_BASE - 23, 3);
}

function groundCracks(env: SceneEnv): void {
  const random = rng(8);
  for (let i = 0; i < 12; i++) {
    const x = random() * SCENE_W;
    const y = 168 + random() * 50;
    const len = 10 + random() * 22;
    const pulse = 0.6 + 0.4 * Math.sin(env.t * 1.6 + i);
    rect(
      env,
      x,
      y,
      len,
      1,
      `rgba(255,${Math.round(110 + 60 * pulse)},26,${(0.55 + pulse * 0.4).toFixed(2)})`,
    );
    rect(env, x + len * 0.3, y + 1, len * 0.3, 1, 'rgba(255,170,60,0.6)');
  }
}

const HELL_PERIOD = 1300;
const MOUNTAIN_PERIOD = 900;

/** Número fixo entre 0 e 1 por posição, para as montanhas não mudarem de forma enquanto rolam. */
function noise(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Faixa de montanhas que rola devagar; cada pico mantém a forma ao passar. */
function journeyMountains(
  env: SceneEnv,
  seed: number,
  base: number,
  minH: number,
  span: number,
  color: string,
  rim: string,
  shift: number,
): void {
  const { ctx } = env;
  const first = Math.floor((shift - 60) / 34);
  for (let i = first; i < first + 16; i++) {
    const x = i * 34 - shift;
    if (x < -50 || x > SCENE_W + 30) continue;
    const h = minH + noise(seed, i) * span;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 8, base);
    ctx.lineTo(x + 6, base - h * 0.62);
    ctx.lineTo(x + 12, base - h * 0.7);
    ctx.lineTo(x + 18, base - h);
    ctx.lineTo(x + 25, base - h * 0.55);
    ctx.lineTo(x + 31, base - h * 0.6);
    ctx.lineTo(x + 46, base);
    ctx.fill();
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 18, base - h);
    ctx.lineTo(x + 25, base - h * 0.55);
    ctx.stroke();
  }
}

const routeX = (env: SceneEnv, world: number): number =>
  Math.round(scrolled(world, env.scroll, HELL_PERIOD));
const farX = (env: SceneEnv, world: number, factor: number, period: number): number =>
  Math.round(scrolled(world, env.scroll, period, factor));

/** Peças do caminho, espalhadas sem ritmo fixo. */
const ROUTE: {
  kind: 'brazier' | 'stalagmite' | 'skull' | 'ribcage' | 'trident' | 'pike';
  x: number;
}[] = [
  { kind: 'brazier', x: 140 },
  { kind: 'skull', x: 300 },
  { kind: 'stalagmite', x: 410 },
  { kind: 'trident', x: 560 },
  { kind: 'ribcage', x: 690 },
  { kind: 'brazier', x: 800 },
  { kind: 'pike', x: 930 },
  { kind: 'stalagmite', x: 1030 },
  { kind: 'skull', x: 1120 },
  { kind: 'trident', x: 1230 },
];
const GEYSER_WORLD = [60, 420, 760] as const;

function geyserScreenXs(env: SceneEnv): number[] {
  return GEYSERS.map((_, i) => farX(env, GEYSER_WORLD[i] ?? 60, 0.5, 900));
}

/** Inferno na jornada: lava, vulcão e montanhas passam ao fundo; ossos, braseiros e tridentes pelo caminho. */
function journey(env: SceneEnv): void {
  gradientRect(env, 0, 0, SCENE_W, HORIZON, [...SKY_BY_TIME[env.time]]);
  const sunY = env.time === 'morning' ? 96 : 40;
  glow(env, 300, sunY, 80, env.time === 'night' ? [200, 40, 30] : [255, 150, 60], 0.6);
  const orb = env.ctx.createRadialGradient(300, sunY, 0, 300, sunY, 14);
  orb.addColorStop(0, env.time === 'night' ? '#d83a2a' : '#fff0b0');
  orb.addColorStop(1, env.time === 'night' ? '#7a1414' : '#ff9a3c');
  env.ctx.fillStyle = orb;
  env.ctx.beginPath();
  env.ctx.arc(300, sunY, 14, 0, Math.PI * 2);
  env.ctx.fill();
  smokeBanks(env);
  hellSky(env);
  journeyMountains(
    env,
    41,
    HORIZON,
    34,
    34,
    by(env.time, '#3a0f12', '#1b080b'),
    'rgba(255,120,40,0.5)',
    env.scroll * 0.04,
  );
  volcano(env, farX(env, VOLCANO.x, 0.1, MOUNTAIN_PERIOD));
  journeyMountains(
    env,
    59,
    HORIZON + 2,
    22,
    30,
    by(env.time, '#2a0b0b', '#14060a'),
    'rgba(255,100,30,0.6)',
    env.scroll * 0.08,
  );
  tileArea(env, env.tiles.lavarock, 0, 160, 0, HORIZON, SCENE_W, SCENE_H - HORIZON, env.scroll);
  gradientRect(env, 0, HORIZON, SCENE_W, 26, ['rgba(255,90,30,0.4)', 'rgba(255,90,30,0)']);
  rect(env, 0, HORIZON - 1, SCENE_W, 2, 'rgba(0,0,0,0.5)');
  lavaLake(env, env.scroll * 0.5, geyserScreenXs(env));
  const random = rng(8);
  for (let i = 0; i < 12; i++) {
    const x = scrolled(random() * 820, env.scroll, 820);
    const y = 168 + random() * 50;
    const len = 10 + random() * 22;
    const pulse = 0.6 + 0.4 * Math.sin(env.t * 1.6 + i);
    rect(
      env,
      x,
      y,
      len,
      1,
      `rgba(255,${Math.round(110 + 60 * pulse)},26,${(0.55 + pulse * 0.4).toFixed(2)})`,
    );
    rect(env, x + len * 0.3, y + 1, len * 0.3, 1, 'rgba(255,170,60,0.6)');
  }
  for (const item of ROUTE) {
    const x = routeX(env, item.x);
    if (x < -60 || x > SCENE_W + 60) continue;
    if (item.kind === 'brazier') brazier(env, x);
    else if (item.kind === 'stalagmite') stalagmite(env, x, 176, 34, item.x % 2 ? 1 : -1);
    else if (item.kind === 'skull') skull(env, x, 176);
    else if (item.kind === 'ribcage') ribcage(env, x, 178);
    else if (item.kind === 'trident') trident(env, x, 176);
    else skullPike(env, x, 174);
  }
  embers(env);
  if (env.arrivedFor !== null) portal(env, env.arrivedFor, 170);
}

export const hell: SceneDef = {
  id: 'hell',
  name: 'Inferno',
  blurb:
    'Trono infernal no centro, rio de lava correndo ao fundo, vulcão, braseiros e brasas subindo.',
  groundY: HELL_GROUND,
  levels: HELL_LEVEL_COUNT,
  levelInfo: HELL_LEVELS,
  ...hellLevelLayers,
  extrasFor: hellExtras,
  journeyExtrasFor: hellJourneyExtras,
  journeyPeriod: HELL_PERIOD,
  journey,
  back(env) {
    gradientRect(env, 0, 0, SCENE_W, HORIZON, [...SKY_BY_TIME[env.time]]);
    const sunY = env.time === 'morning' ? 96 : 40;
    glow(env, 300, sunY, 80, env.time === 'night' ? [200, 40, 30] : [255, 150, 60], 0.6);
    const orb = env.ctx.createRadialGradient(300, sunY, 0, 300, sunY, 14);
    orb.addColorStop(0, env.time === 'night' ? '#d83a2a' : '#fff0b0');
    orb.addColorStop(1, env.time === 'night' ? '#7a1414' : '#ff9a3c');
    env.ctx.fillStyle = orb;
    env.ctx.beginPath();
    env.ctx.arc(300, sunY, 14, 0, Math.PI * 2);
    env.ctx.fill();
    smokeBanks(env);
    hellSky(env);
    mountainLayer(
      env,
      41,
      HORIZON,
      34,
      34,
      by(env.time, '#3a0f12', '#1b080b'),
      'rgba(255,120,40,0.5)',
    );
    volcano(env);
    mountainLayer(
      env,
      59,
      HORIZON + 2,
      22,
      30,
      by(env.time, '#2a0b0b', '#14060a'),
      'rgba(255,100,30,0.6)',
    );

    // Chão de rocha até o horizonte, com névoa avermelhada na base das montanhas
    tileArea(env, env.tiles.lavarock, 0, 160, 0, HORIZON, SCENE_W, SCENE_H - HORIZON);
    gradientRect(env, 0, HORIZON, SCENE_W, 26, ['rgba(255,90,30,0.4)', 'rgba(255,90,30,0)']);
    rect(env, 0, HORIZON - 1, SCENE_W, 2, 'rgba(0,0,0,0.5)');
    lavaLake(env);
    groundCracks(env);

    stalagmite(env, 22, 206, 42);
    stalagmite(env, 372, 204, 40, -1);
    for (const x of BRAZIERS) brazier(env, x);
    dais(env);
    throne(env);
    skull(env, 150, 200);
    ribcage(env, 292, 204);
    trident(env, 56, 200);
    skullPike(env, 362, 190);
    embers(env);
  },
  lights: (env): Light[] => {
    const all: TimeOfDay[] = ['morning', 'afternoon', 'night'];
    if (env.journey) {
      const out: Light[] = [
        {
          x: 100,
          y: 142,
          radius: 130,
          color: [255, 110, 30],
          intensity: 0.5,
          flicker: true,
          at: all,
        },
        {
          x: 300,
          y: 138,
          radius: 130,
          color: [255, 110, 30],
          intensity: 0.55,
          flicker: true,
          at: all,
        },
        {
          x: farX(env, VOLCANO.x, 0.1, MOUNTAIN_PERIOD),
          y: VOLCANO.peak,
          radius: 80,
          color: [255, 120, 40],
          intensity: 0.45,
          flicker: true,
          at: all,
        },
      ];
      for (const item of ROUTE) {
        if (item.kind !== 'brazier') continue;
        const x = routeX(env, item.x);
        if (x > -80 && x < SCENE_W + 80) {
          out.push({
            x,
            y: BRAZIER_BASE - 26,
            radius: 70,
            color: [255, 130, 40],
            intensity: 0.7,
            flicker: true,
            at: all,
          });
        }
      }
      const gx = geyserScreenXs(env);
      GEYSERS.forEach((g, i) => {
        const h = geyserHeight(env.t, g.phase);
        if (h > 0) {
          out.push({
            x: gx[i] ?? g.x,
            y: GEYSER_BASE - h,
            radius: 60,
            color: [255, 150, 50],
            intensity: 0.6,
            at: all,
          });
        }
      });
      return out;
    }
    const out: Light[] = [
      {
        x: 100,
        y: 142,
        radius: 130,
        color: [255, 110, 30],
        intensity: 0.5,
        flicker: true,
        at: all,
      },
      {
        x: 300,
        y: 138,
        radius: 130,
        color: [255, 110, 30],
        intensity: 0.55,
        flicker: true,
        at: all,
      },
      {
        x: VOLCANO.x,
        y: VOLCANO.peak,
        radius: 80,
        color: [255, 120, 40],
        intensity: 0.45,
        flicker: true,
        at: all,
      },
      { x: CX, y: 120, radius: 90, color: [255, 70, 40], intensity: 0.28, flicker: true, at: all },
      ...BRAZIERS.map((x) => ({
        x,
        y: BRAZIER_BASE - 26,
        radius: 70,
        color: [255, 130, 40] as [number, number, number],
        intensity: 0.7,
        flicker: true,
        at: all,
      })),
    ];
    for (const g of GEYSERS) {
      const h = geyserHeight(env.t, g.phase);
      if (h > 0)
        out.push({
          x: g.x,
          y: GEYSER_BASE - h,
          radius: 60,
          color: [255, 150, 50],
          intensity: 0.6,
          at: all,
        });
    }
    return out;
  },
  tint: {
    morning: { color: '#ff8a70', alpha: 0.28 },
    afternoon: { color: '#ff9a50', alpha: 0.2 },
    night: { color: '#9a2038', alpha: 0.4 },
  },
};
