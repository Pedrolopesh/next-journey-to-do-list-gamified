import { bands, flame, rect, sky, sprite, tileArea } from './draw';
import type { SceneDef } from './types';
import { SCENE_W } from './types';

const WALL = 112;

export const cabin: SceneDef = {
  id: 'cabin',
  name: 'Cabana',
  blurb: 'Interior de madeira com janela: o céu lá fora mostra a hora do dia.',
  groundY: 172,
  back(env) {
    const { ctx, tiles } = env;
    tileArea(env, tiles.inside, 0, 128, 0, 0, SCENE_W, 220);
    rect(env, 0, 0, SCENE_W, WALL, 'rgba(20,8,0,0.45)');
    rect(env, 0, WALL - 6, SCENE_W, 6, '#2a1608');
    rect(env, 0, 0, SCENE_W, 6, '#1a0d04');

    // Janela com céu
    sky(env, 168, 24, 54, 52);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(163, 19, 64, 5);
    ctx.fillRect(163, 76, 64, 5);
    ctx.fillRect(163, 19, 5, 62);
    ctx.fillRect(222, 19, 5, 62);
    ctx.fillRect(193, 24, 4, 52);
    ctx.fillRect(168, 48, 54, 4);

    sprite(env, tiles.cabinets, 32, 0, 64, 72, 250, WALL - 72);
    sprite(env, tiles.kitchen, 0, 0, 32, 124, 340, WALL + 12 - 124);
    sprite(env, tiles.country, 0, 0, 64, 96, 16, 62);
    // Tapete
    bands(env, 140, 188, 110, 14, ['#7a2a2a', '#8f3535', '#7a2a2a']);

    // Lareira acesa dentro do fogão
    if (env.time === 'night') flame(env, 357, WALL + 2, 1);
  },
  lights: () => [
    {
      x: 357,
      y: WALL,
      radius: 90,
      color: [255, 150, 60],
      intensity: 0.55,
      flicker: true,
      at: ['night', 'afternoon'],
    },
    { x: 195, y: 60, radius: 70, color: [120, 150, 255], intensity: 0.28, at: ['night'] },
    { x: 195, y: 120, radius: 110, color: [255, 220, 150], intensity: 0.3, at: ['morning'] },
  ],
  tint: {
    morning: { color: '#ffd9b3', alpha: 0.28 },
    afternoon: { color: '#fff0d6', alpha: 0.12 },
    night: { color: '#2f3d8f', alpha: 0.6 },
  },
};
