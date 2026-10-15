import { DEFAULT_GAME_CONFIG, type GameConfig } from '@nextjourney/contracts';

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} precisa ser um inteiro maior ou igual a 1`);
  }
}

/** EXP necessária para ir do nível n ao n + 1: 75n - 25 (nível 1 -> 2 = 50; 7 -> 8 = 500). */
export function expParaNivel(
  nivel: number,
  config: Pick<GameConfig, 'levelExpSlope' | 'levelExpOffset'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(nivel, 'nivel');
  return config.levelExpSlope * nivel - config.levelExpOffset;
}
