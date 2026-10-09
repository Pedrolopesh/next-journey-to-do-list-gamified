import { z } from 'zod';

import { characterSchema } from './character';
import { timezoneSchema } from './common';

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

/** GET /me: perfil, estado de jogo, personagem, história ativa e passos do onboarding. */
export const meResponseSchema = z.object({
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    timezone: z.string(),
    notifyAt: z.string().nullable(),
  }),
  player: playerStateSchema.extend({
    expForNextLevel: z.number().int().positive(),
    requiredChecksInChapter: z.number().int().positive(),
  }),
  character: characterSchema.nullable(),
  story: z
    .object({
      slug: z.string(),
      name: z.string(),
      themeColor: z.string(),
      chapterTitle: z.string(),
    })
    .nullable(),
  /** O app só libera as abas com personagem e história definidos (RF-13). */
  onboarding: z.object({
    tutorialSeen: z.boolean(),
    hasCharacter: z.boolean(),
    hasStory: z.boolean(),
  }),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

/** PATCH /me: fuso do perfil, tutorial visto e horário do lembrete diário (HH:MM). */
export const patchMeRequestSchema = z
  .object({
    timezone: timezoneSchema,
    tutorialSeen: z.literal(true),
    notifyAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
  })
  .partial();
export type PatchMeRequest = z.infer<typeof patchMeRequestSchema>;
