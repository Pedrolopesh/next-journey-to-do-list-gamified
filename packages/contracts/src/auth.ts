import { z } from 'zod';

import { timezoneSchema } from './common';

/** Regras da senha, na ordem do checklist visível no cadastro (RF-01). */
export const PASSWORD_RULES = [
  { id: 'length', test: (value: string) => value.length >= 8 },
  { id: 'uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'number', test: (value: string) => /\d/.test(value) },
  { id: 'special', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export const passwordSchema = z
  .string()
  .max(128)
  .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), 'Senha fora das regras');

export const registerRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.email(),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true),
    termsVersion: z.string().min(1),
    timezone: timezoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const refreshRequestSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

/** Login social: o app obtém o ID token do Google ou da Apple e só ele chega à API. */
export const socialLoginRequestSchema = z.object({
  idToken: z.string().min(1),
  timezone: timezoneSchema.optional(),
});
export type SocialLoginRequest = z.infer<typeof socialLoginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({ email: z.email() });
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Validade do access token, em segundos. */
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
