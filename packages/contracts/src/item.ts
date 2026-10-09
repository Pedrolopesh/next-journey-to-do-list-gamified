import { z } from 'zod';

import {
  difficultySchema,
  idSchema,
  isoDateTimeSchema,
  itemTypeSchema,
  scheduleDaysSchema,
} from './common';

const base = {
  title: z.string().trim().min(1).max(120),
  categoryId: idSchema,
  difficulty: difficultySchema,
  notes: z.string().max(1000).optional(),
};

/** Criar item. Campos por tipo: diário tem frequência, tarefa tem prazo opcional, hábito não tem prazo. */
export const createItemRequestSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('daily'), scheduleDays: scheduleDaysSchema }),
  z.object({ ...base, type: z.literal('todo'), dueAt: isoDateTimeSchema.optional() }),
  z.object({ ...base, type: z.literal('habit') }),
]);
export type CreateItemRequest = z.infer<typeof createItemRequestSchema>;

/** Editar item: o tipo não muda. */
export const updateItemRequestSchema = z
  .object({
    title: base.title,
    categoryId: idSchema,
    difficulty: difficultySchema,
    notes: z.string().max(1000).nullable(),
    scheduleDays: scheduleDaysSchema,
    dueAt: isoDateTimeSchema.nullable(),
  })
  .partial();
export type UpdateItemRequest = z.infer<typeof updateItemRequestSchema>;

/** Item como a API devolve, já com o estado do dia calculado. */
export const itemSchema = z.object({
  id: idSchema,
  type: itemTypeSchema,
  title: z.string(),
  notes: z.string().nullable(),
  categoryId: idSchema,
  difficulty: difficultySchema,
  scheduleDays: scheduleDaysSchema.nullable(),
  dueAt: isoDateTimeSchema.nullable(),
  doneToday: z.boolean(),
  overdue: z.boolean(),
  streak: z.number().int().nonnegative(),
  checksToday: z.number().int().nonnegative(),
  checksThisWeek: z.number().int().nonnegative(),
});
export type Item = z.infer<typeof itemSchema>;
