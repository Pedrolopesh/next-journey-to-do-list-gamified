import { z } from 'zod';

/** Progresso do capítulo na história ativa. O progresso é separado por história. */
export const storyProgressSchema = z.object({
  /** Capítulo atual, a partir de 1. */
  chapter: z.number().int().positive(),
  checksInChapter: z.number().int().nonnegative(),
  /** True quando o último capítulo da história foi concluído. */
  completed: z.boolean(),
});
export type StoryProgress = z.infer<typeof storyProgressSchema>;

/** Estado de jogo do usuário. EXP, nível e moedas são globais. */
export const playerStateSchema = z.object({
  level: z.number().int().positive(),
  /** EXP dentro do nível atual (0 até o necessário para subir). */
  expInLevel: z.number().int().nonnegative(),
  expTotal: z.number().int().nonnegative(),
  coins: z.number().int().nonnegative(),
  totalChecks: z.number().int().nonnegative(),
  story: storyProgressSchema,
});
export type PlayerState = z.infer<typeof playerStateSchema>;

/** GET /me: o usuário e o estado de jogo, já com o EXP necessário para o próximo nível. */
export const meResponseSchema = z.object({
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    timezone: z.string(),
  }),
  player: playerStateSchema.extend({
    expForNextLevel: z.number().int().positive(),
    requiredChecksInChapter: z.number().int().positive(),
  }),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
