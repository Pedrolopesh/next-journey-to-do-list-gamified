import type { Direction } from './compose';
import { scrolled } from './scenes/draw';
import type { ExtraCharacter, SceneDef } from './scenes/types';
import { SCENE_W } from './scenes/types';

const cache = new WeakMap<SceneDef, Map<string, ExtraCharacter[]>>();

/**
 * Extras of a scene at a level (cached, because drawing asks on every frame). On the
 * journey the journey's own list applies.
 */
export function extrasOf(def: SceneDef, level: number, journey = false): ExtraCharacter[] {
  if (journey) return cached(def, `j${level}`, () => def.journeyExtrasFor?.(level) ?? []);
  if (!def.extrasFor) return def.extras ?? [];
  return cached(def, `q${level}`, () => def.extrasFor?.(level) ?? []);
}

function cached(def: SceneDef, key: string, make: () => ExtraCharacter[]): ExtraCharacter[] {
  let byLevel = cache.get(def);
  if (!byLevel) {
    byLevel = new Map();
    cache.set(def, byLevel);
  }
  let list = byLevel.get(key);
  if (!list) {
    list = make();
    byLevel.set(key, list);
  }
  return list;
}

/** Where an extra is on the screen during the journey: the world scrolls and they walk a little in it. */
export function journeySpot(
  extra: ExtraCharacter,
  scroll: number,
  clock: number,
  period: number,
): { x: number; direction: Direction } {
  const drift = extra.drift ?? 0;
  return {
    x: scrolled(extra.x + drift * clock, scroll, extra.period ?? period),
    direction: drift === 0 ? extra.direction : drift > 0 ? 'right' : 'left',
  };
}

/** Where an extra that goes back and forth is after `clock` seconds, and which way they face. */
export function patrolSpot(
  patrol: NonNullable<ExtraCharacter['patrol']>,
  clock: number,
): { x: number; direction: Direction } {
  const span = Math.abs(patrol.to - patrol.from);
  if (span === 0 || patrol.speed <= 0) return { x: patrol.from, direction: 'down' };
  const sign = patrol.to > patrol.from ? 1 : -1;
  const walked = (clock * patrol.speed) % (span * 2);
  const going = walked <= span;
  const along = going ? walked : span * 2 - walked;
  return {
    x: patrol.from + sign * along,
    direction: (going ? sign : -sign) > 0 ? 'right' : 'left',
  };
}

/**
 * Where those running with the character are (chasers behind, fleeing ones ahead). `chase` goes
 * from 0 (scenery stopped: off screen, on the side they came from) to 1 (in position).
 */
export function followSpot(
  follow: NonNullable<ExtraCharacter['follow']>,
  heroX: number,
  clock: number,
  chase: number,
): { x: number; direction: Direction } {
  const near = heroX + follow.offset + Math.sin(clock * follow.rate + follow.phase) * follow.sway;
  const away = follow.offset < 0 ? -40 : SCENE_W + 40;
  return { x: Math.round(away + (near - away) * chase), direction: 'right' };
}
