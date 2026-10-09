import { z } from 'zod';

/** Catálogo de conquistas com progresso e estado para o usuário (GET /achievements). */
export const achievementSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  iconKey: z.string(),
  rewardKey: z.string().nullable(),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
  /** Progresso numérico quando faz sentido (ex.: 37 de 100 checks). */
  progress: z
    .object({ current: z.number().int().nonnegative(), target: z.number().int().positive() })
    .nullable(),
});
export type Achievement = z.infer<typeof achievementSchema>;
