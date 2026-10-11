import type { LpcLook, TimeOfDay } from '@nextjourney/contracts';

/** Cenários do QG (Home). Os ids são os mesmos de `apps/banner/src/qg/scenes`. */
export const SCENARIOS = [
  'cabin',
  'beach',
  'rooftop',
  'zombie',
  'castle',
  'paradise',
  'hell',
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const DEFAULT_SCENARIO: Scenario = 'cabin';

/** Hora do QG: automática (relógio do aparelho) ou fixa. */
export const TIME_MODES = ['auto', 'morning', 'afternoon', 'night'] as const;
export type TimeMode = (typeof TIME_MODES)[number];

export function isScenario(value: unknown): value is Scenario {
  return SCENARIOS.some((scenario) => scenario === value);
}

export function isTimeMode(value: unknown): value is TimeMode {
  return TIME_MODES.some((mode) => mode === value);
}

/** Manhã das 5h às 11h59, tarde das 12h às 17h59, noite no resto. */
export function timeOfDayFor(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export function resolveTime(mode: TimeMode, now: Date): TimeOfDay {
  return mode === 'auto' ? timeOfDayFor(now) : mode;
}

// ---- Aparência do personagem: as mesmas opções do laboratório do banner ----

export const BODY_TYPES = ['male', 'female'] as const;
export const SKIN_TONES = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'] as const;
export const HAIR_PARTS = [
  'hair-buzzcut',
  'hair-bob',
  'hair-curly-short',
  'hair-bangs-bun',
  'hair-half-up',
  'hair-natural',
] as const;
export const HAIR_COLORS = [
  'black',
  'dark_brown',
  'chestnut',
  'blonde',
  'ginger',
  'redhead',
  'gray',
  'pink',
  'purple',
  'blue',
] as const;
export const TORSO_PARTS = [
  'torso-tshirt',
  'torso-longsleeve-2',
  'torso-cardigan',
  'torso-sleeveless-2',
] as const;
export const LEGS_PARTS = ['legs-pants', 'legs-shorts', 'legs-leggings'] as const;
export const FEET_PARTS = ['feet-basic-shoes', 'feet-revised-boots', 'feet-sandals'] as const;
export const CLOTH_COLORS = [
  'white',
  'black',
  'red',
  'blue',
  'navy',
  'green',
  'forest',
  'purple',
  'yellow',
  'orange',
  'tan',
  'gray',
] as const;

export const DEFAULT_LOOK: LpcLook = {
  bodyType: 'male',
  skin: 'light',
  hair: 'hair-bob',
  hairColor: 'chestnut',
  torso: 'torso-tshirt',
  torsoColor: 'blue',
  legs: 'legs-pants',
  legsColor: 'navy',
  feet: 'feet-basic-shoes',
  feetColor: 'brown',
};

/** Chave simples de pele (cadastro antigo e recompensas) mais próxima da pele LPC escolhida. */
export function legacySkin(skin: string): string {
  if (skin === 'amber' || skin === 'olive' || skin === 'taupe') return 'tan';
  if (skin === 'bronze' || skin === 'brown') return 'brown';
  if (skin === 'black') return 'dark';
  return 'light';
}

/** Chave simples de cabelo mais próxima do cabelo LPC escolhido. */
export function legacyHair(hair: string | null): string {
  if (hair === null) return 'bald';
  if (hair === 'hair-curly-short') return 'curly-red';
  if (hair === 'hair-buzzcut') return 'short-brown';
  return 'long-black';
}
