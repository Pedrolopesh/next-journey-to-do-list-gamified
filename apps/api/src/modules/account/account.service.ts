import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ERROR_CODES } from '@nextjourney/contracts';
import { Logger } from 'nestjs-pino';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Exclusão de conta (RF de privacidade): anonimiza na hora e apaga de vez depois do prazo. */
@Injectable()
export class AccountService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  /**
   * Remove tudo que identifica a pessoa e encerra as sessões. O e-mail original é liberado
   * (a pessoa pode se cadastrar de novo); o restante dos dados some no expurgo.
   */
  async requestDeletion(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const now = this.clock.now();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          email: `excluida-${userId}@invalid.example`,
          name: 'Conta excluída',
          passwordHash: null,
          notifyAt: null,
        },
      }),
      this.prisma.character.updateMany({ where: { userId }, data: { name: 'Conta excluída' } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.authIdentity.deleteMany({ where: { userId } }),
      this.prisma.passwordReset.deleteMany({ where: { userId } }),
    ]);
  }

  /** Apaga de vez as contas excluídas há mais de ACCOUNT_PURGE_DAYS (cascata nas tabelas filhas). */
  async purgeExpired(): Promise<number> {
    const limit = new Date(this.clock.now().getTime() - this.env.ACCOUNT_PURGE_DAYS * DAY_MS);
    const result = await this.prisma.user.deleteMany({ where: { deletedAt: { lt: limit } } });
    return result.count;
  }

  @Cron('0 3 * * *')
  async purgeJob(): Promise<void> {
    const count = await this.purgeExpired();
    if (count > 0) this.logger.log({ count }, 'contas excluídas removidas de vez');
  }
}
