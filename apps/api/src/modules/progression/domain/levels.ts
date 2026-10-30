import { DEFAULT_GAME_CONFIG, type GameConfig } from '@nextjourney/contracts';

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} precisa ser um inteiro maior ou igual a 1`);
  }
}

/** Table entry for a level (1 = first); past the end, the last value applies. */
function porNivel(tabela: readonly number[], nivel: number): number {
  return tabela[Math.min(nivel, tabela.length) - 1] as number;
}

/** EXP to finish level n (and go to n + 1): 200, 400, 600, 800 and 1000; from level 5 on, 1000. */
export function expParaNivel(
  nivel: number,
  config: Pick<GameConfig, 'levelExpTable'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(nivel, 'nivel');
  return porNivel(config.levelExpTable, nivel);
}

/** Coins lost when unchecking in chapter n: 3, 5, 10, 15 and 20; after the end, the last value. */
export function moedasPerdidasAoDesmarcar(
  capitulo: number,
  config: Pick<GameConfig, 'undoCoinPenalty'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(capitulo, 'capitulo');
  return porNivel(config.undoCoinPenalty, capitulo);
}
