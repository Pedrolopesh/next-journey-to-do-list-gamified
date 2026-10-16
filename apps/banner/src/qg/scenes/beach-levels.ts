import {
  beachChair,
  boat,
  cooler,
  HORIZON,
  island,
  JOURNEY_PERIOD,
  OUTLINE,
  palm,
  SAND_LANE,
  towel,
} from './beach-props';
import { bands, flame, gradientRect, portal, rect, rng, scrolled, sky, tileArea } from './draw';
import type { ExtraCharacter, Light, SceneEnv } from './types';
import { SCENE_W } from './types';

export const BEACH_LEVEL_COUNT = 5;

/** Os cinco níveis da praia: o mesmo lugar, a cada nível com mais vida e uma sensação nova. */
export const BEACH_LEVELS: { level: number; name: string; blurb: string }[] = [
  {
    level: 1,
    name: 'Praia deserta',
    blurb:
      'Calma de primeira manhã: uma ilha, um veleiro, palmeiras e as coisas de quem acabou de chegar.',
  },
  {
    level: 2,
    name: 'Praia movimentada',
    blurb:
      'Duas ilhas, barco a motor, gaivotas, quiosque, guarda-sóis e gente: uma parada, outra caminhando.',
  },
  {
    level: 3,
    name: 'Orla da cidade',
    blurb:
      'Calçadão de ondas, prédios no horizonte, postes, bancos e quiosque. Tem quem corra, quem passeie e quem namore o mar.',
  },
  {
    level: 4,
    name: 'Píer e farol',
    blurb:
      'Um píer de madeira entra no mar, barcos de pesca atracados, farol no horizonte e pescadores esperando.',
  },
  {
    level: 5,
    name: 'Luau',
    blurb:
      'Bandeirolas, tochas, fogueira, bar de palha e fogos à noite, com a turma reunida em volta do fogo.',
  },
];

const clampLevel = (level: number): number =>
  Math.min(BEACH_LEVEL_COUNT, Math.max(1, Math.round(level)));

// ---------------------------------------------------------------------------------------------
// Objetos novos
// ---------------------------------------------------------------------------------------------

/** Quiosque: balcão de madeira, prateleira com garrafas e toldo listrado. */
function kiosk(env: SceneEnv, x: number, y: number, awning: string): void {
  rect(env, x - 2, y, 52, 3, 'rgba(0,0,0,0.18)');
  rect(env, x, y - 36, 2, 36, OUTLINE);
  rect(env, x + 46, y - 36, 2, 36, OUTLINE);
  rect(env, x + 2, y - 32, 44, 18, '#4a2f17');
  const bottles = ['#e63946', '#ffc93c', '#2a9d8f', '#ff7a2e', '#6aa8e0', '#e63946', '#ffc93c'];
  bottles.forEach((color, i) => {
    rect(env, x + 5 + i * 6, y - 29, 3, 7, color);
    rect(env, x + 6 + i * 6, y - 31, 1, 2, '#d9d2c0');
  });
  rect(env, x + 2, y - 22, 44, 1, '#2d1a0a');
  rect(env, x + 1, y - 15, 46, 15, OUTLINE);
  rect(env, x + 2, y - 14, 44, 13, '#b8803f');
  rect(env, x + 2, y - 14, 44, 2, '#d9a566');
  for (const px of [14, 26, 38]) rect(env, x + px, y - 12, 1, 11, '#8a5d2c');
  rect(env, x + 18, y - 19, 4, 4, '#f4f4f4');
  rect(env, x + 19, y - 21, 2, 2, '#ff7a2e');
  // toldo
  rect(env, x - 6, y - 45, 60, 11, OUTLINE);
  for (let i = 0; i < 12; i++) {
    rect(env, x - 5 + i * 5, y - 44, 5, 8, i % 2 ? '#f8f8f8' : awning);
    rect(env, x - 5 + i * 5, y - 36, 5, 2, i % 2 ? awning : '#f8f8f8');
  }
  rect(env, x - 5, y - 44, 58, 1, 'rgba(255,255,255,0.45)');
}

/** Guarda-sol aberto com listras e sombra na areia. */
function umbrella(env: SceneEnv, x: number, y: number, color: string): void {
  const { ctx } = env;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 1, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  rect(env, x - 1, y - 34, 3, 35, OUTLINE);
  rect(env, x, y - 34, 1, 34, '#d9d2c0');
  const top = y - 40;
  for (let i = 0; i < 6; i++) {
    const left = x - 24 + i * 8;
    ctx.fillStyle = i % 2 ? '#f8f8f8' : color;
    ctx.beginPath();
    ctx.moveTo(left, top + 10);
    ctx.quadraticCurveTo(left + 2, top - 1, x, top - 2);
    ctx.quadraticCurveTo(left + 12, top - 1, left + 8, top + 10);
    ctx.closePath();
    ctx.fill();
  }
  rect(env, x - 25, top + 10, 50, 1, OUTLINE);
  rect(env, x - 1, top - 4, 3, 3, OUTLINE);
}

/** Poste de luz do calçadão. */
function lamp(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 3, y, 7, 2, 'rgba(0,0,0,0.25)');
  rect(env, x - 1, y - 40, 3, 40, OUTLINE);
  rect(env, x, y - 40, 1, 40, '#6b7a90');
  rect(env, x - 4, y - 44, 9, 6, OUTLINE);
  const lit = env.time === 'night';
  rect(env, x - 3, y - 43, 7, 4, lit ? '#ffe9a8' : '#cfd8e6');
  rect(env, x - 5, y - 46, 11, 2, OUTLINE);
}

