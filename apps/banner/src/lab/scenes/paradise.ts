import { bands, disc, rect, rng, sky, sprite, tileArea } from './draw';
import type { SceneDef, SceneEnv } from './types';
import { SCENE_W } from './types';

const HORIZON = 104;

function flowers(env: SceneEnv): void {
  const random = rng(17);
  const colors = ['#ff6fa8', '#ffd23f', '#ffffff', '#9b7bff', '#ff8a3d'];
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(random() * SCENE_W);
    const y = 140 + Math.floor(random() * 76);
    rect(env, x, y, 2, 2, colors[i % colors.length] ?? '#fff');
    rect(env, x, y + 2, 1, 2, '#2f9a4a');
  }
}

function butterflies(env: SceneEnv): void {
  if (env.time === 'night') return;
  for (let i = 0; i < 4; i++) {
    const x = 60 + i * 80 + Math.sin(env.t * 0.9 + i) * 30;
    const y = 140 + Math.cos(env.t * 1.3 + i * 2) * 14 + i * 6;
    const flap = Math.sin(env.t * 14 + i) > 0 ? 3 : 1;
    rect(env, x - flap, y, flap, 2, '#ff8fd0');
    rect(env, x + 1, y, flap, 2, '#ff8fd0');
    rect(env, x, y, 1, 3, '#3b2a4a');
  }
}

function fireflies(env: SceneEnv): void {
  if (env.time !== 'night') return;
  const random = rng(31);
  for (let i = 0; i < 18; i++) {
    const bx = random() * SCENE_W;
    const by = 130 + random() * 80;
    const x = bx + Math.sin(env.t * 0.8 + i) * 10;
    const y = by + Math.cos(env.t * 1.1 + i * 1.7) * 8;
    if (Math.sin(env.t * 3 + i * 2) > -0.2) rect(env, x, y, 2, 2, '#d8ff6a');
  }
}

export const paradise: SceneDef = {
  id: 'paradise',
  name: 'Paraíso',
  blurb: 'Campo florido com lago, árvores e borboletas; vaga-lumes à noite.',
  groundY: 180,
  back(env) {
    sky(env, 0, 0, SCENE_W, HORIZON);
    // Raios de sol de manhã e à tarde
    if (env.time !== 'night') {
      for (let i = 0; i < 4; i++) rect(env, 60 + i * 70, 0, 14, HORIZON, 'rgba(255,255,220,0.1)');
    }
    // Colinas ao fundo
    const hill = env.time === 'night' ? ['#12343a', '#0f2c34'] : ['#5fbf7a', '#47a863'];
    for (let x = 0; x < SCENE_W; x += 2) {
      rect(env, x, HORIZON - 14 + Math.sin(x / 28) * 10, 2, 40, hill[0] ?? '#5fbf7a');
      rect(env, x, HORIZON - 2 + Math.sin(x / 19 + 2) * 7, 2, 40, hill[1] ?? '#47a863');
    }
    // Campo
    tileArea(env, env.tiles.grass, 0, 160, 0, HORIZON + 12, SCENE_W, 120);
    bands(env, 0, HORIZON + 12, SCENE_W, 30, [
      'rgba(255,255,255,0.12)',
      'rgba(255,255,255,0.06)',
      'rgba(255,255,255,0)',
    ]);
    // Lago
    tileArea(env, env.tiles.water, 0, 160, 18, 156, 118, 52, env.t * 6);
    rect(env, 14, 154, 126, 3, '#6b4a2a');
    rect(env, 14, 206, 126, 3, '#6b4a2a');
    disc(env, 52, 176, 5, '#46c25f');
    disc(env, 52, 175, 2, '#ff8fd0');
    // Árvores (pinheiros e arbustos do pacote)
    sprite(env, env.tiles.treetop, 4, 101, 85, 107, 276, 52);
    sprite(env, env.tiles.treetop, 102, 101, 85, 107, 332, 78);
    sprite(env, env.tiles.treetop, 1, 0, 94, 96, 290, 128);
    flowers(env);
    butterflies(env);
    fireflies(env);
  },
  lights: () => [
    { x: 80, y: 176, radius: 90, color: [160, 255, 200], intensity: 0.3, at: ['night'] },
  ],
  tint: {
    morning: { color: '#fff0d0', alpha: 0.12 },
    afternoon: { color: '#ffffff', alpha: 0 },
    night: { color: '#2b4a8f', alpha: 0.5 },
  },
};
