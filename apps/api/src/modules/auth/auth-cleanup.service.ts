import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';

import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;

type PurgeCounts = { refreshTokens: number; passwordResets: number; emailVerifications: number };
type ExpiringTable = {
  findMany(args: {
    where: { expiresAt: { lt: Date } };
    select: { id: true };
    take: number;
  }): Promise<{ id: string }[]>;
  deleteMany(args: { where: { id: { in: string[] } } }): Promise<{ count: number }>;
};

/** Dias que o registro expirado ainda fica antes de sumir (tempo para investigar abuso recente). */
export const EXPIRED_GRACE_DAYS = 7;

/**
 * Limpeza diária das tabelas que só crescem: refresh tokens, links de redefinição de senha e códigos de
 * confirmação de e-mail. Só apaga o que EXPIROU há mais de 7 dias: um refresh token revogado mas ainda
 * dentro da validade fica, porque é ele que denuncia o reuso de um token roubado. Idempotente, então
 * duas instâncias rodando juntas não atrapalham.
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
    };
  }

  /** Apaga em lotes: uma tabela grande não vira um DELETE único longo, com travas e logs pesados. */
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
      // A rotina roda de novo amanhã. Só a classe e o código do erro vão para o log (nunca a mensagem)
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