function bench(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 2, y, 34, 2, 'rgba(0,0,0,0.2)');
  rect(env, x, y - 8, 2, 8, OUTLINE);
  rect(env, x + 28, y - 8, 2, 8, OUTLINE);
  rect(env, x - 1, y - 17, 32, 11, OUTLINE);
  for (let i = 0; i < 3; i++) rect(env, x, y - 16 + i * 3, 30, 2, i % 2 ? '#9a6a34' : '#b8803f');
  rect(env, x - 1, y - 9, 32, 3, OUTLINE);
  rect(env, x, y - 8, 30, 1, '#c99555');
}

function torch(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 3, y, 7, 2, 'rgba(0,0,0,0.2)');
  rect(env, x - 1, y - 28, 3, 28, OUTLINE);
  rect(env, x, y - 28, 1, 27, '#a67c3d');
  for (const dy of [-8, -16]) rect(env, x - 1, y + dy, 3, 1, '#5a3a1c');
  rect(env, x - 3, y - 31, 7, 4, OUTLINE);
  rect(env, x - 2, y - 30, 5, 2, '#6b4119');
  flame(env, x, y - 31, 1);
}

function bonfire(env: SceneEnv, x: number, y: number): void {
  const { ctx } = env;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, tilt] of [
    [-10, -1],
    [10, 1],
    [0, 0],
  ] as const) {
    ctx.save();
    ctx.translate(x + dx, y);
    ctx.rotate(tilt * 0.6);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-9, -3, 18, 6);
    ctx.fillStyle = '#6b4119';
    ctx.fillRect(-8, -2, 16, 4);
    ctx.restore();
  }
  flame(env, x, y - 1, 3);
  flame(env, x - 7, y, 2);
  flame(env, x + 8, y, 2);
  // faíscas
  for (let i = 0; i < 5; i++) {
    const rise = (env.t * 14 + i * 9) % 34;
    rect(env, x - 8 + i * 4 + Math.sin(env.t * 3 + i) * 3, y - 14 - rise, 1, 1, '#ffd43b');
  }
}

/** Bar de palha (tiki): telhado de folhas, balcão, copos e luzinhas. */
function tiki(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 2, y, 62, 3, 'rgba(0,0,0,0.2)');
  rect(env, x + 2, y - 34, 3, 34, OUTLINE);
  rect(env, x + 52, y - 34, 3, 34, OUTLINE);
  rect(env, x + 3, y - 34, 1, 34, '#a67c3d');
  rect(env, x + 53, y - 34, 1, 34, '#a67c3d');
  rect(env, x + 5, y - 30, 47, 17, '#4a2f17');
  rect(env, x + 1, y - 15, 55, 15, OUTLINE);
  rect(env, x + 2, y - 14, 53, 13, '#c99555');
  rect(env, x + 2, y - 14, 53, 2, '#e2b873');
  for (const px of [16, 30, 44]) rect(env, x + px, y - 12, 1, 11, '#8a5d2c');
  const drinks = ['#ff7a2e', '#e63946', '#ffc93c'];
  drinks.forEach((color, i) => {
    rect(env, x + 10 + i * 16, y - 22, 5, 7, 'rgba(225,242,255,0.9)');
    rect(env, x + 10 + i * 16, y - 20, 5, 5, color);
  });
  // telhado de palha em camadas
  for (let i = 0; i < 6; i++) {
    const w = 70 - i * 9;
    rect(env, x + 28 - w / 2 - 1, y - 38 - i * 4, w + 2, 6, OUTLINE);
    rect(env, x + 28 - w / 2, y - 37 - i * 4, w, 4, i % 2 ? '#d9a84a' : '#b88a2f');
  }
  for (let fx = x - 8; fx < x + 64; fx += 3) rect(env, fx, y - 33, 1, 3, '#8a6320');
  // luzinhas penduradas
  const lit = env.time !== 'afternoon';
  for (let i = 0; i < 8; i++) {
    const on = lit && Math.sin(env.t * 3 + i * 1.7) > -0.4;
    rect(
      env,
      x + 2 + i * 7,
      y - 28 + Math.round(Math.sin(i * 0.9) * 2),
      2,
      2,
      on ? '#ffe28a' : '#6b5a2a',
    );
  }
}

function crates(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 2, y, 44, 3, 'rgba(0,0,0,0.2)');
  const box = (bx: number, by: number, w: number, h: number): void => {
    rect(env, bx - 1, by - 1, w + 2, h + 2, OUTLINE);
    rect(env, bx, by, w, h, '#a8793a');
    rect(env, bx, by, w, 1, '#c99555');
    for (let i = 1; i < 3; i++) rect(env, bx, by + Math.round((h * i) / 3), w, 1, '#6b4119');
    rect(env, bx + 1, by + 1, 1, h - 2, '#6b4119');
    rect(env, bx + w - 2, by + 1, 1, h - 2, '#6b4119');
  };
  box(x, y - 14, 18, 14);
  box(x + 20, y - 12, 18, 12);
  box(x + 6, y - 26, 18, 12);
  // rede de pesca pendurada e boia
  rect(env, x + 30, y - 22, 6, 6, '#e63946');
  rect(env, x + 30, y - 20, 6, 2, '#f8f8f8');
  rect(env, x + 33, y - 28, 1, 6, '#d9d2c0');
}

/** Gaivota de pixel: asas que batem. */
function gull(env: SceneEnv, x: number, y: number, phase: number): void {
  const up = Math.sin(env.t * 6 + phase) > 0 ? 1 : 0;
  const color = env.time === 'night' ? '#8b94c8' : '#f4f4f4';
  rect(env, x, y, 2, 1, color);
  rect(env, x - 3, y - up, 3, 1, color);
  rect(env, x + 2, y - up, 3, 1, color);
  rect(env, x - 5, y - up * 2 + 1, 2, 1, color);
  rect(env, x + 5, y - up * 2 + 1, 2, 1, color);
}

