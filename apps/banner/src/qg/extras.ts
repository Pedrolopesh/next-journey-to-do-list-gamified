import type { Direction } from './compose';
import type { ExtraCharacter, SceneDef } from './scenes/types';

const cache = new WeakMap<SceneDef, Map<number, ExtraCharacter[]>>();

/** Figurantes de um cenário num nível (guardados, porque o desenho pergunta a cada quadro). */
export function extrasOf(def: SceneDef, level: number): ExtraCharacter[] {
  if (!def.extrasFor) return def.extras ?? [];
  let byLevel = cache.get(def);
  if (!byLevel) {
    byLevel = new Map();
    cache.set(def, byLevel);
  }
  let list = byLevel.get(level);
  if (!list) {
    list = def.extrasFor(level);
    byLevel.set(level, list);
  }
  return list;
}

/** Onde um figurante que vai e volta está depois de `clock` segundos, e para onde olha. */
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
