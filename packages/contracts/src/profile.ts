import { z } from 'zod';

/** What the person wants to change in their life (onboarding question). */
export const GOALS = [
  'procrastination',
  'fitness',
  'discipline',
  'wellbeing',
  'projects',
  'fun',
  'learning',
] as const;
export const goalSchema = z.enum(GOALS);
export type Goal = z.infer<typeof goalSchema>;

/** Optional on purpose: nothing in the app depends on it. */
export const AGE_RANGES = [
  'under18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65plus',
] as const;
export const ageRangeSchema = z.enum(AGE_RANGES);
export type AgeRange = z.infer<typeof ageRangeSchema>;

export const GENDERS = ['male', 'female', 'other'] as const;
export const genderSchema = z.enum(GENDERS);
export type Gender = z.infer<typeof genderSchema>;

/** Provisional list: names and art are still to be decided. */
export const CHARACTER_CLASSES = [
  'mage',
  'knight',
  'archer',
  'rogue',
  'goblin',
  'slime',
  'druid',
  'necromancer',
] as const;
export const characterClassSchema = z.enum(CHARACTER_CLASSES);
export type CharacterClass = z.infer<typeof characterClassSchema>;
