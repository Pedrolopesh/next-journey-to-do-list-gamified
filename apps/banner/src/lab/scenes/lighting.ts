import { glow } from './draw';
import type { Light, SceneEnv, Tint } from './types';
import { SCENE_H, SCENE_W } from './types';

const DEFAULT_TINT: Record<SceneEnv['time'], Tint> = {
  morning: { color: '#ffd9b3', alpha: 0.25 },
  afternoon: { color: '#fff4de', alpha: 0.08 },
  night: { color: '#2f3d8f', alpha: 0.58 },
};

/** Cor da hora do dia aplicada sobre a cena inteira (multiplica as cores). */
export function applyTint(env: SceneEnv, tint?: Tint): void {
  const { ctx } = env;
  const chosen = tint ?? DEFAULT_TINT[env.time];
  if (chosen.alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = chosen.alpha;
  ctx.fillStyle = chosen.color;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  ctx.restore();
}

/** Brilho das fontes de luz: degradê radial que soma cor. */
export function drawLights(env: SceneEnv, lights: Light[]): void {
  for (const light of lights) {
    if (!(light.at ?? ['night']).includes(env.time)) continue;
    const flicker = light.flicker
      ? 1 + Math.sin(env.t * 13 + light.x) * 0.05 + Math.sin(env.t * 7.3) * 0.03
      : 1;
    glow(env, light.x, light.y, light.radius * flicker, light.color, light.intensity * 0.7);
  }
}

/** Acabamento: escurece de leve as bordas para dar foco e profundidade. */
export function vignette(env: SceneEnv): void {
  const { ctx } = env;
  const gradient = ctx.createRadialGradient(
    SCENE_W / 2,
    SCENE_H * 0.55,
    SCENE_H * 0.35,
    SCENE_W / 2,
    SCENE_H * 0.55,
    SCENE_W * 0.62,
  );
  const edge = env.time === 'night' ? 0.5 : 0.28;
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(5,5,20,${edge})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
}
