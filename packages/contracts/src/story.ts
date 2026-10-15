import { z } from 'zod';

export const chapterSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  text: z.string().min(1),
  sceneKey: z.string().min(1),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const storySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description: z.string(),
  chapters: z.array(chapterSchema),
});
export type Story = z.infer<typeof storySchema>;

/** Item do catálogo (GET /stories). */
export const storySummarySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description: z.string(),
  chapterCount: z.number().int().positive(),
  /** Capítulo em que o usuário está nesta história (1 se nunca jogou; o último se já concluiu). */
  currentChapter: z.number().int().positive(),
  /** Quantos capítulos o usuário já concluiu nesta história. */
  chaptersCompleted: z.number().int().nonnegative(),
  isActive: z.boolean(),
});
export type StorySummary = z.infer<typeof storySummarySchema>;

export const putStoryRequestSchema = z.object({ slug: z.string().min(1) });
export type PutStoryRequest = z.infer<typeof putStoryRequestSchema>;

/** Minha história (RF-29): concluídos (check verde), atual (borda roxa + progresso) e futuros (cadeado). */
export const timelineChapterSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  state: z.enum(['completed', 'current', 'locked']),
  /** Só no capítulo atual da história ativa: a EXP dentro do nível e o que falta para o próximo. */
  expInLevel: z.number().int().nonnegative().nullable(),
  expForNextLevel: z.number().int().positive().nullable(),
  /** O texto só é revelado nos capítulos já concluídos. */
  text: z.string().nullable(),
});

export const timelineSchema = z.object({
  story: storySummarySchema,
  chapters: z.array(timelineChapterSchema),
});
export type Timeline = z.infer<typeof timelineSchema>;
