import { z } from 'zod';

/** An optional variable left empty (`KEY=` in .env) counts as absent. */
const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

/** Environment variables. The API does not start if any is missing or invalid. */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32, 'precisa ter pelo menos 32 caracteres'),
    /**
     * Issuer and audience of the access token: a token from another service or environment is not
     * valid here.
     */
    JWT_ISSUER: z.string().min(1).default('nextjourney-api'),
    JWT_AUDIENCE: z.string().min(1).default('nextjourney-app'),
    /**
     * Identifier (kid) of the current key. While the secret is being changed, the previous one
     * stays valid until its token ends.
     */
    JWT_KEY_ID: z.string().min(1).default('k1'),
    JWT_ACCESS_SECRET_PREVIOUS: z.preprocess(
      emptyToUndefined,
      z.string().min(32, 'precisa ter pelo menos 32 caracteres').optional(),
    ),
    JWT_PREVIOUS_KEY_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    // Transactional email (Resend). Without a key, nothing is sent (development).
    RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    MAIL_FROM: z.string().default('Next Journey <no-reply@example.com>'),
    /** Link that opens the app on the new password screen (deep link). */
    PASSWORD_RESET_URL: z.string().default('nextjourney://reset-password'),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
    // Social login: public client ids (not secrets). Empty means the feature is unavailable.
    GOOGLE_CLIENT_IDS: z.string().default(''),
    APPLE_CLIENT_ID: z.string().default(''),
    // Allowed web origins (CORS), comma separated. Empty means CORS off (the native app does not
    // need it).
    CORS_ORIGINS: z.string().default(''),
    /** Turn on behind a reverse proxy (nginx) so the rate limit sees the real IP. */
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    /** Create the starter items when an account becomes valid. Off in the API e2e suite. */
    SEED_STARTER_ITEMS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    /**
     * Optional alert on an abnormal count of security events (POST with short text, no personal
     * data).
     */
    SECURITY_ALERT_WEBHOOK_URL: z.preprocess(
      emptyToUndefined,
      z
        .url()
        .refine((value) => value.startsWith('https://'), 'precisa ser https')
        .optional(),
    ),
    /** Requests per minute per IP, overall and on the authentication routes. */
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
    THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(10),
    /**
     * Minimum response time (ms) of the account routes that answer the same whether the email
     * exists or not.
     */
    AUTH_MIN_RESPONSE_MS: z.coerce.number().int().min(0).max(5000).default(250),
    /** Days until the final removal of the data of a deleted account. */
    ACCOUNT_PURGE_DAYS: z.coerce.number().int().positive().default(30),
  })
  .refine((env) => Boolean(env.JWT_ACCESS_SECRET_PREVIOUS) === Boolean(env.JWT_PREVIOUS_KEY_ID), {
    path: ['JWT_ACCESS_SECRET_PREVIOUS'],
    message: 'a chave anterior precisa do segredo e do identificador juntos',
  })
  .refine((env) => env.JWT_ACCESS_SECRET_PREVIOUS !== env.JWT_ACCESS_SECRET, {
    path: ['JWT_ACCESS_SECRET_PREVIOUS'],
    message: 'o segredo anterior precisa ser diferente do atual',
  })
  .refine((env) => env.JWT_PREVIOUS_KEY_ID !== env.JWT_KEY_ID, {
    path: ['JWT_PREVIOUS_KEY_ID'],
    message: 'o identificador da chave anterior precisa ser diferente do atual',
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.AUTH_MIN_RESPONSE_MS > 0, {
    path: ['AUTH_MIN_RESPONSE_MS'],
    message: 'em produção o tempo mínimo de resposta não pode ser 0',
  });

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol('ENV');

/** Validates the environment. The error message lists only the variable NAMES, never the values. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Ambiente inválido: ${problems}`);
  }
  return result.data;
}
