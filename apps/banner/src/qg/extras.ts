import type { Direction } from './compose';
import { scrolled } from './scenes/draw';
import type { ExtraCharacter, SceneDef } from './scenes/types';

const cache = new WeakMap<SceneDef, Map<string, ExtraCharacter[]>>();

/**
 * Figurantes de um cenário num nível (guardados, porque o desenho pergunta a cada quadro). Na
 * jornada vale a lista própria dela.
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

/** Onde um figurante está na tela durante a jornada: o mundo rola e ele anda um pouco nele. */
export function journeySpot(
  extra: ExtraCharacter,
  scroll: number,
  clock: number,
  period: number,
): { x: number; direction: Direction } {
  const drift = extra.drift ?? 0;
  return {
    x: scrolled(extra.x + drift * clock, scroll, period),
    direction: drift === 0 ? extra.direction : drift > 0 ? 'right' : 'left',
  };
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
