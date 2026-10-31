import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';

import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;

type PurgeCounts = {
  refreshTokens: number;
  passwordResets: number;
  emailVerifications: number;
  rateLimits: number;
};
type ExpiringTable = {
  findMany(args: {
    where: { expiresAt: { lt: Date } };
    select: { id: true };
    take: number;
  }): Promise<{ id: string }[]>;
  deleteMany(args: { where: { id: { in: string[] } } }): Promise<{ count: number }>;
};

/** Days an expired record stays before deletion, so recent abuse can be investigated. */
export const EXPIRED_GRACE_DAYS = 7;

/**
 * Daily cleanup. It only deletes what expired more than 7 days ago: a revoked refresh token still
 * within its validity must stay, because it exposes the reuse of a stolen token. Rules:
 * docs/api/autenticacao-e-sessoes.md.
 */
@Injectable()
export class AuthCleanupService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async purgeExpired(): Promise<PurgeCounts> {
    const limit = new Date(this.clock.now().getTime() - EXPIRED_GRACE_DAYS * DAY_MS);
    return {
      refreshTokens: await this.purgeInBatches(this.prisma.refreshToken, limit),
      passwordResets: await this.purgeInBatches(this.prisma.passwordReset, limit),
      emailVerifications: await this.purgeInBatches(this.prisma.emailVerification, limit),
      rateLimits: await this.purgeRateLimits(),
    };
  }

  /** Rate limit counters: the longest window is 1 hour, so 1 day is plenty. */
  private async purgeRateLimits(): Promise<number> {
    const limit = new Date(this.clock.now().getTime() - DAY_MS);
    let total = 0;
    for (;;) {
      const rows = await this.prisma.rateLimit.findMany({
        where: { windowStart: { lt: limit } },
        select: { key: true },
        take: BATCH_SIZE,
      });
      if (rows.length === 0) return total;
      const { count } = await this.prisma.rateLimit.deleteMany({
        where: { key: { in: rows.map((row) => row.key) } },
      });
      total += count;
      if (rows.length < BATCH_SIZE) return total;
    }
  }

  /** Deletes in batches so a big table never becomes one long DELETE with heavy locks and logs. */
  private async purgeInBatches(table: ExpiringTable, limit: Date): Promise<number> {
    let total = 0;
    for (;;) {
      const rows = await table.findMany({
        where: { expiresAt: { lt: limit } },
        select: { id: true },
        take: BATCH_SIZE,
      });
      if (rows.length === 0) return total;
      const { count } = await table.deleteMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
      total += count;
      if (rows.length < BATCH_SIZE) return total;
    }
  }

  @Cron('30 3 * * *')
  async purgeJob(): Promise<void> {
    try {
      const counts = await this.purgeExpired();
      this.logger.log(counts, 'tokens, links e códigos expirados removidos');
    } catch (error) {
      // The job runs again tomorrow. Only the error class and code are logged, never the message.
      const code = (error as { code?: unknown }).code;
      this.logger.error(
        {
          error: error instanceof Error ? error.name : 'desconhecido',
          code: typeof code === 'string' ? code : undefined,
        },
        'falha na limpeza de tokens expirados',
      );
    }
  }
}
