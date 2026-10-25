import { z } from 'zod';

import { isoDateTimeSchema } from './common';

const iso = isoDateTimeSchema;

/**
 * GET /me/export: tudo que a conta guarda sobre a própria pessoa (LGPD, direito de acesso). Lista de campos
 * permitidos: sem hash de senha, tokens, códigos nem identificadores internos de provedores.
 */
export const dataExportSchema = z.object({
  exportedAt: iso,
  account: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    timezone: z.string(),
    notifyAt: z.string().nullable(),
    createdAt: iso,
    termsAcceptedAt: iso,
    termsVersion: z.string(),
    tutorialSeenAt: iso.nullable(),
    emailVerifiedAt: iso.nullable(),
    /** Formas de entrar que a conta tem (nunca o segredo nem o id no provedor). */
    signInMethods: z.array(z.enum(['password', 'google', 'apple'])),
  }),
  progress: z.object({
    level: z.number().int(),
    expInLevel: z.number().int(),
    expTotal: z.number().int(),
    coins: z.number().int(),
    totalChecks: z.number().int(),
    itemsCreated: z.number().int(),
    lookChanges: z.number().int(),
    categoriesCreated: z.number().int(),
  }),
  character: z
    .object({
      name: z.string(),
      title: z.string(),
      skin: z.string(),
      hair: z.string(),
      outfit: z.string(),
      accessory: z.string().nullable(),
      look: z.unknown().nullable(),
    })
    .nullable(),
  categories: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      color: z.string(),
      position: z.number().int(),
      deletedAt: iso.nullable(),
    }),
  ),
  items: z.array(
    z.object({
      id: z.uuid(),
      categoryId: z.uuid(),
      type: z.enum(['daily', 'todo', 'habit']),
      title: z.string(),
      notes: z.string().nullable(),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      scheduleDays: z.array(z.number().int()),
      dueAt: iso.nullable(),
      completedAt: iso.nullable(),
      createdOn: z.string(),
      lastCheckedOn: z.string().nullable(),
      streakCurrent: z.number().int(),
      streakBest: z.number().int(),
      isExample: z.boolean(),
      createdAt: iso,
      deletedAt: iso.nullable(),
    }),
  ),
  checks: z.array(
    z.object({
      id: z.uuid(),
      itemId: z.uuid(),
      checkedOn: z.string(),
      checkedAt: iso,
      exp: z.number().int(),
      coins: z.number().int(),
      revertedAt: iso.nullable(),
    }),
  ),
  achievements: z.array(z.object({ slug: z.string(), unlockedAt: iso })),
  cosmetics: z.array(z.object({ key: z.string(), source: z.string(), unlockedAt: iso })),
  stories: z.array(
    z.object({
      slug: z.string(),
      chapter: z.number().int(),
      checksInChapter: z.number().int(),
      completed: z.boolean(),
      isActive: z.boolean(),
    }),
  ),
});
export type DataExport = z.infer<typeof dataExportSchema>;
