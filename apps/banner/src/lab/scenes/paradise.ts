import { gradientRect, rect, rng, sky, tileArea } from './draw';
import type { Light, SceneDef, SceneEnv, TimeOfDay } from './types';
import { SCENE_H, SCENE_W } from './types';

const HORIZON = 104;
const OUT = '#16301c';

/** Escolhe uma cor conforme a hora do dia. */
function by<T>(time: TimeOfDay, morning: T, afternoon: T, night: T): T {
  return time === 'morning' ? morning : time === 'afternoon' ? afternoon : night;
}

function rainbow(env: SceneEnv): void {
  if (env.time === 'night') return;
  const { ctx } = env;
  const colors = ['#ff5a5a', '#ffa14a', '#ffe14a', '#6bdc6b', '#4ab6ff', '#8a6bff'];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SCENE_W, HORIZON + 14);
  ctx.clip();
  ctx.globalAlpha = env.time === 'morning' ? 0.32 : 0.4;
  colors.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(120, 168, 138 - i * 3, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  });
  ctx.restore();
}

function mountains(env: SceneEnv): void {
  const { ctx } = env;
  const body = by(env.time, '#9aa8d6', '#8fb0d8', '#2d4373');
  const snow = by(env.time, '#fff0f0', '#ffffff', '#aab8e0');
  const peaks: [number, number][] = [
    [40, 46],
    [118, 60],
    [216, 40],
    [300, 56],
    [372, 44],
  ];
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-10, HORIZON + 6);
  for (const [x, h] of peaks) {
    ctx.lineTo(x - 52, HORIZON + 6);
    ctx.lineTo(x, HORIZON - h);
    ctx.lineTo(x + 52, HORIZON + 6);
  }
  ctx.lineTo(SCENE_W + 10, HORIZON + 6);
  ctx.fill();
  // neve no topo e sombra do lado direito
  for (const [x, h] of peaks) {
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(x, HORIZON - h);
    ctx.lineTo(x - 12, HORIZON - h + 14);
    ctx.lineTo(x - 5, HORIZON - h + 11);
    ctx.lineTo(x, HORIZON - h + 16);
    ctx.lineTo(x + 5, HORIZON - h + 11);
    ctx.lineTo(x + 12, HORIZON - h + 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,70,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, HORIZON - h);
    ctx.lineTo(x + 52, HORIZON + 6);
    ctx.lineTo(x + 8, HORIZON + 6);
    ctx.fill();
  }
}

function hills(env: SceneEnv): void {
  const { ctx } = env;
  const layers: [number, number, number, string, string][] = [
    [HORIZON - 4, 8, 0.6, by(env.time, '#7dcf8a', '#6fd07f', '#1c4a4a'), 'far'],
    [HORIZON + 8, 7, 2.4, by(env.time, '#5fbf72', '#52c26a', '#16403f'), 'near'],
  ];
  for (const [base, amp, phase, color] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 150);
    for (let x = 0; x <= SCENE_W; x += 4)
      ctx.lineTo(x, base + Math.sin(x / 31 + phase) * amp + Math.sin(x / 11) * 1.5);
    ctx.lineTo(SCENE_W, 150);
    ctx.fill();
  }
}

function temple(env: SceneEnv, cx: number, base: number): void {
  const { ctx } = env;
  const stone = by(env.time, '#f6efe4', '#fffaf0', '#cfd6ee');
  const shade = by(env.time, '#d3c8b8', '#d6ccbb', '#8f9ac0');
  // degraus
  rect(env, cx - 31, base - 3, 62, 3, OUT);
  rect(env, cx - 30, base - 3, 60, 2, shade);
  rect(env, cx - 27, base - 6, 54, 3, OUT);
  rect(env, cx - 26, base - 6, 52, 2, stone);
  // colunas
  for (const dx of [-22, -8, 8, 22]) {
    rect(env, cx + dx - 3, base - 30, 6, 24, OUT);
    rect(env, cx + dx - 2, base - 29, 4, 22, stone);
    rect(env, cx + dx + 1, base - 29, 1, 22, shade);
    rect(env, cx + dx - 3, base - 32, 6, 3, stone);
  }
  // viga e frontão triangular
  rect(env, cx - 28, base - 35, 56, 5, OUT);
  rect(env, cx - 27, base - 34, 54, 3, stone);
  rect(env, cx - 27, base - 31, 54, 1, shade);
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.moveTo(cx - 30, base - 35);
  ctx.lineTo(cx, base - 52);
  ctx.lineTo(cx + 30, base - 35);
  ctx.fill();
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(cx - 26, base - 36);
  ctx.lineTo(cx, base - 49);
  ctx.lineTo(cx + 26, base - 36);
  ctx.fill();
  ctx.fillStyle = by(env.time, '#ffd35a', '#ffd35a', '#ffe9a0');
  ctx.beginPath();
  ctx.arc(cx, base - 41, 3, 0, Math.PI * 2);
  ctx.fill();
  // flores subindo pelas colunas
  for (const dx of [-22, 22]) {
    for (let k = 0; k < 4; k++)
      rect(env, cx + dx + (k % 2 ? 2 : -3), base - 10 - k * 5, 2, 2, '#ff8fb8');
  }
}

