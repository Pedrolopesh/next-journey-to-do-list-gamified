import { z } from 'zod';

import { isoDateTimeSchema } from './common';

/** Uma sessão aberta da conta (um aparelho). O id é o da família de refresh tokens, nunca um token. */
export const sessionSchema = z.object({
  id: z.uuid(),
  deviceName: z.string(),
  createdAt: isoDateTimeSchema,
  lastUsedAt: isoDateTimeSchema,
  /** Verdadeiro na sessão do token usado na consulta. */
  current: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;

/** GET /me/sessions */
export const sessionsResponseSchema = z.object({ sessions: z.array(sessionSchema) });
export type SessionsResponse = z.infer<typeof sessionsResponseSchema>;
