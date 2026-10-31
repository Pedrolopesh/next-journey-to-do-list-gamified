import { z } from 'zod';

import { characterLayersSchema } from './banner-protocol';
import { characterClassSchema } from './profile';

export const characterTitleSchema = z.enum(['Herói', 'Heroína', 'Aventureiro']);

/** Personagem: nome, título e as chaves de camada LPC (as mesmas usadas pelo banner). */
export const characterSchema = characterLayersSchema.extend({
  name: z.string().min(1).max(40),
  title: characterTitleSchema,
  characterClass: characterClassSchema.optional(),
});
export type Character = z.infer<typeof characterSchema>;
