import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES, type Session } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UNKNOWN_DEVICE } from './device-name.js';

/**
 * Sessões da conta. Uma sessão é uma família de refresh tokens (um aparelho): a rotação troca o token mas
 * mantém a família, então a lista mostra um item por aparelho. Tudo filtra por dono: id de outra pessoa é 404.
 */
@Injectable()
export class SessionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  async list(userId: string, currentSessionId: string | undefined): Promise<Session[]> {
    const active = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: this.clock.now() } },
      select: { familyId: true, deviceName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    if (active.length === 0) return [];
    const firsts = await this.prisma.refreshToken.groupBy({
      by: ['familyId'],
      where: { userId, familyId: { in: active.map((token) => token.familyId) } },
      _min: { createdAt: true },
    });
    const startedAt = new Map(firsts.map((row) => [row.familyId, row._min.createdAt]));
    return active.map((token) => ({
      id: token.familyId,
      deviceName: token.deviceName ?? UNKNOWN_DEVICE,
      createdAt: (startedAt.get(token.familyId) ?? token.createdAt).toISOString(),
      lastUsedAt: token.createdAt.toISOString(),
      current: token.familyId === currentSessionId,
    }));
  }

  /** Encerra uma sessão da própria conta (repetir é seguro); se for a atual, equivale ao logout. */
  async revoke(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, familyId: sessionId, revokedAt: null },
      data: { revokedAt: this.clock.now() },
    });
    if (result.count > 0) return;
    // Já estava encerrada (toque repetido, resposta perdida): continua sendo sucesso. Só é 404 quando a
    // sessão nem é desta conta
    const own = await this.prisma.refreshToken.findFirst({
      where: { userId, familyId: sessionId },
      select: { id: true },
    });
    if (!own) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Sessão não encontrada');
  }

  /** Encerra todas as sessões da conta, inclusive a atual. */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: this.clock.now() },
    });
  }
}
