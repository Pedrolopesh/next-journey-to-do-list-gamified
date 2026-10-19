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
  /** Check de hoje que ainda vale (o mais recente): é o que o app desmarca. Nulo sem check hoje. */
  lastCheckId: idSchema.nullable().default(null),
});
export type Item = z.infer<typeof itemSchema>;

/** Tarefa concluída que saiu da lista de tarefas e mora no histórico do perfil. */
export const historyItemSchema = z.object({
  id: idSchema,
  title: z.string(),
  categoryId: idSchema,
  difficulty: difficultySchema,
  completedAt: isoDateTimeSchema,
  /** Check que concluiu a tarefa: desmarcar devolve a tarefa à lista (as moedas diminuem). */
  checkId: idSchema.nullable(),
});
export type HistoryItem = z.infer<typeof historyItemSchema>;

export const historyQuerySchema = z.object({
  /** Cursor: só tarefas concluídas antes deste instante (ISO). */
  before: isoDateTimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type HistoryQuery = z.infer<typeof historyQuerySchema>;

export const historyResponseSchema = z.object({
  items: z.array(historyItemSchema),
  /** Passe em `before` para a próxima página; nulo no fim. */
  nextCursor: isoDateTimeSchema.nullable(),
});
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
