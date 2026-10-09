import { z } from 'zod';

const perDifficulty = z.object({
  easy: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  hard: z.number().int().nonnegative(),
});

/**
 * Valores da tabela `game_config`. Ficam no back-end para ajustar sem publicar o app.
 * EXP de um nível n para n+1 = levelExpSlope * n - levelExpOffset.
 * Checks do capítulo n = min(chapterBaseChecks + chapterChecksStep * (n - 1), chapterMaxChecks).
 */
export const gameConfigSchema = z.object({
  expByDifficulty: perDifficulty,
  coinsByDifficulty: perDifficulty,
  levelUpBonusCoins: z.number().int().nonnegative(),
  chaptersPerStory: z.number().int().positive(),
  chapterBaseChecks: z.number().int().positive(),
  chapterChecksStep: z.number().int().nonnegative(),
  chapterMaxChecks: z.number().int().positive(),
  levelExpSlope: z.number().int().positive(),
  levelExpOffset: z.number().int().nonnegative(),
});
export type GameConfig = z.infer<typeof gameConfigSchema>;

/** Valores iniciais da especificação (seed do game_config). */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  expByDifficulty: { easy: 5, medium: 10, hard: 20 },
  coinsByDifficulty: { easy: 1, medium: 2, hard: 4 },
  levelUpBonusCoins: 10,
  chaptersPerStory: 5,
  chapterBaseChecks: 10,
  chapterChecksStep: 5,
  chapterMaxChecks: 40,
  levelExpSlope: 75,
  levelExpOffset: 25,
};