function gulls(env: SceneEnv, count: number): void {
  for (let i = 0; i < count; i++) {
    const speed = 9 + i * 2;
    const span = SCENE_W + 60;
    const x = ((((env.t * speed + i * 97) % span) + span) % span) - 30;
    gull(env, x, 28 + i * 9 + Math.sin(env.t * 0.9 + i) * 3, i * 1.3);
  }
}

/** Barco a motor que cruza o mar da direita para a esquerda, deixando um rastro de espuma. */
function motorBoat(env: SceneEnv): void {
  const span = SCENE_W + 100;
  const x = Math.round(SCENE_W + 40 - ((env.t * 22) % span));
  const y = HORIZON + 22 + Math.round(Math.sin(env.t * 3));
  rect(env, x + 6, y, 36, 1, 'rgba(255,255,255,0.45)');
  rect(env, x + 12, y + 1, 26, 1, 'rgba(255,255,255,0.25)');
  rect(env, x - 11, y - 4, 22, 1, OUTLINE);
  rect(env, x - 10, y - 3, 20, 3, '#f4f4f4');
  rect(env, x - 10, y - 1, 20, 1, '#2d6cdf');
  rect(env, x - 9, y, 18, 1, OUTLINE);
  rect(env, x - 3, y - 9, 8, 6, OUTLINE);
  rect(env, x - 2, y - 8, 6, 4, '#bfe3f8');
  rect(env, x - 3, y - 10, 9, 1, '#e63946');
}

function dockedBoat(env: SceneEnv, x: number, y: number, hull: string, seed: number): void {
  const bob = Math.round(Math.sin(env.t * 1.5 + seed));
  const by = y + bob;
  rect(env, x - 12, by + 2, 24, 1, 'rgba(0,0,0,0.25)');
  rect(env, x - 12, by - 3, 24, 1, OUTLINE);
  rect(env, x - 11, by - 2, 22, 3, hull);
  rect(env, x - 9, by + 1, 18, 1, OUTLINE);
  rect(env, x - 4, by - 8, 7, 5, OUTLINE);
  rect(env, x - 3, by - 7, 5, 3, '#f4f4f4');
  rect(env, x + 6, by - 14, 1, 11, OUTLINE);
  rect(env, x + 6, by - 14, 6, 1, '#d9d2c0');
}

/** Ilha menor e mais distante, reaproveitando o desenho da ilha principal. */
function farIsland(env: SceneEnv, cx: number, scale: number): void {
  const { ctx } = env;
  ctx.save();
  ctx.translate(cx, HORIZON * (1 - scale));
  ctx.scale(scale, scale);
  island(env, 0);
  ctx.restore();
}

/** Poucos prédios da orla no horizonte, em três grupinhos; à noite, janelas acesas. */
const TOWERS: { x: number; w: number; h: number }[] = [
  { x: 14, w: 16, h: 30 },
  { x: 31, w: 20, h: 44 },
  { x: 53, w: 13, h: 24 },
  { x: 210, w: 18, h: 36 },
  { x: 229, w: 22, h: 52 },
  { x: 332, w: 15, h: 38 },
];

function skyline(env: SceneEnv, xOf: (world: number) => number): void {
  const random = rng(5);
  const tone = env.time === 'night' ? '#16203f' : env.time === 'morning' ? '#a58fa8' : '#8aa0b8';
  const edge = env.time === 'night' ? '#0e1630' : env.time === 'morning' ? '#8b7590' : '#728aa3';
  for (const { x: world, w, h } of TOWERS) {
    const x = xOf(world);
    rect(env, x, HORIZON - h, w, h + 1, tone);
    rect(env, x + w - 3, HORIZON - h, 3, h + 1, edge);
    if (random() > 0.5) rect(env, x + 3, HORIZON - h - 4, 2, 4, edge);
    for (let wy = HORIZON - h + 4; wy < HORIZON - 3; wy += 6) {
      for (let wx = x + 3; wx < x + w - 5; wx += 5) {
        const lit = env.time === 'night' && random() > 0.45;
        rect(env, wx, wy, 2, 3, lit ? '#ffe28a' : env.time === 'night' ? '#202c52' : '#b9c8d8');
      }
    }
  }
}

