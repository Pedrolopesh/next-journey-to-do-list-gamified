import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES, type Session } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UNKNOWN_DEVICE } from './device-name.js';

/**
 * The account's sessions. A session is a family of refresh tokens (one device): rotation swaps the
 * token but keeps the family, so the list shows one item per device. Everything filters by owner:
 * another person's id is a 404.
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

  /**
   * Ends a session of the account itself (safe to repeat); if it is the current one, it acts as
   * logout.
   */
  async revoke(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, familyId: sessionId, revokedAt: null },
      data: { revokedAt: this.clock.now() },
    });
    if (result.count > 0) return;
    // Already ended (repeated tap, lost response): still a success. It is only a 404 when the
    // session is not even from this account.
    const own = await this.prisma.refreshToken.findFirst({
      where: { userId, familyId: sessionId },
      select: { id: true },
    });
    if (!own) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Sessão não encontrada');
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: this.clock.now() },
    });
  }
}
