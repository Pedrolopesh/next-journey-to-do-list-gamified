import { z } from 'zod';

/** Variáveis de ambiente. A API não sobe se faltar ou estiver inválida alguma delas. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'precisa ter pelo menos 32 caracteres'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // E-mail transacional (Resend). Sem chave, nada é enviado (desenvolvimento).
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().default('Next Journey <no-reply@example.com>'),
  /** Link que abre o app na tela de nova senha (deep link). */
  PASSWORD_RESET_URL: z.string().default('nextjourney://reset-password'),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  // Login social: client ids públicos (não são segredos). Vazios = recurso indisponível.
  GOOGLE_CLIENT_IDS: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),
  // Origens web permitidas (CORS), separadas por vírgula. Vazio = CORS desligado (o app nativo não precisa).
  CORS_ORIGINS: z.string().default(''),
  /** Ligue atrás de proxy reverso (nginx) para o rate limit enxergar o IP real. */
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  /** Requisições por minuto por IP, no geral e nas rotas de autenticação. */
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(10),
  /** Dias até a remoção definitiva dos dados de uma conta excluída. */
  ACCOUNT_PURGE_DAYS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol('ENV');

/** Valida o ambiente. A mensagem de erro lista só os NOMES das variáveis, nunca os valores. */
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
