import { flame, glow, gradientRect, rect, rng, tileArea } from './draw';
import type { Light, SceneDef, SceneEnv, TimeOfDay } from './types';
import { SCENE_H, SCENE_W } from './types';

const HORIZON = 126;
const LAVA_TOP = 128;
const LAVA_BOTTOM = 160;
const OUT = '#120406';

const SKY_BY_TIME = {
  morning: ['#3a0c10', '#58121a', '#7d1c1c', '#a52c1c', '#cf4a1c', '#e8702a'],
  afternoon: ['#5a0e0e', '#8a1a12', '#b52a12', '#dd4414', '#f26a1c', '#ff9a3c'],
  night: ['#0a0305', '#14060a', '#200a0c', '#2e0f0d', '#44160e', '#5c1d0f'],
} as const;

function by<T>(time: TimeOfDay, day: T, night: T): T {
  return time === 'night' ? night : day;
}

const BRAZIERS = [138, 252] as const;
const BRAZIER_BASE = 172;
const GEYSERS = [
  { x: 58, phase: 0 },
  { x: 334, phase: 2.6 },
] as const;
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

function volcano(env: SceneEnv): void {
  const { ctx } = env;
  const { x, peak } = VOLCANO;
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

function lava(env: SceneEnv): void {
  tileArea(env, env.tiles.lava, 0, 160, 0, LAVA_TOP, SCENE_W, LAVA_BOTTOM - LAVA_TOP, env.t * 14);
  gradientRect(env, 0, LAVA_TOP, SCENE_W, 12, ['rgba(60,10,6,0.55)', 'rgba(60,10,6,0)']);
  rect(env, 0, LAVA_TOP - 1, SCENE_W, 2, '#ffb347');
  // bolhas que crescem e estouram
  const random = rng(12);
  const { ctx } = env;
  for (let i = 0; i < 10; i++) {
    const x = random() * SCENE_W;
    const y = LAVA_TOP + 6 + random() * 20;
    const phase = (env.t * 0.6 + random() * 3) % 1;
    const r = phase * 3.2;
    ctx.strokeStyle = phase > 0.85 ? '#fff0b0' : '#ffd24a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
    ctx.stroke();
  }
  // gêiseres de lava
  for (const g of GEYSERS) {
    const h = geyserHeight(env.t, g.phase);
    if (h <= 0) continue;
    const base = LAVA_BOTTOM - 6;
    rect(env, g.x - 3, base - h, 6, h, '#ff6a1a');
    rect(env, g.x - 1, base - h, 2, h, '#ffd24a');
    rect(env, g.x - 5, base - h - 2, 10, 4, '#ff8a2a');
    for (let k = 0; k < 5; k++) {
      const a = (env.t * 2 + k * 0.37 + g.phase) % 1;
      rect(env, g.x + (k - 2) * 5 * a, base - h - 3 + a * a * h * 0.8, 2, 2, '#ffb347');
    }
  }
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

export const hell: SceneDef = {
  id: 'hell',
  name: 'Inferno',
  blurb: 'Vulcão, rio de lava com bolhas e gêiseres, braseiros, ossos e brasas subindo.',
  groundY: 182,
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

    lava(env);

    // Chão de rocha com borda iluminada pela lava
    tileArea(env, env.tiles.lavarock, 0, 160, 0, LAVA_BOTTOM, SCENE_W, SCENE_H - LAVA_BOTTOM);
    rect(env, 0, LAVA_BOTTOM - 2, SCENE_W, 2, 'rgba(0,0,0,0.55)');
    gradientRect(env, 0, LAVA_BOTTOM, SCENE_W, 14, ['rgba(255,110,30,0.35)', 'rgba(255,110,30,0)']);
    groundCracks(env);

    stalagmite(env, 22, 206, 44);
    stalagmite(env, 372, 204, 40, -1);
    skull(env, 40, 184);
    ribcage(env, 304, 202);
    skullPike(env, 352, 196);
    trident(env, 82, 200);
    for (const x of BRAZIERS) brazier(env, x);
    embers(env);
  },
  lights: (env): Light[] => {
    const all: TimeOfDay[] = ['morning', 'afternoon', 'night'];
    const out: Light[] = [
      {
        x: 100,
        y: 144,
        radius: 130,
        color: [255, 110, 30],
        intensity: 0.5,
        flicker: true,
        at: all,
      },
      {
        x: 300,
        y: 144,
        radius: 130,
        color: [255, 110, 30],
        intensity: 0.5,
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
          y: LAVA_BOTTOM - 6 - h,
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
