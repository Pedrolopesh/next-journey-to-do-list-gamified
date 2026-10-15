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

/** Cenários das histórias (uma história por cenário): os mesmos do QG, menos a cabana. */
export const STORY_SCENARIOS = [
  'beach',
  'rooftop',
  'zombie',
  'castle',
  'paradise',
  'hell',
] as const satisfies readonly Scenario[];
export type StoryScenario = (typeof STORY_SCENARIOS)[number];
export const DEFAULT_STORY_SCENARIO: StoryScenario = 'beach';

/** Hora do QG: automática (relógio do aparelho) ou fixa. */
export const TIME_MODES = ['auto', 'morning', 'afternoon', 'night'] as const;
export type TimeMode = (typeof TIME_MODES)[number];

export function isScenario(value: unknown): value is Scenario {
  return SCENARIOS.some((scenario) => scenario === value);
}

export function isStoryScenario(value: unknown): value is StoryScenario {
  return STORY_SCENARIOS.some((scenario) => scenario === value);
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
  'brown',
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

/** Looks prontos: um toque preenche toda a aparência (o usuário ainda pode ajustar). */
export const PRESETS: { id: string; look: LpcLook }[] = [
  { id: 'adventurer', look: DEFAULT_LOOK },
  {
    id: 'warrior',
    look: {
      bodyType: 'female',
      skin: 'bronze',
      hair: 'hair-half-up',
      hairColor: 'black',
      torso: 'torso-sleeveless-2',
      torsoColor: 'red',
      legs: 'legs-pants',
      legsColor: 'gray',
      feet: 'feet-revised-boots',
      feetColor: 'black',
    },
  },
  {
    id: 'explorer',
    look: {
      bodyType: 'male',
      skin: 'amber',
      hair: 'hair-buzzcut',
      hairColor: 'dark_brown',
      torso: 'torso-longsleeve-2',
      torsoColor: 'forest',
      legs: 'legs-shorts',
      legsColor: 'tan',
      feet: 'feet-revised-boots',
      feetColor: 'brown',
    },
  },
  {
    id: 'student',
    look: {
      bodyType: 'female',
      skin: 'light',
      hair: 'hair-bangs-bun',
      hairColor: 'chestnut',
      torso: 'torso-cardigan',
      torsoColor: 'purple',
      legs: 'legs-leggings',
      legsColor: 'black',
      feet: 'feet-basic-shoes',
      feetColor: 'white',
    },
  },
  {
    id: 'legend',
    look: {
      bodyType: 'male',
      skin: 'brown',
      hair: 'hair-curly-short',
      hairColor: 'redhead',
      torso: 'torso-cardigan',
      torsoColor: 'yellow',
      legs: 'legs-pants',
      legsColor: 'navy',
      feet: 'feet-revised-boots',
      feetColor: 'brown',
    },
  },
];

const pickOne = <T>(values: readonly T[], random: () => number): T =>
  values[Math.floor(random() * values.length)] as T;

/** Aparência sorteada (sempre com roupa de cima, calça e calçado; cabelo pode ser nenhum). */
export function randomLook(random: () => number = Math.random): LpcLook {
  return {
    bodyType: pickOne(BODY_TYPES, random),
    skin: pickOne(SKIN_TONES, random),
    hair: random() < 0.1 ? null : pickOne(HAIR_PARTS, random),
    hairColor: pickOne(HAIR_COLORS, random),
    torso: pickOne(TORSO_PARTS, random),
    torsoColor: pickOne(CLOTH_COLORS, random),
    legs: pickOne(LEGS_PARTS, random),
    legsColor: pickOne(CLOTH_COLORS, random),
    feet: pickOne(FEET_PARTS, random),
    feetColor: pickOne(CLOTH_COLORS, random),
  };
}
