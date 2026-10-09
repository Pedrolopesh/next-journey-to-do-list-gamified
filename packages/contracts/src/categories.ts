import { z } from 'zod';

import { idSchema } from './common';

/** Paleta de cores das categorias (tokens do design system). */
export const CATEGORY_COLORS = [
  '#7c3aed',
  '#a78bfa',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
] as const;
export const MAX_CATEGORIES = 10;

export const categoryColorSchema = z.enum(CATEGORY_COLORS);

export const categorySchema = z.object({
  id: idSchema,
  name: z.string(),
  color: z.string(),
  position: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryRequestSchema = z.object({
  name: z.string().trim().min(1).max(30),
  color: categoryColorSchema,
});
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

export const updateCategoryRequestSchema = createCategoryRequestSchema.partial();
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;

/** Excluir uma categoria com itens ativos exige a categoria de destino. */
export const deleteCategoryQuerySchema = z.object({ moveTo: idSchema.optional() });
