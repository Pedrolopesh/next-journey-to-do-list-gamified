import { DEFAULT_GAME_CONFIG, type GameConfig } from '@nextjourney/contracts';

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} precisa ser um inteiro maior ou igual a 1`);
  }
}

/** Item da tabela pelo nível (1 = primeiro); passando do fim, vale o último valor. */
function porNivel(tabela: readonly number[], nivel: number): number {
  return tabela[Math.min(nivel, tabela.length) - 1] as number;
}

/** EXP para concluir o nível n (e ir ao n + 1): 200, 400, 600, 800 e 1000; do 5 em diante, 1000. */
export function expParaNivel(
  nivel: number,
  config: Pick<GameConfig, 'levelExpTable'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(nivel, 'nivel');
  return porNivel(config.levelExpTable, nivel);
}

/** Moedas perdidas ao desmarcar no capítulo n: 3, 5, 10, 15 e 20; depois do fim, o último valor. */
export function moedasPerdidasAoDesmarcar(
  capitulo: number,
  config: Pick<GameConfig, 'undoCoinPenalty'> = DEFAULT_GAME_CONFIG,
): number {
  assertPositiveInteger(capitulo, 'capitulo');
  return porNivel(config.undoCoinPenalty, capitulo);
}
