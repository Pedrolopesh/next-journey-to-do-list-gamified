import { z } from 'zod';

export const chapterSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  text: z.string().min(1),
  requiredChecks: z.number().int().positive(),
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
