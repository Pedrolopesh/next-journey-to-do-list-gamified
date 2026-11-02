import { z } from 'zod';

import { characterLayersSchema } from './banner-protocol';
import { characterClassSchema } from './profile';

/**
 * Characters are nicknames: letters, numbers and symbols are all fine. The only rules keep out what
 * has no place in a name: angle brackets (markup and scripts), control characters and the invisible
 * or text-direction characters used to disguise a name.
 */
const FORBIDDEN_IN_NAME = /[<>\p{Cc}\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/u;
export const characterNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .refine((value) => !FORBIDDEN_IN_NAME.test(value), 'Nome com caracteres inválidos');

export const characterTitleSchema = z.enum(['Herói', 'Heroína', 'Aventureiro']);

/** Personagem: nome, título e as chaves de camada LPC (as mesmas usadas pelo banner). */
export const characterSchema = characterLayersSchema.extend({
  name: characterNameSchema,
  title: characterTitleSchema,
  characterClass: characterClassSchema.optional(),
});
export type Character = z.infer<typeof characterSchema>;
