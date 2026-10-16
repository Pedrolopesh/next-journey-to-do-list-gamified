import { rect } from './draw';
import type { SceneEnv } from './types';
import { SCENE_W } from './types';

export const HORIZON = 98;

export const OUTLINE = '#1c1410';

/** Distância entre repetições dos objetos da areia na jornada. */
export const JOURNEY_PERIOD = 820;
export const SAND_LANE = 164;

/** Ilha pequena no horizonte: morro verde com uma palmeirinha, em tom esmaecido pela distância. */
export function island(env: SceneEnv, cx: number): void {
  const { ctx } = env;
  const hill = env.time === 'morning' ? '#5f8f86' : '#3f8a63';
  const shade = env.time === 'morning' ? '#4d7a74' : '#2e6c4d';
  ctx.fillStyle = hill;
  ctx.beginPath();
  ctx.moveTo(cx - 24, HORIZON + 2);
  ctx.quadraticCurveTo(cx - 14, HORIZON - 10, cx - 4, HORIZON - 12);
  ctx.quadraticCurveTo(cx + 8, HORIZON - 14, cx + 16, HORIZON - 5);
  ctx.quadraticCurveTo(cx + 22, HORIZON - 1, cx + 26, HORIZON + 2);
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(cx - 4, HORIZON - 12);
  ctx.quadraticCurveTo(cx + 8, HORIZON - 14, cx + 16, HORIZON - 5);
  ctx.quadraticCurveTo(cx + 22, HORIZON - 1, cx + 26, HORIZON + 2);
  ctx.lineTo(cx + 4, HORIZON + 2);
  ctx.fill();
  // faixa de areia na base e palmeirinha
  rect(env, cx - 22, HORIZON, 46, 2, '#e8d49a');
  rect(env, cx + 8, HORIZON - 16, 1, 8, '#4a2c0e');
  ctx.fillStyle = '#2f9e52';
  for (const [dx, dy] of [
    [-4, 0],
    [4, 0],
    [-3, -3],
    [3, -3],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(cx + 8 + dx, HORIZON - 16 + dy, 3.5, 1.2, dx * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Veleiro que cruza o horizonte devagar, da esquerda para a direita, e recomeça. */
export function boat(env: SceneEnv): void {
  const span = SCENE_W + 80;
  const x = Math.round(((env.t * 8) % span) - 40);
  const y = HORIZON + 9 + Math.round(Math.sin(env.t * 1.6));
  // reflexo na água
  rect(env, x - 9, y + 1, 18, 1, 'rgba(0,0,0,0.22)');
  // casco
  rect(env, x - 11, y - 3, 22, 1, OUTLINE);
  rect(env, x - 10, y - 2, 20, 2, '#b8392f');
  rect(env, x - 8, y, 16, 1, '#7a4a22');
  rect(env, x - 9, y + 1, 18, 1, OUTLINE);
  // mastro
  rect(env, x, y - 24, 1, 21, OUTLINE);
  // vela grande e buja
  for (let i = 0; i < 19; i++) {
    const w = Math.round(i * 0.5) + 1;
    rect(env, x + 1, y - 22 + i, w, 1, i % 6 === 5 ? '#d9d2c0' : '#f6f1e4');
  }
  for (let i = 0; i < 14; i++) {
    const w = Math.round(i * 0.45) + 1;
    rect(env, x - w, y - 18 + i, w, 1, '#e9e2d0');
  }
  rect(env, x + 1, y - 26, 4, 2, '#e63946'); // bandeirinha
  rect(env, x, y - 26, 1, 2, OUTLINE);
}

/** Toalha vermelha esticada na areia (em perspectiva), com listras e franjas. */
export function towel(env: SceneEnv, x: number, y: number, w: number, h: number): void {
  for (let row = 0; row < h; row++) {
    const grow = Math.round((row / h) * 6);
    const left = x - grow;
    const width = w + grow * 2;
    rect(env, left - 1, y + row, width + 2, 1, '#4a1410');
    rect(env, left, y + row, width, 1, row === h - 1 ? '#8f2a24' : '#d63a35');
    rect(env, left + 7, y + row, 3, 1, '#f6efe0');
    rect(env, left + width - 10, y + row, 3, 1, '#f6efe0');
  }
  rect(env, x - 1, y - 1, w + 2, 1, '#4a1410');
  rect(env, x, y, w, 1, '#ef6a63');
  for (let fx = x - 6; fx < x + w + 6; fx += 2) rect(env, fx, y + h, 1, 2, '#f1e6c8');
}

/** Cooler azul e branco com copo de drink em cima. */
export function cooler(env: SceneEnv, x: number, y: number): void {
  rect(env, x - 1, y - 1, 26, 18, '#10243a');
  rect(env, x, y + 5, 24, 11, '#3b82c4');
  rect(env, x, y + 5, 24, 1, '#6aa8e0');
  rect(env, x, y + 15, 24, 1, '#2a5f94');
  rect(env, x, y, 24, 5, '#f4f4f4'); // tampa
  rect(env, x, y + 4, 24, 1, '#c9d2dc');
  rect(env, x + 9, y - 3, 6, 2, OUTLINE); // alça
  rect(env, x + 10, y - 2, 4, 1, '#9aa7b4');
  rect(env, x + 10, y + 6, 4, 3, '#e8c46a'); // trava
  // drink: copo, líquido, canudo, limão e guarda-chuva
  const gx = x + 15;
  const gy = y - 9;
  rect(env, gx - 1, gy - 1, 8, 10, OUTLINE);
  rect(env, gx, gy, 6, 9, 'rgba(225,242,255,0.9)');
  rect(env, gx, gy + 3, 6, 5, '#ff7a2e');
  rect(env, gx, gy + 3, 6, 1, '#ffb35c');
  rect(env, gx + 4, gy - 5, 1, 8, '#e63946'); // canudo
  rect(env, gx + 2, gy - 5, 3, 1, '#e63946');
  rect(env, gx + 5, gy - 1, 3, 3, '#ffc93c'); // fatia de limão
  rect(env, gx - 3, gy - 6, 5, 1, '#ff6fa8'); // guarda-chuvinha
  rect(env, gx - 2, gy - 7, 3, 1, '#ff6fa8');
  rect(env, gx - 1, gy - 5, 1, 4, OUTLINE);
}

/** Cadeira de praia vista por trás, virada para o mar: encosto listrado, braços e pés. */
export function beachChair(env: SceneEnv, cx: number, baseY: number): void {
  const { ctx } = env;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 16, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // pés e braços de madeira
  rect(env, cx - 14, baseY - 14, 3, 14, OUTLINE);
  rect(env, cx + 11, baseY - 14, 3, 14, OUTLINE);
  rect(env, cx - 13, baseY - 14, 1, 13, '#b8803f');
  rect(env, cx + 12, baseY - 14, 1, 13, '#b8803f');
  rect(env, cx - 15, baseY - 24, 5, 3, OUTLINE);
  rect(env, cx + 10, baseY - 24, 5, 3, OUTLINE);
  rect(env, cx - 14, baseY - 23, 3, 1, '#d09a58');
  rect(env, cx + 11, baseY - 23, 3, 1, '#d09a58');
  // assento (parte que aparece abaixo do encosto)
  rect(env, cx - 12, baseY - 13, 24, 8, OUTLINE);
  for (let i = 0; i < 6; i++)
    rect(env, cx - 11 + i * 4, baseY - 12, 4, 6, i % 2 ? '#2a5fc0' : '#f4f4f4');
  // encosto listrado
  rect(env, cx - 13, baseY - 38, 26, 27, OUTLINE);
  for (let i = 0; i < 6; i++) {
    rect(env, cx - 12 + i * 4, baseY - 37, 4, 25, i % 2 ? '#2d6cdf' : '#f8f8f8');
    rect(env, cx - 12 + i * 4, baseY - 37, 4, 1, i % 2 ? '#5b95f0' : '#ffffff');
  }
  rect(env, cx - 12, baseY - 13, 24, 1, '#1d3f80');
}

/** Folhas do coqueiro: lado (-1 a 1), quanto sobem e quanto o ponto da ponta cai. */
const FRONDS: { side: number; rise: number; drop: number; shade: number }[] = [
  { side: -1, rise: 8, drop: 20, shade: 0 },
  { side: 1, rise: 8, drop: 20, shade: 1 },
  { side: -0.8, rise: 20, drop: 4, shade: 1 },
  { side: 0.8, rise: 20, drop: 4, shade: 0 },
  { side: -0.38, rise: 26, drop: -6, shade: 0 },
  { side: 0.38, rise: 26, drop: -6, shade: 1 },
  { side: -0.95, rise: 4, drop: 30, shade: 1 },
  { side: 0.95, rise: 4, drop: 30, shade: 0 },
];

/**
 * Coqueiro: tronco alto e curvo, mais grosso na base, com anéis; copa de folhas compridas que
 * pendem, cada uma com folíolos dos dois lados, e um cacho de cocos embaixo.
 */
export function palm(env: SceneEnv, x: number, baseY: number, lean: number): void {
  const { ctx } = env;
  const topX = x + lean * 15;
  const topY = baseY - 84;
  const bendX = x + lean * 2;
  const bendY = baseY - 46;
  const at = (u: number): [number, number] => [
    (1 - u) * (1 - u) * x + 2 * (1 - u) * u * bendX + u * u * topX,
    (1 - u) * (1 - u) * baseY + 2 * (1 - u) * u * bendY + u * u * topY,
  ];
  // tronco: contorno escuro por baixo e faixas claras e escuras por cima
  const SEGMENTS = 28;
  for (const pass of [0, 1]) {
    for (let i = 0; i < SEGMENTS; i++) {
      const [x1, y1] = at(i / SEGMENTS);
      const [x2, y2] = at((i + 1) / SEGMENTS);
      const flare = i < 3 ? (3 - i) * 1.4 : 0;
      const width = 7.5 - (i / SEGMENTS) * 3.5 + flare;
      ctx.strokeStyle = pass === 0 ? '#2a1a12' : i % 3 === 0 ? '#6b4119' : '#9a6a34';
      ctx.lineWidth = pass === 0 ? width + 2 : width;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  // brilho do lado da luz
  ctx.strokeStyle = 'rgba(255,220,160,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= SEGMENTS; i++) {
    const [px, py] = at(i / SEGMENTS);
    if (i === 0) ctx.moveTo(px + 1.5, py);
    else ctx.lineTo(px + 1.5 - (i / SEGMENTS) * 0.8, py);
  }
  ctx.stroke();

  const sway = Math.sin(env.t * 1.4 + x) * 2.5;
  ctx.lineCap = 'round';
  FRONDS.forEach((frond, index) => {
    const len = 36 + (index % 2) * 3;
    const tipX = topX + frond.side * len + sway * Math.abs(frond.side);
    const tipY = topY - frond.rise * 0.2 + frond.drop;
    const midX = topX + frond.side * len * 0.55;
    const midY = topY - frond.rise;
    const rib = (u: number): [number, number] => [
      (1 - u) * (1 - u) * topX + 2 * (1 - u) * u * midX + u * u * tipX,
      (1 - u) * (1 - u) * topY + 2 * (1 - u) * u * midY + u * u * tipY,
    ];
    const dark = frond.shade ? '#237a3c' : '#1c6b34';
    const light = frond.shade ? '#3fb55c' : '#35a04f';
    // folíolos: pequenos traços que saem da nervura e pendem
    for (const [color, width] of [
      [dark, 2],
      [light, 1],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let k = 1; k <= 10; k++) {
        const u = k / 10.5;
        const [px, py] = rib(u);
        const [qx, qy] = rib(Math.min(1, u + 0.05));
        const tx = qx - px;
        const ty = qy - py;
        const norm = Math.hypot(tx, ty) || 1;
        const l = 10 * (1 - u * 0.65);
        for (const sign of [-1, 1]) {
          const ex = px + (-ty / norm) * sign * l * 0.55;
          const ey = py + (tx / norm) * sign * l * 0.55 + l * 0.7;
          ctx.moveTo(px, py);
          ctx.lineTo(ex, ey);
        }
      }
      ctx.stroke();
    }
    // nervura central
    ctx.strokeStyle = '#7bd88f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  });
  // cocos
  for (const [dx, dy] of [
    [-3.5, 4],
    [3.5, 4.5],
    [0, 7],
  ] as const) {
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath();
    ctx.arc(topX + dx, topY + dy, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a1e';
    ctx.beginPath();
    ctx.arc(topX + dx, topY + dy, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b07a3c';
    ctx.fillRect(topX + dx - 1.4, topY + dy - 1.4, 1.2, 1.2);
  }
}
