import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';

import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
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

  async purgeExpired(): Promise<{
    refreshTokens: number;
    passwordResets: number;
    emailVerifications: number;
  }> {
    const limit = new Date(this.clock.now().getTime() - EXPIRED_GRACE_DAYS * DAY_MS);
    const where = { expiresAt: { lt: limit } };
    const [refreshTokens, passwordResets, emailVerifications] = await Promise.all([
      this.prisma.refreshToken.deleteMany({ where }),
      this.prisma.passwordReset.deleteMany({ where }),
      this.prisma.emailVerification.deleteMany({ where }),
    ]);
    return {
      refreshTokens: refreshTokens.count,
      passwordResets: passwordResets.count,
      emailVerifications: emailVerifications.count,
    };
  }

  @Cron('30 3 * * *')
  async purgeJob(): Promise<void> {
    try {
      const counts = await this.purgeExpired();
      this.logger.log(counts, 'tokens, links e códigos expirados removidos');
    } catch {
      // A rotina roda de novo amanhã; a falha não derruba o servidor nem vaza detalhe
      this.logger.error('falha na limpeza de tokens expirados');
    }
  }
}