/** Farol numa ponta de pedra no horizonte; à noite o facho gira. */
function lighthouse(env: SceneEnv, cx: number): void {
  const { ctx } = env;
  rect(env, cx - 14, HORIZON - 4, 28, 6, '#5b5560');
  rect(env, cx - 10, HORIZON - 7, 20, 4, '#6f6874');
  for (let i = 0; i < 6; i++) {
    const w = 10 - i;
    rect(env, cx - w / 2 - 1, HORIZON - 12 - i * 4, w + 2, 4, OUTLINE);
    rect(env, cx - w / 2, HORIZON - 12 - i * 4, w, 4, i % 2 ? '#e63946' : '#f6f1e4');
  }
  rect(env, cx - 6, HORIZON - 38, 12, 3, OUTLINE);
  rect(env, cx - 4, HORIZON - 44, 8, 7, OUTLINE);
  rect(env, cx - 3, HORIZON - 43, 6, 5, env.time === 'night' ? '#fff3b0' : '#bfe3f8');
  rect(env, cx - 3, HORIZON - 47, 6, 3, '#e63946');
  if (env.time === 'night') {
    const dir = Math.sin(env.t * 0.9) > 0 ? 1 : -1;
    const reach = 70 + Math.abs(Math.cos(env.t * 0.9)) * 40;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(cx, HORIZON - 41);
    ctx.lineTo(cx + dir * reach, HORIZON - 52);
    ctx.lineTo(cx + dir * reach, HORIZON - 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Píer de madeira que entra no mar em perspectiva, com pilares e um poste de luz na ponta. */
function pier(env: SceneEnv, cx: number): void {
  const bottom = 160;
  const top = HORIZON + 14;
  for (let y = top; y <= bottom; y++) {
    const u = (y - top) / (bottom - top);
    const w = 12 + u * 34;
    const left = cx - w / 2;
    rect(env, left - 1, y, w + 2, 1, OUTLINE);
    rect(env, left, y, w, 1, (y - top) % 5 === 0 ? '#7a4f26' : '#b8803f');
  }
  for (let y = top + 6; y < bottom; y += 14) {
    const u = (y - top) / (bottom - top);
    const w = 12 + u * 34;
    for (const side of [-1, 1]) {
      rect(env, cx + side * (w / 2) - 1, y, 3, 8 + u * 6, OUTLINE);
      rect(env, cx + side * (w / 2), y, 1, 7 + u * 6, '#6b4119');
    }
  }
  rect(env, cx - 1, top - 22, 3, 24, OUTLINE);
  rect(env, cx - 3, top - 26, 7, 5, OUTLINE);
  rect(env, cx - 2, top - 25, 5, 3, env.time === 'night' ? '#ffe9a8' : '#cfd8e6');
}

/** Bandeirinhas penduradas entre dois pontos (as copas de dois coqueiros), com a barriga do varal. */
function bunting(env: SceneEnv, x0: number, y0: number, x1: number, y1: number, sag: number): void {
  const colors = ['#e63946', '#ffc93c', '#2a9d8f', '#ff7a2e', '#6aa8e0', '#ff6fa8'];
  const steps = Math.max(2, Math.round(Math.abs(x1 - x0) / 8));
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = x0 + (x1 - x0) * u;
    const cy = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag;
    if (x < -10 || x > SCENE_W + 10) continue;
    rect(env, x, cy, 2, 1, OUTLINE);
    if (i % 2 === 0) {
      const color = colors[(i / 2) % colors.length] ?? '#e63946';
      const swing = Math.round(Math.sin(env.t * 2 + i));
      rect(env, x - 1 + swing, cy + 1, 5, 2, color);
      rect(env, x + swing, cy + 3, 3, 2, color);
      rect(env, x + 1 + swing, cy + 5, 1, 1, color);
    }
  }
}

/** Liga a copa de cada coqueiro à do próximo (na jornada, o último liga ao primeiro do ciclo). */
function palmBunting(env: SceneEnv, list: Prop[]): void {
  const palms = list.filter((p): p is Extract<Prop, { k: 'palm' }> => p.k === 'palm');
  palms.sort((a, b) => a.x - b.x);
  const crown = (p: Extract<Prop, { k: 'palm' }>, x: number): [number, number] => [
    x + p.lean * 15,
    p.y - 84 + 12,
  ];
  palms.forEach((palm, i) => {
    const wraps = i === palms.length - 1;
    const next = wraps ? palms[0] : palms[i + 1];
    if (!next || (wraps && !env.journey)) return;
    const gap = wraps ? next.x + JOURNEY_PERIOD - palm.x : next.x - palm.x;
    const start = env.journey ? scrolled(palm.x, env.scroll, JOURNEY_PERIOD) : palm.x;
    const [x0, y0] = crown(palm, start);
    const [x1, y1] = crown(next, start + gap);
    bunting(env, x0, y0, x1, y1, 14);
  });
}

/** Fogos de artifício no céu da noite: cada explosão abre, cai e some. */
function fireworks(env: SceneEnv): void {
  if (env.time !== 'night') return;
  const bursts: [number, number, string, number][] = [
    [88, 38, '#ff6fa8', 0],
    [196, 26, '#ffd43b', 1.1],
    [300, 46, '#6aa8e0', 2.1],
  ];
  for (const [bx, by, color, offset] of bursts) {
    const p = ((env.t + offset) % 3.3) / 3.3;
    if (p > 0.75) continue;
    const radius = Math.min(1, p * 2.2) * 26;
    const fall = p * p * 16;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const fade = 1 - p / 0.75;
      env.ctx.globalAlpha = Math.max(0, fade);
      rect(env, bx + Math.cos(a) * radius, by + Math.sin(a) * radius + fall, 2, 2, color);
    }
    env.ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------------------------
// Objetos da areia de cada nível
// ---------------------------------------------------------------------------------------------

type Prop =
  | { k: 'palm'; x: number; y: number; lean: number }
  | { k: 'chair'; x: number; y: number }
  | { k: 'towel'; x: number; y: number; w: number; h: number }
  | { k: 'cooler'; x: number; y: number }
  | { k: 'fire'; x: number; y: number }
  | { k: 'kiosk'; x: number; y: number; awning: string }
  | { k: 'umbrella'; x: number; y: number; color: string }
  | { k: 'lamp'; x: number; y: number }
  | { k: 'bench'; x: number; y: number }
  | { k: 'torch'; x: number; y: number }
  | { k: 'bonfire'; x: number; y: number }
  | { k: 'tiki'; x: number; y: number }
  | { k: 'crates'; x: number; y: number };

const SL = SAND_LANE;
const RED = '#e63946';
const BLUE = '#2d6cdf';

/** Posições no quadro do QG (personagem parado), de trás para a frente. */
const QG_PROPS: Record<number, Prop[]> = {
  1: [
    { k: 'palm', x: 40, y: 200, lean: 1.6 },
    { k: 'palm', x: 346, y: 204, lean: -1.8 },
    { k: 'palm', x: 372, y: 196, lean: -1 },
    { k: 'towel', x: 70, y: 178, w: 58, h: 17 },
    { k: 'cooler', x: 142, y: 180 },
    { k: 'chair', x: 306, y: 196 },
    { k: 'fire', x: 259, y: 196 },
  ],
  2: [
    { k: 'palm', x: 14, y: 204, lean: 1.5 },
    { k: 'kiosk', x: 40, y: 186, awning: RED },
    { k: 'palm', x: 144, y: 206, lean: 1.1 },
    { k: 'umbrella', x: 262, y: 188, color: RED },
    { k: 'towel', x: 242, y: 196, w: 40, h: 11 },
    { k: 'palm', x: 372, y: 200, lean: -1.6 },
    { k: 'umbrella', x: 324, y: 200, color: BLUE },
    { k: 'cooler', x: 104, y: 196 },
  ],
  3: [
    { k: 'palm', x: 22, y: 192, lean: 1.2 },
    { k: 'lamp', x: 62, y: 188 },
    { k: 'bench', x: 92, y: 190 },
    { k: 'lamp', x: 166, y: 188 },
    { k: 'kiosk', x: 292, y: 190, awning: '#2a9d8f' },
    { k: 'palm', x: 384, y: 194, lean: -1.2 },
  ],
  4: [
    { k: 'palm', x: 22, y: 204, lean: 1.4 },
    { k: 'crates', x: 62, y: 192 },
    { k: 'towel', x: 118, y: 196, w: 40, h: 11 },
    { k: 'chair', x: 352, y: 204 },
    { k: 'palm', x: 376, y: 200, lean: -1.4 },
  ],
  5: [
    { k: 'palm', x: 16, y: 198, lean: 1.5 },
    { k: 'torch', x: 60, y: 190 },
    { k: 'bonfire', x: 110, y: 208 },
    { k: 'torch', x: 164, y: 188 },
    { k: 'palm', x: 196, y: 202, lean: -1.2 },
    { k: 'tiki', x: 252, y: 176 },
    { k: 'palm', x: 374, y: 198, lean: -1.4 },
  ],
};

/** Posições no mundo da jornada (o cenário rola), numa faixa de `JOURNEY_PERIOD`. */
const JOURNEY_PROPS: Record<number, Prop[]> = {
  1: [
    { k: 'palm', x: 30, y: SL, lean: 1.6 },
    { k: 'chair', x: 140, y: SL + 6 },
    { k: 'towel', x: 180, y: SL - 12, w: 58, h: 14 },
    { k: 'palm', x: 330, y: SL + 4, lean: -1.4 },
    { k: 'chair', x: 420, y: SL + 6 },
    { k: 'chair', x: 462, y: SL + 6 },
    { k: 'palm', x: 560, y: SL, lean: 1.2 },
    { k: 'towel', x: 640, y: SL - 12, w: 58, h: 14 },
    { k: 'cooler', x: 712, y: SL - 10 },
    { k: 'fire', x: 520, y: SL + 4 },
  ],
  2: [
    { k: 'palm', x: 20, y: SL, lean: 1.5 },
    { k: 'kiosk', x: 90, y: SL + 6, awning: RED },
    { k: 'umbrella', x: 250, y: SL + 6, color: RED },
    { k: 'towel', x: 232, y: SL - 6, w: 40, h: 11 },
    { k: 'palm', x: 340, y: SL + 4, lean: -1.4 },
    { k: 'umbrella', x: 430, y: SL + 8, color: BLUE },
    { k: 'chair', x: 500, y: SL + 6 },
    { k: 'palm', x: 580, y: SL, lean: 1.2 },
    { k: 'kiosk', x: 650, y: SL + 6, awning: '#ffc93c' },
    { k: 'cooler', x: 760, y: SL - 6 },
  ],
  3: [
    { k: 'palm', x: 20, y: SL - 2, lean: 1.2 },
    { k: 'lamp', x: 110, y: SL + 4 },
    { k: 'bench', x: 170, y: SL + 6 },
    { k: 'kiosk', x: 270, y: SL + 8, awning: '#2a9d8f' },
    { k: 'lamp', x: 390, y: SL + 4 },
    { k: 'palm', x: 450, y: SL - 2, lean: -1.2 },
    { k: 'bench', x: 540, y: SL + 6 },
    { k: 'lamp', x: 670, y: SL + 4 },
    { k: 'kiosk', x: 720, y: SL + 8, awning: '#ff7a2e' },
  ],
  4: [
    { k: 'palm', x: 30, y: SL, lean: 1.4 },
    { k: 'crates', x: 110, y: SL + 8 },
    { k: 'towel', x: 250, y: SL - 6, w: 40, h: 11 },
    { k: 'palm', x: 360, y: SL + 4, lean: -1.4 },
    { k: 'crates', x: 470, y: SL + 8 },
    { k: 'chair', x: 580, y: SL + 6 },
    { k: 'palm', x: 650, y: SL, lean: 1.2 },
  ],
  5: [
    { k: 'palm', x: 20, y: SL, lean: 1.5 },
    { k: 'torch', x: 84, y: SL + 4 },
    { k: 'palm', x: 240, y: SL + 4, lean: -1.2 },
    { k: 'torch', x: 296, y: SL + 4 },
    { k: 'palm', x: 470, y: SL, lean: 1.3 },
    { k: 'torch', x: 470, y: SL + 4 },
    { k: 'palm', x: 700, y: SL + 4, lean: -1.4 },
  ],
};

const KIOSK_SCALE = 1.5;
const BENCH_SCALE = 1.5;
const TIKI_SCALE = 1.4;

/** Desenha um objeto maior, a partir do pé dele: o desenho é feito na origem e ampliado. */
function grown(env: SceneEnv, x: number, y: number, k: number, draw: () => void): void {
  env.ctx.save();
  env.ctx.translate(Math.round(x), Math.round(y));
  env.ctx.scale(k, k);
  draw();
  env.ctx.restore();
}

function drawProp(env: SceneEnv, prop: Prop, x: number): void {
  switch (prop.k) {
    case 'palm':
      return palm(env, x, prop.y, prop.lean);
    case 'chair':
      return beachChair(env, x, prop.y);
    case 'towel':
      return towel(env, x, prop.y, prop.w, prop.h);
    case 'cooler':
      return cooler(env, x, prop.y);
    case 'fire':
      if (env.time !== 'night') return;
      rect(env, x - 7, prop.y, 14, 3, '#5a3412');
      return flame(env, x, prop.y, 2);
    case 'kiosk':
      return grown(env, x, prop.y, KIOSK_SCALE, () => kiosk(env, 0, 0, prop.awning));
    case 'umbrella':
      return umbrella(env, x, prop.y, prop.color);
    case 'lamp':
      return lamp(env, x, prop.y);
    case 'bench':
      return grown(env, x, prop.y, BENCH_SCALE, () => bench(env, 0, 0));
    case 'torch':
      return torch(env, x, prop.y);
    case 'bonfire':
      return bonfire(env, x, prop.y);
    case 'tiki':
      return grown(env, x, prop.y, TIKI_SCALE, () => tiki(env, 0, 0));
    case 'crates':
      return crates(env, x, prop.y);
  }
}

/** Onde cada objeto acende à noite (e quanto), em relação ao seu x. */
function lightOf(prop: Prop, x: number): Light | null {
  switch (prop.k) {
    case 'fire':
      return { x, y: prop.y - 2, radius: 80, color: [255, 150, 60], intensity: 0.6, flicker: true };
    case 'bonfire':
      return {
        x,
        y: prop.y - 8,
        radius: 110,
        color: [255, 150, 60],
        intensity: 0.75,
        flicker: true,
      };
    case 'torch':
      return {
        x,
        y: prop.y - 32,
        radius: 52,
        color: [255, 160, 70],
        intensity: 0.5,
        flicker: true,
      };
    case 'lamp':
      return { x, y: prop.y - 42, radius: 74, color: [255, 225, 150], intensity: 0.55 };
    case 'kiosk':
      return {
        x: x + 24 * KIOSK_SCALE,
        y: prop.y - 22 * KIOSK_SCALE,
        radius: 80,
        color: [255, 200, 120],
        intensity: 0.45,
      };
    case 'tiki':
      return {
        x: x + 28 * TIKI_SCALE,
        y: prop.y - 22 * TIKI_SCALE,
        radius: 90,
        color: [255, 190, 110],
        intensity: 0.55,
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Cenário completo
// ---------------------------------------------------------------------------------------------

const SEA = {
  night: ['#0c2a55', '#0e3566', '#103f78'],
  morning: ['#3d8fb8', '#4aa4c4', '#5fb7d0'],
  afternoon: ['#1d78c2', '#2a90d6', '#3ba6e0'],
};

/** Posição de camadas distantes: quase paradas na jornada. */
const farXOf =
  (env: SceneEnv) =>
  (world: number): number =>
    env.journey ? scrolled(world, env.scroll, SCENE_W + 160, 0.04) : world;

function farSea(env: SceneEnv, level: number): void {
  const xOf = farXOf(env);
  switch (level) {
    case 2:
      island(env, xOf(110));
      farIsland(env, xOf(296), 0.7);
      break;
    case 3:
      skyline(env, xOf);
      break;
    case 4:
      lighthouse(env, xOf(78));
      break;
    default:
      island(env, xOf(138));
  }
}

/** Mundo do píer na jornada: o píer e os barcos amarrados passam juntos, e depois vem mar aberto. */
const PIER_WORLD = 430;
/** O píer aparece uma vez a cada tanto de caminhada: bem mais raro que o resto da praia. */
const PIER_PERIOD = 1900;

/** A fogueira com a turma também é rara na jornada: aparece uma vez por ciclo longo. */
const FIRE_WORLD = 160;
const FIRE_PERIOD = 1900;
const FIRE_Y = SAND_LANE - 8;
/** O bar de palha vem no mesmo ciclo, bem longe da fogueira (nunca perto dela). */
const TIKI_WORLD = FIRE_WORLD + 400;
const TIKI_Y = SAND_LANE - 6;
const fireCenter = (env: SceneEnv): number =>
  env.journey ? scrolled(FIRE_WORLD, env.scroll, FIRE_PERIOD) : 0;
const tikiCenter = (env: SceneEnv): number =>
  env.journey ? scrolled(TIKI_WORLD, env.scroll, FIRE_PERIOD) : 0;

/** Centro do píer na tela. */
const pierCenter = (env: SceneEnv): number =>
  env.journey ? scrolled(PIER_WORLD, env.scroll, PIER_PERIOD) : 302;

function nearSea(env: SceneEnv, level: number): void {
  if (level !== 4) boat(env);
  if (level === 2) motorBoat(env);
  if (level === 4) {
    const cx = pierCenter(env);
    dockedBoat(env, cx - 52, HORIZON + 30, '#2a6fb0', 1);
    dockedBoat(env, cx + 50, HORIZON + 36, '#c9742a', 2);
    dockedBoat(env, cx - 182, HORIZON + 14, '#b8392f', 3);
    // barco de pesca ao longe: anda devagar, como tudo que está longe
    const far = env.journey ? scrolled(200, env.scroll, JOURNEY_PERIOD, 0.3) : 200;
    dockedBoat(env, far, HORIZON + 8, '#d8a63a', 4);
  }
  gulls(env, level === 2 ? 2 : level === 4 ? 4 : level === 5 ? 2 : 0);
  if (level === 5) fireworks(env);
}

/** Calçadão de ondas pretas e brancas (como o de Copacabana); na jornada ele passa sob os pés. */
function promenade(env: SceneEnv): void {
  rect(env, 0, 150, SCENE_W, 3, '#b9a77a');
  rect(env, 0, 152, SCENE_W, 70, '#ece6da');
  const shift = env.journey ? env.scroll : 0;
  for (let row = 0; row < 12; row++) {
    const y = 158 + row * 6;
    for (let x = 0; x < SCENE_W; x += 2) {
      const bend = Math.round(Math.sin((x + shift) * 0.22 + row * 0.9) * 2);
      rect(env, x, y + bend, 2, 2, '#2c2c34');
    }
  }
  rect(env, 0, 152, SCENE_W, 1, 'rgba(0,0,0,0.25)');
}

function sand(env: SceneEnv): void {
  bands(env, 0, 145, SCENE_W, 75, ['#f1d9a0', '#ecd194', '#e6c987', '#dfc07c', '#d8b772']);
  const random = rng(11);
  if (env.journey) {
    // Grãos fixos no mundo: a areia parece passar sob os pés
    for (let i = 0; i < 70; i++) {
      const worldX = random() * JOURNEY_PERIOD;
      rect(
        env,
        scrolled(worldX, env.scroll, JOURNEY_PERIOD),
        150 + random() * 66,
        2,
        1,
        'rgba(120,80,30,0.25)',
      );
    }
    return;
  }
  for (let i = 0; i < 90; i++)
    rect(env, random() * SCENE_W, 150 + random() * 66, 2, 1, 'rgba(120,80,30,0.25)');
}

/** Desenha a praia no nível pedido, parada (QG) ou rolando (jornada). */
export function renderBeach(env: SceneEnv): void {
  const level = clampLevel(env.level);
  sky(env, 0, 0, SCENE_W, HORIZON);
  gradientRect(env, 0, HORIZON, SCENE_W, 44, SEA[env.time]);
  farSea(env, level);
  tileArea(
    env,
    env.tiles.water,
    0,
    160,
    0,
    HORIZON + 4,
    SCENE_W,
    38,
    env.journey ? env.t * 8 - env.scroll * 0.25 : env.t * 8,
  );
  rect(env, 0, HORIZON, SCENE_W, 1, 'rgba(255,255,255,0.35)');
  const reflect = env.time === 'night' ? '#cfd8ff' : '#fff2b8';
  const rx = env.time === 'morning' ? 86 : env.time === 'afternoon' ? 296 : 304;
  for (let i = 0; i < 7; i++) {
    rect(
      env,
      rx - 10 + ((Math.sin(env.t * 2 + i) * 3) | 0),
      HORIZON + 4 + i * 6,
      20 - i,
      2,
      reflect,
    );
  }
  nearSea(env, level);
  const foamY = 142 + ((Math.sin(env.t * 1.2) * 2) | 0);
  rect(env, 0, foamY, SCENE_W, 3, 'rgba(255,255,255,0.75)');
  if (level === 3) promenade(env);
  else sand(env);
  if (level === 4) pier(env, pierCenter(env));
  const list = (env.journey ? JOURNEY_PROPS : QG_PROPS)[level] ?? [];
  if (level === 5 && env.journey) {
    bonfire(env, fireCenter(env), FIRE_Y);
    drawProp(env, { k: 'tiki', x: 0, y: TIKI_Y }, tikiCenter(env));
  }
  for (const prop of list) {
    const x = env.journey ? scrolled(prop.x, env.scroll, JOURNEY_PERIOD) : prop.x;
    drawProp(env, prop, x);
  }
  if (level === 5) palmBunting(env, list);
  if (env.journey && env.arrivedFor !== null) portal(env, env.arrivedFor, SAND_LANE);
}

/** Luzes do nível: fogueira, postes, tochas e quiosques, mais o luar. */
export function beachLights(env: SceneEnv): Light[] {
  const level = clampLevel(env.level);
  const list = (env.journey ? JOURNEY_PROPS : QG_PROPS)[level] ?? [];
  const lights: Light[] = [];
  for (const prop of list) {
    const x = env.journey ? scrolled(prop.x, env.scroll, JOURNEY_PERIOD) : prop.x;
    const light = lightOf(prop, x);
    if (light) lights.push(light);
  }
  if (level === 4) {
    const lighthouseX = farXOf(env)(78);
    lights.push({
      x: lighthouseX,
      y: HORIZON - 42,
      radius: 70,
      color: [255, 235, 160],
      intensity: 0.6,
    });
    lights.push({
      x: pierCenter(env),
      y: HORIZON - 10,
      radius: 60,
      color: [255, 225, 150],
      intensity: 0.5,
    });
  }
  if (level === 5 && env.journey) {
    const light = lightOf({ k: 'bonfire', x: 0, y: FIRE_Y }, fireCenter(env));
    if (light) lights.push(light);
    const tiki = lightOf({ k: 'tiki', x: 0, y: TIKI_Y }, tikiCenter(env));
    if (tiki) lights.push(tiki);
  }
  lights.push({ x: 304, y: 30, radius: 300, color: [150, 175, 255], intensity: 0.38 });
  lights.push({ x: 195, y: 150, radius: 230, color: [140, 165, 240], intensity: 0.3 });
  return lights;
}

// ---------------------------------------------------------------------------------------------
// Gente na praia
// ---------------------------------------------------------------------------------------------

type Look = Partial<ExtraCharacter['selection']>;

const LOOKS: Look[] = [
  {
    bodyType: 'female',
    skin: 'amber',
    hair: 'hair-bangs-bun',
    hairColor: 'chestnut',
    torso: 'torso-sleeveless-2',
    torsoColor: 'rose',
    legs: 'legs-shorts',
    legsColor: 'sky',
    feet: null,
  },
  {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-buzzcut',
    hairColor: 'sandy',
    torso: 'torso-tshirt',
    torsoColor: 'white',
    legs: 'legs-shorts',
    legsColor: 'navy',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'brown',
    hair: 'hair-natural',
    hairColor: 'black',
    torso: 'torso-sleeveless-2',
    torsoColor: 'yellow',
    legs: 'legs-shorts',
    legsColor: 'white',
    feet: null,
  },
  {
    bodyType: 'male',
    skin: 'bronze',
    hair: 'hair-curly-short',
    hairColor: 'dark_brown',
    torso: 'torso-tshirt',
    torsoColor: 'teal',
    legs: 'legs-shorts',
    legsColor: 'orange',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'light',
    hair: 'hair-bob',
    hairColor: 'blonde',
    torso: 'torso-tshirt',
    torsoColor: 'red',
    legs: 'legs-leggings',
    legsColor: 'black',
    feet: null,
  },
  {
    bodyType: 'male',
    skin: 'olive',
    hair: null,
    hairColor: 'black',
    torso: 'torso-sleeveless-2',
    torsoColor: 'forest',
    legs: 'legs-shorts',
    legsColor: 'tan',
    feet: null,
  },
  {
    bodyType: 'female',
    skin: 'taupe',
    hair: 'hair-half-up',
    hairColor: 'raven',
    torso: 'torso-cardigan',
    torsoColor: 'lavender',
    legs: 'legs-pants',
    legsColor: 'white',
    feet: null,
  },
  {
    bodyType: 'male',
    skin: 'black',
    hair: 'hair-buzzcut',
    hairColor: 'black',
    torso: 'torso-tshirt',
    torsoColor: 'orange',
    legs: 'legs-shorts',
    legsColor: 'blue',
    feet: null,
  },
];

const still = (
  look: number,
  x: number,
  feetY: number,
  direction: ExtraCharacter['direction'],
): ExtraCharacter => ({
  x,
  feetY,
  anim: 'idle',
  direction,
  selection: LOOKS[look % LOOKS.length] ?? {},
});

const roam = (
  look: number,
  anim: 'walk' | 'run',
  from: number,
  to: number,
  speed: number,
  feetY: number,
): ExtraCharacter => ({
  x: from,
  feetY,
  anim,
  direction: 'right',
  selection: LOOKS[look % LOOKS.length] ?? {},
  patrol: { from, to, speed },
});

/** Quem está na praia em cada nível (só no QG; na jornada o cenário é que passa). */
export function beachExtras(level: number): ExtraCharacter[] {
  switch (clampLevel(level)) {
    case 2:
      return [still(0, 236, 186, 'up'), roam(1, 'walk', 70, 330, 14, 168)];
    case 3:
      return [
        roam(3, 'run', -20, 410, 62, 160),
        roam(2, 'walk', 40, 350, 15, 172),
        roam(6, 'walk', 58, 368, 11, 202),
        still(4, 246, 192, 'up'),
        still(7, 264, 192, 'up'),
      ];
    case 4:
      return [
        still(5, 264, 163, 'up'),
        still(7, 342, 166, 'up'),
        roam(0, 'walk', 40, 210, 12, 168),
      ];
    case 5:
      return [
        roam(1, 'run', 20, 380, 46, 164),
        roam(6, 'walk', 220, 370, 13, 172),
        still(2, 84, 208, 'right'),
        still(4, 140, 208, 'left'),
        still(3, 112, 192, 'down'),
        still(0, 330, 196, 'up'),
      ];
    default:
      return [];
  }
}

const drifter = (
  look: number,
  anim: 'walk' | 'run',
  world: number,
  drift: number,
  feetY: number,
): ExtraCharacter => ({
  x: world,
  feetY,
  anim,
  direction: drift >= 0 ? 'right' : 'left',
  selection: LOOKS[look % LOOKS.length] ?? {},
  drift,
});

/**
 * Quem está na praia durante a jornada. As posições são do mundo (que rola): quem está parado
 * passa pela tela junto com o cenário e quem anda se move um pouco mais devagar ou mais rápido.
 */
export function beachJourneyExtras(level: number): ExtraCharacter[] {
  const lane = SAND_LANE;
  switch (clampLevel(level)) {
    case 2:
      return [still(0, 300, lane + 14, 'up'), drifter(1, 'walk', 560, 14, lane + 4)];
    case 3:
      return [
        drifter(3, 'run', 200, 40, lane + 30),
        drifter(2, 'walk', 460, 15, lane + 8),
        still(4, 640, lane - 6, 'up'),
        still(7, 664, lane - 6, 'up'),
      ];
    case 4:
      return [
        { ...still(5, PIER_WORLD - 42, lane - 1, 'up'), period: PIER_PERIOD },
        { ...still(7, PIER_WORLD + 44, lane + 2, 'up'), period: PIER_PERIOD },
        drifter(0, 'walk', 120, 12, lane + 22),
        drifter(6, 'walk', 740, -10, lane + 26),
      ];
    case 5:
      return [
        { ...still(2, FIRE_WORLD - 28, lane - 10, 'right'), period: FIRE_PERIOD },
        { ...still(4, FIRE_WORLD + 28, lane - 10, 'left'), period: FIRE_PERIOD },
        drifter(6, 'walk', 400, 13, lane + 20),
        drifter(1, 'walk', 800, -11, lane + 24),
      ];
    default:
      return [];
  }
}
