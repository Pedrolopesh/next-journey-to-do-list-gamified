import { z } from 'zod';

import { achievementTierSchema } from './achievement-catalog';

/** Catálogo de conquistas com progresso e estado para o usuário (GET /achievements). */
export const achievementSchema = z.object({
  slug: z.string(),
  name: z.string(),
  /** Nula enquanto uma conquista surpresa está bloqueada. */
  description: z.string().nullable(),
  trail: z.string(),
  tier: achievementTierSchema,
  glyph: z.string(),
  secret: z.boolean(),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
  /** Desbloqueada, mas o app ainda não confirmou o aviso (modal). */
  pending: z.boolean(),
  /** Progresso numérico quando faz sentido (ex.: 37 de 100 checks). */
  progress: z
    .object({ current: z.number().int().nonnegative(), target: z.number().int().positive() })
    .nullable(),
});
export type Achievement = z.infer<typeof achievementSchema>;

/** Corpo de POST /v1/achievements/ack: o app avisou o jogador destas conquistas. */
export const ackAchievementsSchema = z.object({
  slugs: z.array(z.string().min(1)).min(1).max(100),
});
export type AckAchievements = z.infer<typeof ackAchievementsSchema>;

/** Corpo de POST /v1/me/events: fatos do aparelho que o servidor não observa sozinho. */
export const appEventSchema = z.object({ type: z.enum(['reminder_enabled']) });
export type AppEvent = z.infer<typeof appEventSchema>;
