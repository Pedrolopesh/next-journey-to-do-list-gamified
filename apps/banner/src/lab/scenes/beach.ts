import { bands, flame, gradientRect, rect, rng, sky, tileArea } from './draw';
import type { SceneDef, SceneEnv } from './types';
import { SCENE_W } from './types';

const HORIZON = 98;

/** Palmeira em vetor: tronco curvo e fino no topo, folhas arqueadas que balançam. */
function palm(env: SceneEnv, x: number, baseY: number, lean: number): void {
  const { ctx } = env;
  const topX = x + lean * 15;
  const topY = baseY - 84;
  const bendX = x + lean * 2;
  const bendY = baseY - 46;
  const at = (u: number): [number, number] => [
    (1 - u) * (1 - u) * x + 2 * (1 - u) * u * bendX + u * u * topX,
    (1 - u) * (1 - u) * baseY + 2 * (1 - u) * u * bendY + u * u * topY,
  ];
  // tronco: segmentos que afinam para cima, com anéis
  for (let i = 0; i < 24; i++) {
    const [x1, y1] = at(i / 24);
    const [x2, y2] = at((i + 1) / 24);
    ctx.strokeStyle = i % 3 === 0 ? '#6b4119' : '#8a5a2a';
    ctx.lineWidth = 7 - (i / 24) * 3.2;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  const sway = Math.sin(env.t * 1.4 + x) * 2.5;
  const leaves: [number, number][] = [
    [-34, 6],
    [-24, -10],
    [-8, -16],
    [10, -15],
    [26, -9],
    [35, 7],
    [0, -4],
  ];
  leaves.forEach(([dx, dy], i) => {
    const tipX = topX + dx + sway * (Math.abs(dx) / 30);
    const tipY = topY + dy + 14 + Math.abs(dx) * 0.28;
    const midX = topX + dx * 0.55;
    const midY = topY + dy - 8;
    ctx.fillStyle = i % 2 ? '#2a9d4a' : '#1f7a3a';
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY - 3, tipX, tipY);
    ctx.quadraticCurveTo(midX, midY + 5, topX, topY + 2);
    ctx.fill();
    ctx.strokeStyle = '#5fd07a';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
  });
  ctx.fillStyle = '#4a2c0e';
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath();
    ctx.arc(topX + dx, topY + 4, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const beach: SceneDef = {
  id: 'beach',
  name: 'Praia',
  blurb: 'Areia, mar e palmeiras; o nascer e o pôr do sol aparecem no horizonte.',
  groundY: 176,
  back(env) {
    sky(env, 0, 0, SCENE_W, HORIZON);
    // Mar com faixas e ondas
    const sea =
      env.time === 'night'
        ? ['#0c2a55', '#0e3566', '#103f78']
        : env.time === 'morning'
          ? ['#3d8fb8', '#4aa4c4', '#5fb7d0']
          : ['#1d78c2', '#2a90d6', '#3ba6e0'];
    gradientRect(env, 0, HORIZON, SCENE_W, 44, sea);
    tileArea(env, env.tiles.water, 0, 160, 0, HORIZON + 4, SCENE_W, 38, env.t * 8);
    rect(env, 0, HORIZON, SCENE_W, 1, 'rgba(255,255,255,0.35)');
    // Reflexo do sol/lua
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
    // Espuma
    const foamY = 142 + ((Math.sin(env.t * 1.2) * 2) | 0);
    rect(env, 0, foamY, SCENE_W, 3, 'rgba(255,255,255,0.75)');
    // Areia
    bands(env, 0, 145, SCENE_W, 75, ['#f1d9a0', '#ecd194', '#e6c987', '#dfc07c', '#d8b772']);
    const random = rng(11);
    for (let i = 0; i < 90; i++)
      rect(env, random() * SCENE_W, 150 + random() * 66, 2, 1, 'rgba(120,80,30,0.25)');
    palm(env, 40, 200, 1.6);
    palm(env, 346, 204, -1.8);
    palm(env, 372, 196, -1);
    // Toalha
    rect(env, 96, 184, 36, 14, '#e8423f');
    rect(env, 96, 188, 36, 3, '#ffffff');
    // Fogueirinha à noite
    if (env.time === 'night') {
      rect(env, 266, 192, 14, 3, '#5a3412');
      flame(env, 273, 192, 2);
    }
  },
  lights: () => [
    { x: 273, y: 190, radius: 80, color: [255, 150, 60], intensity: 0.6, flicker: true },
  ],
  tint: {
    morning: { color: '#ffd9b3', alpha: 0.22 },
    afternoon: { color: '#fffbe8', alpha: 0.05 },
    night: { color: '#3a4aa0', alpha: 0.55 },
  },
};
