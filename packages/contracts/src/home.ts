import { z } from 'zod';

import { itemSchema } from './item';

/** GET /home: um endpoint agregado para a Home não fazer 5 chamadas (RF-35). */
export const homeResponseSchema = z.object({
  counters: z.object({
    pendingDailies: z.number().int().nonnegative(),
    pendingTasks: z.number().int().nonnegative(),
    bestStreak: z.number().int().nonnegative(),
  }),
  story: z
    .object({
      slug: z.string(),
      name: z.string(),
      chapter: z.number().int().positive(),
      chapterTitle: z.string(),
      checksInChapter: z.number().int().nonnegative(),
      requiredChecks: z.number().int().positive(),
      completed: z.boolean(),
    })
    .nullable(),
  /** Itens "Para hoje": diários pendentes e tarefas com prazo até hoje. */
  today: z.array(itemSchema),
});
export type HomeResponse = z.infer<typeof homeResponseSchema>;
