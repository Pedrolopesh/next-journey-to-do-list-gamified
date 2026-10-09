import { z } from 'zod';

import { idSchema } from './common';

/** Corpo de POST /v1/items/:id/checks. O checkId (UUID v4 do app) torna o check idempotente. */
export const checkRequestSchema = z.object({ checkId: idSchema });
export type CheckRequest = z.infer<typeof checkRequestSchema>;

export const achievementUnlockedSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
});

/** Resposta do check e do desmarcar (CheckResult). */
export const checkResultSchema = z.object({
  expGained: z.number().int(),
  coinsGained: z.number().int(),
  level: z.number().int().positive(),
  leveledUp: z.boolean(),
  chapterProgress: z.object({
    chapter: z.number().int().positive(),
    checksInChapter: z.number().int().nonnegative(),
    requiredChecks: z.number().int().positive(),
  }),
  chapterCompleted: z.boolean(),
  achievementsUnlocked: z.array(achievementUnlockedSchema),
});
export type CheckResult = z.infer<typeof checkResultSchema>;
export type CheckResponse = CheckResult;
