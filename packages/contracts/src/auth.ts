import { z } from 'zod';

import { emailInputSchema, timezoneSchema } from './common';

export const VERIFICATION_CODE_LENGTH = 6;

/** Passwordless entry: asks for a code (always 202) and trades it for a session. */
export const emailStartRequestSchema = z.object({
  email: emailInputSchema,
  /** Used only when the email has no account yet (the code confirms it). */
  timezone: timezoneSchema.optional(),
  /** Version of the Terms shown on the welcome screen; stored on the new account. */
  termsVersion: z.string().min(1).max(32).optional(),
});
export type EmailStartRequest = z.infer<typeof emailStartRequestSchema>;

export const emailConfirmRequestSchema = z.object({
  email: emailInputSchema,
  code: z.string().regex(/^\d{6}$/),
});
export type EmailConfirmRequest = z.infer<typeof emailConfirmRequestSchema>;

export const refreshRequestSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

/** Login social: o app obtém o ID token do Google ou da Apple e só ele chega à API. */
export const socialLoginRequestSchema = z.object({
  idToken: z.string().min(1),
  timezone: timezoneSchema.optional(),
  /** Obrigatório só no primeiro acesso (cria a conta): aceite dos Termos e da Política. */
  termsVersion: z.string().min(1).optional(),
});
export type SocialLoginRequest = z.infer<typeof socialLoginRequestSchema>;

/** DELETE /me: prova de que quem pede é a dona da conta (código por e-mail ou ID token novo do provedor). */
export const deleteAccountRequestSchema = z.union([
  z.object({ emailCode: z.string().regex(/^\d{6}$/) }),
  z.object({ provider: z.enum(['google', 'apple']), idToken: z.string().min(1) }),
]);
export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Validade do access token, em segundos. */
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const userSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: emailInputSchema,
  timezone: timezoneSchema,
});
export type UserSummary = z.infer<typeof userSummarySchema>;

/** Resposta da confirmação do código, do refresh e do login social. */
export const authResponseSchema = z.object({
  tokens: authTokensSchema,
  user: userSummarySchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
