import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SecurityEvents } from '../security/security-events.service.js';

const MINUTE_MS = 60_000;

/**
 * Per-account attempt limits, in two levels. Values and reasons:
 * docs/api/autenticacao-e-sessoes.md.
 */
export const LIMITS = {
  login: {
    perEmailAndIp: { limit: 5, windowMs: 15 * MINUTE_MS },
    perEmail: { limit: 30, windowMs: 15 * MINUTE_MS },
  },
  forgotPassword: {
    perEmailAndIp: { limit: 3, windowMs: 15 * MINUTE_MS },
    perEmail: { limit: 10, windowMs: 60 * MINUTE_MS },
  },
  register: {
    perEmailAndIp: { limit: 5, windowMs: 60 * MINUTE_MS },
    perEmail: { limit: 15, windowMs: 60 * MINUTE_MS },
  },
  resendVerification: {
    perEmailAndIp: { limit: 5, windowMs: 60 * MINUTE_MS },
    perEmail: { limit: 15, windowMs: 60 * MINUTE_MS },
  },
  verifyEmail: {
    perEmailAndIp: { limit: 10, windowMs: 15 * MINUTE_MS },
    perEmail: { limit: 40, windowMs: 15 * MINUTE_MS },
  },
} as const;

export type LimitRules = { perEmailAndIp: Rule; perEmail: Rule };

type Rule = { limit: number; windowMs: number };

/**
 * Attempt counter per email stored in Postgres. Rules: docs/api/autenticacao-e-sessoes.md.
 */
@Injectable()
export class RateLimitService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(SecurityEvents) private readonly events: SecurityEvents,
  ) {}

  /** Counts an attempt and refuses (429) once the window limit is exceeded. */
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
      this.events.record('rate_limited', { scope });
      throw new AppError(
        429,
        ERROR_CODES.RATE_LIMITED,
        'Muitas tentativas. Tente de novo em alguns minutos.',
        { retryAfterSeconds: retryAfter },
      );
    }
  }

  async hitBoth(scope: string, email: string, ip: string, rules: LimitRules): Promise<void> {
    await Promise.all([
      this.hit(`${scope}:email`, email, rules.perEmail),
      this.hit(`${scope}:email-ip`, `${email}|${ip}`, rules.perEmailAndIp),
    ]);
  }

  async reset(scope: string, subject: string): Promise<void> {
    await this.prisma.rateLimit.deleteMany({ where: { key: hashKey(scope, subject) } });
  }
}

const hashKey = (scope: string, subject: string): string =>
  createHash('sha256').update(`${scope}:${subject}`).digest('hex');
