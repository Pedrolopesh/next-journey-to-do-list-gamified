import { z } from 'zod';

/** Códigos de erro de regra de negócio devolvidos pela API. */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  /** Desmarcar de outro dia não é permitido. */
  UNDO_NOT_ALLOWED: 'UNDO_NOT_ALLOWED',
  /** O check fechou o capítulo (ou o capítulo já fechou): é definitivo. */
  CHECK_LOCKED: 'CHECK_LOCKED',
  /** Login com senha certa, mas o e-mail do cadastro ainda não foi confirmado. */
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  /** Código de confirmação do e-mail errado, expirado ou já usado. */
  INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
  /** Senha ou ID token de confirmação errado ao excluir a conta. 403 (nunca 401: a sessão continua valendo). */
  REAUTH_FAILED: 'REAUTH_FAILED',
  /** O provedor (Google/Apple) não verificou o e-mail do login social. */
  EMAIL_NOT_VERIFIED_BY_PROVIDER: 'EMAIL_NOT_VERIFIED_BY_PROVIDER',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const errorCodeSchema = z.enum(Object.values(ERROR_CODES) as [string, ...string[]]);
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Formato padrão de erro da API: { code, message, requestId }. Nunca inclui dados sensíveis. */
export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string(),
  requestId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
