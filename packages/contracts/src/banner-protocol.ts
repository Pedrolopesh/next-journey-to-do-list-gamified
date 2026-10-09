import { z } from 'zod';

/**
 * Protocolo de mensagens entre o app (React Native) e o banner (WebView).
 * Toda mensagem segue { v: 1, type, payload } e é validada com estes schemas nos dois lados.
 * Mensagem inválida é descartada e gera um ERROR. O banner nunca acessa a API.
 */
export const BANNER_PROTOCOL_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Tipos de dado
// ---------------------------------------------------------------------------

export const sceneKindSchema = z.enum(['qg', 'map']);
export type SceneKind = z.infer<typeof sceneKindSchema>;

export const timeOfDaySchema = z.enum(['morning', 'afternoon', 'night']);
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

/** Chaves das camadas LPC do personagem (salvas no cadastro do personagem). */
export const characterLayersSchema = z.object({
  skin: z.string().min(1),
  hair: z.string().min(1),
  outfit: z.string().min(1),
  accessory: z.string().min(1).optional(),
});
export type CharacterLayers = z.infer<typeof characterLayersSchema>;

/** Progresso do capítulo, de 0 (borda direita) a 1 (borda esquerda). */
export const progressSchema = z.number().min(0).max(1);

const envelope = <T extends string, P extends z.ZodType>(type: T, payload: P) =>
  z.object({
    v: z.literal(BANNER_PROTOCOL_VERSION),
    type: z.literal(type),
    payload,
  });

const envelopeNoPayload = <T extends string>(type: T) =>
  z.object({ v: z.literal(BANNER_PROTOCOL_VERSION), type: z.literal(type) });

// ---------------------------------------------------------------------------
// App -> Banner
// ---------------------------------------------------------------------------

export const initMessageSchema = envelope(
  'INIT',
  z.object({
    scene: sceneKindSchema,
    character: characterLayersSchema,
    sceneKey: z.string().min(1),
    progress: progressSchema,
    timeOfDay: timeOfDaySchema,
  }),
);

export const itemCheckedMessageSchema = envelope(
  'ITEM_CHECKED',
  z.object({ progress: progressSchema }),
);

export const chapterCompletedMessageSchema = envelope(
  'CHAPTER_COMPLETED',
  z.object({ nextSceneKey: z.string().min(1) }),
);

export const setCharacterMessageSchema = envelope(
  'SET_CHARACTER',
  z.object({ character: characterLayersSchema }),
);

export const setTimeOfDayMessageSchema = envelope(
  'SET_TIME_OF_DAY',
  z.object({ timeOfDay: timeOfDaySchema }),
);

export const pauseMessageSchema = envelopeNoPayload('PAUSE');
export const resumeMessageSchema = envelopeNoPayload('RESUME');

export const appToBannerMessageSchema = z.discriminatedUnion('type', [
  initMessageSchema,
  itemCheckedMessageSchema,
  chapterCompletedMessageSchema,
  setCharacterMessageSchema,
  setTimeOfDayMessageSchema,
  pauseMessageSchema,
  resumeMessageSchema,
]);
export type AppToBannerMessage = z.infer<typeof appToBannerMessageSchema>;

// ---------------------------------------------------------------------------
// Banner -> App
// ---------------------------------------------------------------------------

export const readyMessageSchema = envelope('READY', z.object({ bannerVersion: z.string().min(1) }));

export const chapterTransitionDoneMessageSchema = envelopeNoPayload('CHAPTER_TRANSITION_DONE');

export const errorMessageSchema = envelope(
  'ERROR',
  z.object({ code: z.string().min(1), message: z.string() }),
);

export const bannerToAppMessageSchema = z.discriminatedUnion('type', [
  readyMessageSchema,
  chapterTransitionDoneMessageSchema,
  errorMessageSchema,
]);
export type BannerToAppMessage = z.infer<typeof bannerToAppMessageSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Os WebViews trocam texto: aceita string JSON ou objeto já decodificado. */
function decode(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export type ParseResult<T> = { ok: true; message: T } | { ok: false; error: string };

export function parseAppToBannerMessage(raw: unknown): ParseResult<AppToBannerMessage> {
  const result = appToBannerMessageSchema.safeParse(decode(raw));
  return result.success
    ? { ok: true, message: result.data }
    : { ok: false, error: result.error.message };
}

export function parseBannerToAppMessage(raw: unknown): ParseResult<BannerToAppMessage> {
  const result = bannerToAppMessageSchema.safeParse(decode(raw));
  return result.success
    ? { ok: true, message: result.data }
    : { ok: false, error: result.error.message };
}

/** Monta ERROR já no formato do protocolo. */
export function createErrorMessage(code: string, message: string): BannerToAppMessage {
  return { v: BANNER_PROTOCOL_VERSION, type: 'ERROR', payload: { code, message } };
}
