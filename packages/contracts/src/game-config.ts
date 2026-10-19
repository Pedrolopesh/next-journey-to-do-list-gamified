import { z } from 'zod';

const perDifficulty = z.object({
  easy: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  hard: z.number().int().nonnegative(),
});

/**
 * Valores da tabela `game_config`. Ficam no back-end para ajustar sem publicar o app.
 * EXP para concluir o nível n (e o capítulo n) = levelExpTable[n - 1]; passando do fim da tabela
 * vale o último valor. Cada nível ganho conclui um capítulo da história ativa (até chaptersPerStory).
 * Ao desmarcar, o usuário perde undoCoinPenalty[capítulo - 1] moedas (último valor depois do fim).
 */
export const gameConfigSchema = z.object({
  expByDifficulty: perDifficulty,
  coinsByDifficulty: perDifficulty,
  levelUpBonusCoins: z.number().int().nonnegative(),
  chaptersPerStory: z.number().int().positive(),
  levelExpTable: z.array(z.number().int().positive()).min(1),
  undoCoinPenalty: z.array(z.number().int().nonnegative()).min(1),
});
export type GameConfig = z.infer<typeof gameConfigSchema>;

/** Valores iniciais da especificação (seed do game_config). */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  expByDifficulty: { easy: 5, medium: 10, hard: 20 },
  coinsByDifficulty: { easy: 1, medium: 2, hard: 4 },
  levelUpBonusCoins: 10,
  chaptersPerStory: 5,
  levelExpTable: [200, 400, 600, 800, 1000],
  undoCoinPenalty: [3, 5, 10, 15, 20],
};
