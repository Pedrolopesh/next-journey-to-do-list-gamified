import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const MINUTE_MS = 60_000;

/** Regras de limite por conta. O limite por IP continua no Throttler; estes valem para o e-mail. */
export const LIMITS = {
  /** Senha errada por e-mail + IP: o atacante de um IP só trava a si mesmo. */
  loginPerEmailAndIp: { limit: 5, windowMs: 15 * MINUTE_MS },
  /** Teto só por e-mail, para ataque distribuído: alto, para ninguém trancar a conta de outra pessoa com facilidade. */
  loginPerEmail: { limit: 30, windowMs: 15 * MINUTE_MS },
  forgotPassword: { limit: 3, windowMs: 15 * MINUTE_MS },
  register: { limit: 5, windowMs: 60 * MINUTE_MS },
  resendVerification: { limit: 5, windowMs: 60 * MINUTE_MS },
  verifyEmail: { limit: 10, windowMs: 15 * MINUTE_MS },
} as const;

type Rule = { limit: number; windowMs: number };

/**
 * Limite de tentativas por e-mail, guardado no Postgres (vale entre instâncias e sobrevive a deploy).
 * A contagem depende só do e-mail digitado, exista a conta ou não, então o excesso responde igual
 * (429) nos dois casos. A chave é um hash: nenhum e-mail ou IP fica no banco.
 */
@Injectable()
export class RateLimitService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  /** Conta uma tentativa e recusa (429) quando passou do limite da janela. */
  async hit(scope: string, subject: string, rule: Rule): Promise<void> {
    const now = this.clock.now();
    const windowStart = new Date(now.getTime() - rule.windowMs);
    const key = hashKey(scope, subject);
    const rows = await this.prisma.$queryRaw<{ count: number; window_start: Date }[]>(Prisma.sql`
      INSERT INTO rate_limits ("key", "count", "window_start")
      VALUES (${key}, 1, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN rate_limits."window_start" <= ${windowStart} THEN 1 ELSE rate_limits."count" + 1 END,
        "window_start" = CASE WHEN rate_limits."window_start" <= ${windowStart} THEN ${now} ELSE rate_limits."window_start" END
      RETURNING "count", "window_start"
    `);
    const row = rows[0];
    if (row && row.count > rule.limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((row.window_start.getTime() + rule.windowMs - now.getTime()) / 1000),
      );
      throw new AppError(
        429,
        ERROR_CODES.RATE_LIMITED,
        'Muitas tentativas. Tente de novo em alguns minutos.',
        { retryAfterSeconds: retryAfter },
      );
    }
  }

  /** Zera o contador (ex.: login certo apaga as senhas erradas daquele e-mail + IP). */
  async reset(scope: string, subject: string): Promise<void> {
    await this.prisma.rateLimit.deleteMany({ where: { key: hashKey(scope, subject) } });
  }
}

const hashKey = (scope: string, subject: string): string =>
  createHash('sha256').update(`${scope}:${subject}`).digest('hex');
