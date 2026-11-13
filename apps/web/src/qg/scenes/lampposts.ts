import { rect } from './draw';
import type { Light, SceneEnv } from './types';
import { SCENE_W } from './types';

export type Lamp = {
  x: number;
  /** Height of the lamppost's feet. */
  baseY: number;
  /** Height of the lamppost. */
  h: number;
  /** Which way the arm curves: 1 = right, -1 = left (always toward the character). */
  dir: 1 | -1;
};

const OUT = '#1b1f17';
const REACH = 9;

/** Where a lamppost's lamp is. */
export function lampHead(lamp: Lamp): { x: number; y: number } {
  return { x: lamp.x + lamp.dir * REACH, y: lamp.baseY - lamp.h + 3 };
}

/** Pixel art street lamppost. The lamp only lights at night. */
export function drawLampPost(env: SceneEnv, lamp: Lamp): void {
  const { x, baseY, h, dir } = lamp;
  const top = baseY - h;
  // base and pole
  rect(env, x - 4, baseY - 4, 9, 5, OUT);
  rect(env, x - 3, baseY - 3, 7, 3, '#4d555d');
  rect(env, x - 3, baseY - 3, 7, 1, '#7a838c');
  rect(env, x - 2, top, 5, h - 3, OUT);
  rect(env, x - 1, top, 3, h - 3, '#5d656d');
  rect(env, x - 1, top, 1, h - 3, '#9099a2');
  // curved arm
  for (let i = 0; i <= REACH; i++) {
    const y = top + (i > REACH - 3 ? 2 : i > REACH - 6 ? 1 : 0);
    rect(env, x + dir * i - (dir < 0 ? 0 : 0), y - 1, 1, 4, OUT);
    rect(env, x + dir * i, y, 1, 2, '#5d656d');
  }
  // shade and lamp
  const head = lampHead(lamp);
  rect(env, head.x - 4, head.y - 4, 9, 3, OUT);
  rect(env, head.x - 3, head.y - 3, 7, 1, '#7a838c');
  rect(env, head.x - 3, head.y - 1, 7, 3, OUT);
  rect(env, head.x - 2, head.y - 1, 5, 2, env.time === 'night' ? '#fff3b8' : '#b8c0b0');
}

/** Cone of light from each lamppost falling on the character (night only). */
export function drawLampCones(env: SceneEnv, lamps: Lamp[], targetX: number, feetY: number): void {
  if (env.time !== 'night') return;
  const { ctx } = env;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of lamps) {
    const head = lampHead(lamp);
    const gradient = ctx.createLinearGradient(head.x, head.y, targetX, feetY);
    gradient.addColorStop(0, 'rgba(255,238,170,0.5)');
    gradient.addColorStop(1, 'rgba(255,238,170,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(head.x - 2, head.y + 2);
    ctx.lineTo(head.x + 2, head.y + 2);
    ctx.lineTo(targetX + 24, feetY + 3);
    ctx.lineTo(targetX - 24, feetY + 3);
    ctx.fill();
  }
  ctx.restore();
}

/** Lamppost glows and a pool of light around the character; they only light at night. */
export function lampLights(lamps: Lamp[], targetX: number, feetY: number): Light[] {
  const out: Light[] = [];
  for (const lamp of lamps) {
    const head = lampHead(lamp);
    out.push({ x: head.x, y: head.y, radius: 26, color: [255, 236, 160], intensity: 0.9 });
    out.push({
      x: (head.x + targetX) / 2,
      y: feetY - 26,
      radius: 70,
      color: [255, 232, 170],
      intensity: 0.42,
    });
  }
  out.push({ x: targetX, y: feetY - 8, radius: 46, color: [255, 240, 190], intensity: 0.4 });
  return out.filter((light) => light.x > -100 && light.x < SCENE_W + 100);
}
