import { DEFAULT_GAME_CONFIG, type GameConfig } from '@nextjourney/contracts';

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} precisa ser um inteiro maior ou igual a 1`);
  }
}

/** Table entry for a level (1 = first); past the end, the last value applies. */
function byLevel(table: readonly number[], level: number): number {
  return table[Math.min(level, table.length) - 1] as number;
}

/** EXP to finish level n (and go to n + 1): 200, 400, 600, 800 and 1000; from level 5 on, 1000. */
export function expForLevel(
  level: number,
  config: Pick<GameConfig, 'levelExpTable'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(level, 'nivel');
  return byLevel(config.levelExpTable, level);
}

/** Coins lost when unchecking in chapter n: 3, 5, 10, 15 and 20; after the end, the last value. */
export function coinsLostOnUndo(
  chapter: number,
  config: Pick<GameConfig, 'undoCoinPenalty'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(chapter, 'capitulo');
  return byLevel(config.undoCoinPenalty, chapter);
}