/** Árvore de cerejeira: tronco e copa de bolas rosadas, com pétalas caindo. */
function blossomTree(env: SceneEnv, x: number, base: number, scale: number): void {
  const { ctx } = env;
  const trunk = '#6b4a2a';
  ctx.fillStyle = OUT;
  ctx.fillRect(x - 5 * scale - 1, base - 46 * scale, 10 * scale + 2, 46 * scale + 1);
  ctx.fillStyle = trunk;
  ctx.fillRect(x - 5 * scale, base - 46 * scale, 10 * scale, 46 * scale);
  ctx.fillStyle = '#8a643c';
  ctx.fillRect(x - 5 * scale, base - 46 * scale, 3 * scale, 46 * scale);
  const pink = by(env.time, '#ffb3cf', '#ffc2d8', '#9a7fb8');
  const light = by(env.time, '#ffd6e6', '#ffe0ec', '#c6aadc');
  const dark = by(env.time, '#e88ab0', '#f09ab9', '#6f5a90');
  const puffs: [number, number, number][] = [
    [-26, -66, 16],
    [0, -78, 20],
    [26, -66, 16],
    [-14, -54, 15],
    [14, -54, 15],
    [-34, -50, 11],
    [34, -50, 11],
  ];
  for (const [dx, dy, r] of puffs) {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(x + dx * scale, base + (dy + 3) * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [dx, dy, r] of puffs) {
    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.arc(x + dx * scale, base + dy * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  const random = rng(Math.round(x));
  ctx.fillStyle = light;
  for (let i = 0; i < 30; i++) {
    const [dx, dy, r] = puffs[i % puffs.length] ?? puffs[0] ?? [0, 0, 1];
    const a = random() * Math.PI * 2;
    const d = random() * r * 0.8;
    ctx.fillRect(
      Math.round(x + (dx + Math.cos(a) * d) * scale),
      Math.round(base + (dy + Math.sin(a) * d) * scale),
      2,
      2,
    );
  }
  // pétalas caindo
  for (let i = 0; i < 8; i++) {
    const fall = (env.t * (8 + (i % 3) * 3) + i * 17) % 70;
    const px = x - 34 * scale + ((i * 23) % 70) * scale + Math.sin(env.t * 1.5 + i) * 4;
    rect(env, px, base - 60 * scale + fall, 2, 1, light);
  }
}

function leafyTree(env: SceneEnv, x: number, base: number, scale: number): void {
  const { ctx } = env;
  ctx.fillStyle = OUT;
  ctx.fillRect(x - 3 * scale - 1, base - 26 * scale, 6 * scale + 2, 27 * scale);
  ctx.fillStyle = '#6b4a2a';
  ctx.fillRect(x - 3 * scale, base - 26 * scale, 6 * scale, 26 * scale);
  const green = by(env.time, '#4fb35d', '#46b857', '#1f5a46');
  const dark = by(env.time, '#2f8a47', '#2a8f44', '#143d33');
  const light = by(env.time, '#8fe08a', '#9ae892', '#3c8a63');
  const puffs: [number, number, number][] = [
    [-14, -40, 14],
    [10, -48, 16],
    [16, -34, 13],
    [-4, -32, 14],
  ];
  for (const [dx, dy, r] of puffs) {
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(x + dx * scale, base + (dy + 3) * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [dx, dy, r] of puffs) {
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.arc(x + dx * scale, base + dy * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = light;
  for (const [dx, dy, r] of puffs) {
    ctx.beginPath();
    ctx.arc(
      x + (dx - r * 0.3) * scale,
      base + (dy - r * 0.35) * scale,
      r * 0.35 * scale,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

const LAKE = { cx: 76, cy: 182, rx: 62, ry: 24 };

function lake(env: SceneEnv): void {
  const { ctx } = env;
  const path = (grow = 0): void => {
    ctx.beginPath();
    ctx.ellipse(LAKE.cx, LAKE.cy, LAKE.rx + grow, LAKE.ry + grow * 0.6, 0, 0, Math.PI * 2);
  };
  // margem de terra e pedras
  path(3);
  ctx.fillStyle = '#7a5a34';
  ctx.fill();
  path(1);
  ctx.fillStyle = '#c9b27a';
  ctx.fill();
  // água
  ctx.save();
  path();
  ctx.clip();
  gradientRect(
    env,
    LAKE.cx - LAKE.rx,
    LAKE.cy - LAKE.ry,
    LAKE.rx * 2,
    LAKE.ry * 2,
    by(env.time, ['#5ec8dc', '#2f9ac4'], ['#4fc3e8', '#2a8cd0'], ['#173a6a', '#0e2a55']),
  );
  tileArea(
    env,
    env.tiles.water,
    0,
    160,
    LAKE.cx - LAKE.rx,
    LAKE.cy - LAKE.ry,
    LAKE.rx * 2,
    LAKE.ry * 2,
    env.t * 6,
  );
  gradientRect(env, LAKE.cx - LAKE.rx, LAKE.cy - LAKE.ry, LAKE.rx * 2, 10, [
    'rgba(255,255,255,0.35)',
    'rgba(255,255,255,0)',
  ]);
  // brilhos
  const random = rng(4);
  for (let i = 0; i < 9; i++) {
    const phase = Math.sin(env.t * 2 + i * 1.3);
    if (phase > 0.2)
      rect(
        env,
        LAKE.cx - 50 + random() * 100,
        LAKE.cy - 14 + random() * 28,
        4,
        1,
        'rgba(255,255,255,0.7)',
      );
  }
  ctx.restore();
  // vitórias-régias com flor de lótus
  for (const [dx, dy, flower] of [
    [-30, -4, true],
    [-8, 8, false],
    [20, -8, true],
    [34, 6, false],
    [-44, 8, false],
  ] as const) {
    const bob = Math.sin(env.t * 1.2 + dx) * 0.6;
    ctx.fillStyle = '#1f6f3a';
    ctx.beginPath();
    ctx.ellipse(LAKE.cx + dx, LAKE.cy + dy + bob + 1, 8, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#46c25f';
    ctx.beginPath();
    ctx.ellipse(LAKE.cx + dx, LAKE.cy + dy + bob, 8, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (flower) {
      rect(env, LAKE.cx + dx - 2, LAKE.cy + dy + bob - 4, 5, 3, '#ff8fd0');
      rect(env, LAKE.cx + dx - 1, LAKE.cy + dy + bob - 6, 3, 3, '#ffc2e6');
      rect(env, LAKE.cx + dx, LAKE.cy + dy + bob - 4, 1, 2, '#ffe14a');
    }
  }
  // juncos na margem
  for (const [dx, dy] of [
    [-58, 10],
    [-55, 14],
    [52, 14],
    [56, 8],
    [-8, -22],
    [30, -22],
  ] as const) {
    const sway = Math.round(Math.sin(env.t * 1.5 + dx) * 1);
    rect(env, LAKE.cx + dx, LAKE.cy + dy - 14, 1, 14, '#2f8a47');
    rect(env, LAKE.cx + dx + sway, LAKE.cy + dy - 18, 2, 5, '#6b4a2a');
    rect(env, LAKE.cx + dx + 2, LAKE.cy + dy - 10, 1, 10, '#46c25f');
  }
}

function flowers(env: SceneEnv): void {
  const random = rng(17);
  const colors = ['#ff6fa8', '#ffd23f', '#ffffff', '#b08aff', '#ff8a3d', '#6fd3ff'];
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(random() * SCENE_W);
    const y = HORIZON + 22 + Math.floor(random() * 92);
    const inLake = ((x - LAKE.cx) / (LAKE.rx + 6)) ** 2 + ((y - LAKE.cy) / (LAKE.ry + 5)) ** 2 < 1;
    if (inLake) continue;
    const color = colors[i % colors.length] ?? '#fff';
    const sway = Math.round(Math.sin(env.t * 1.6 + i) * 0.6);
    rect(env, x, y + 2, 1, 3, '#2f9a4a');
    rect(env, x - 1 + sway, y, 3, 1, color);
    rect(env, x + sway, y - 1, 1, 3, color);
    rect(env, x + sway, y, 1, 1, '#ffe14a');
  }
  // tufos de grama alta
  for (let i = 0; i < 40; i++) {
    const x = random() * SCENE_W;
    const y = HORIZON + 24 + random() * 90;
    rect(env, x, y, 1, 3, 'rgba(30,110,50,0.55)');
    rect(env, x + 2, y + 1, 1, 2, 'rgba(30,110,50,0.55)');
  }
}

function butterflies(env: SceneEnv): void {
  if (env.time === 'night') return;
  const colors = ['#ff8fd0', '#ffd23f', '#8fd0ff', '#ffa14a'];
  for (let i = 0; i < 5; i++) {
    const x = 50 + i * 70 + Math.sin(env.t * 0.9 + i) * 30;
    const y = 138 + Math.cos(env.t * 1.3 + i * 2) * 14 + i * 5;
    const flap = Math.sin(env.t * 14 + i) > 0 ? 3 : 1;
    const color = colors[i % colors.length] ?? '#ff8fd0';
    rect(env, x - flap, y - 1, flap, 2, color);
    rect(env, x + 1, y - 1, flap, 2, color);
    rect(env, x - flap + 1, y + 1, flap - 1, 1, color);
    rect(env, x, y - 1, 1, 3, '#3b2a4a');
  }
}

function birds(env: SceneEnv): void {
  if (env.time === 'night') return;
  for (let i = 0; i < 3; i++) {
    const x = ((env.t * (14 + i * 3) + i * 120) % (SCENE_W + 40)) - 20;
    const y = 26 + i * 12 + Math.sin(env.t * 2 + i) * 3;
    const up = Math.sin(env.t * 9 + i) > 0;
    const color = by(env.time, '#5a4a6a', '#3a4a6a', '#000');
    rect(env, x - 3, y + (up ? -1 : 1), 3, 1, color);
    rect(env, x, y, 1, 1, color);
    rect(env, x + 1, y + (up ? -1 : 1), 3, 1, color);
  }
}

/** Vaga-lumes: mesma posição para o desenho e para o brilho. */
function fireflyPos(i: number, t: number): { x: number; y: number; on: boolean } {
  const random = rng(31 + i * 7);
  const bx = random() * SCENE_W;
  const by0 = HORIZON + 24 + random() * 84;
  return {
    x: bx + Math.sin(t * 0.8 + i) * 12,
    y: by0 + Math.cos(t * 1.1 + i * 1.7) * 8,
    on: Math.sin(t * 2.6 + i * 2) > -0.3,
  };
}

function fireflies(env: SceneEnv): void {
  if (env.time !== 'night') return;
  for (let i = 0; i < 16; i++) {
    const f = fireflyPos(i, env.t);
    if (f.on) {
      rect(env, f.x, f.y, 2, 2, '#e8ff7a');
      rect(env, f.x, f.y, 1, 1, '#ffffff');
    }
  }
}

export const paradise: SceneDef = {
  id: 'paradise',
  name: 'Paraíso',
  blurb: 'Campo florido com lago e lótus, templo ao longe, cerejeira, arco-íris e borboletas.',
  groundY: 180,
  back(env) {
    sky(env, 0, 0, SCENE_W, HORIZON + 8);
    rainbow(env);
    birds(env);
    mountains(env);
    // raios de sol
    if (env.time !== 'night') {
      for (let i = 0; i < 4; i++) rect(env, 70 + i * 70, 0, 12, HORIZON, 'rgba(255,255,220,0.08)');
    }
    hills(env);
    temple(env, 232, HORIZON + 22);
    // campo e névoa suave no horizonte
    tileArea(env, env.tiles.grass, 0, 160, 0, HORIZON + 24, SCENE_W, SCENE_H - HORIZON - 24);
    gradientRect(env, 0, HORIZON + 22, SCENE_W, 36, [
      by(env.time, 'rgba(255,240,220,0.35)', 'rgba(255,255,240,0.28)', 'rgba(120,150,220,0.18)'),
      'rgba(255,255,255,0)',
    ]);
    leafyTree(env, 360, HORIZON + 40, 0.9);
    lake(env);
    flowers(env);
    blossomTree(env, 318, 176, 1);
    butterflies(env);
    fireflies(env);
  },
  lights: (env): Light[] => {
    const out: Light[] = [
      { x: 304, y: 30, radius: 300, color: [160, 190, 255], intensity: 0.34 },
      { x: 195, y: 150, radius: 230, color: [150, 190, 240], intensity: 0.26 },
      { x: LAKE.cx, y: LAKE.cy, radius: 70, color: [140, 230, 255], intensity: 0.4 },
      { x: 232, y: HORIZON, radius: 60, color: [255, 240, 190], intensity: 0.3 },
    ];
    for (let i = 0; i < 16; i++) {
      const f = fireflyPos(i, env.t);
      if (f.on) out.push({ x: f.x, y: f.y, radius: 12, color: [220, 255, 120], intensity: 0.9 });
    }
    return out;
  },
  tint: {
    morning: { color: '#fff0d0', alpha: 0.12 },
    afternoon: { color: '#ffffff', alpha: 0 },
    night: { color: '#3b55a0', alpha: 0.36 },
  },
};
