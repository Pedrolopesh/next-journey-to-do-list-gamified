import { glow, gradientRect, rect, rng, tileArea } from './draw';
import type { SceneDef, SceneEnv } from './types';
import { SCENE_W } from './types';

const SKY_BY_TIME = {
  morning: ['#3a0c10', '#58121a', '#7d1c1c', '#a52c1c', '#cf4a1c', '#e8702a'],
  afternoon: ['#5a0e0e', '#8a1a12', '#b52a12', '#dd4414', '#f26a1c', '#ff9a3c'],
  night: ['#0a0305', '#14060a', '#200a0c', '#2e0f0d', '#44160e', '#5c1d0f'],
} as const;

function embers(env: SceneEnv): void {
  const random = rng(77);
  for (let i = 0; i < 40; i++) {
    const baseX = random() * SCENE_W;
    const speed = 8 + random() * 14;
    const y = 220 - ((env.t * speed + random() * 220) % 220);
    const x = baseX + Math.sin(env.t + i) * 6;
    rect(env, x, y, 2, 2, i % 3 ? '#ff8a2a' : '#ffd24a');
  }
}

function skull(env: SceneEnv, x: number, y: number): void {
  rect(env, x, y, 12, 10, '#e8e0cc');
  rect(env, x + 2, y + 10, 8, 4, '#d4ccb8');
  rect(env, x + 2, y + 3, 3, 3, '#1a0505');
  rect(env, x + 7, y + 3, 3, 3, '#1a0505');
  rect(env, x + 5, y + 7, 2, 2, '#1a0505');
}

export const hell: SceneDef = {
  id: 'hell',
  name: 'Inferno',
  blurb: 'Rio de lava, rochas escuras e brasas subindo; o céu arde em vermelho.',
  groundY: 182,
  back(env) {
    gradientRect(env, 0, 0, SCENE_W, 126, [...SKY_BY_TIME[env.time]]);
    const sunY = env.time === 'morning' ? 96 : 40;
    glow(env, 300, sunY, 80, env.time === 'night' ? [200, 40, 30] : [255, 150, 60], 0.6);
    const orb = env.ctx.createRadialGradient(300, sunY, 0, 300, sunY, 14);
    orb.addColorStop(0, env.time === 'night' ? '#d83a2a' : '#fff0b0');
    orb.addColorStop(1, env.time === 'night' ? '#7a1414' : '#ff9a3c');
    env.ctx.fillStyle = orb;
    env.ctx.beginPath();
    env.ctx.arc(300, sunY, 14, 0, Math.PI * 2);
    env.ctx.fill();
    // Montanhas pontiagudas (triângulos apontando para cima)
    const random = rng(41);
    const rock = env.time === 'night' ? '#14060a' : '#2a0b0b';
    env.ctx.fillStyle = rock;
    for (let x = -10; x < SCENE_W + 30; x += 36) {
      const h = 40 + random() * 50;
      env.ctx.beginPath();
      env.ctx.moveTo(x - 6, 126);
      env.ctx.lineTo(x + 8, 126 - h * 0.7);
      env.ctx.lineTo(x + 18, 126 - h);
      env.ctx.lineTo(x + 27, 126 - h * 0.6);
      env.ctx.lineTo(x + 44, 126);
      env.ctx.fill();
    }
    // Rio de lava animado
    tileArea(env, env.tiles.lava, 0, 160, 0, 126, SCENE_W, 34, env.t * 14);
    rect(env, 0, 126, SCENE_W, 2, '#ffb347');
    // Chão de rocha
    tileArea(env, env.tiles.lavarock, 0, 160, 0, 160, SCENE_W, 70);
    rect(env, 0, 158, SCENE_W, 2, 'rgba(0,0,0,0.5)');
    // Rachaduras brilhantes
    const cracks = rng(8);
    for (let i = 0; i < 9; i++) {
      const x = cracks() * SCENE_W;
      const y = 166 + cracks() * 50;
      rect(env, x, y, 12 + cracks() * 18, 1, '#ff7a1a');
    }
    skull(env, 40, 176);
    skull(env, 316, 190);
    // Tridente fincado
    rect(env, 352, 128, 3, 60, '#3a2a2a');
    rect(env, 346, 124, 15, 3, '#3a2a2a');
    rect(env, 346, 116, 3, 10, '#3a2a2a');
    rect(env, 352, 112, 3, 14, '#3a2a2a');
    rect(env, 358, 116, 3, 10, '#3a2a2a');
    embers(env);
  },
  lights: () => [
    {
      x: 100,
      y: 144,
      radius: 120,
      color: [255, 110, 30],
      intensity: 0.55,
      flicker: true,
      at: ['morning', 'afternoon', 'night'],
    },
    {
      x: 300,
      y: 144,
      radius: 120,
      color: [255, 110, 30],
      intensity: 0.55,
      flicker: true,
      at: ['morning', 'afternoon', 'night'],
    },
  ],
  tint: {
    morning: { color: '#ff8a70', alpha: 0.3 },
    afternoon: { color: '#ff9a50', alpha: 0.2 },
    night: { color: '#8a1830', alpha: 0.5 },
  },
};
