import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AuthTokens, ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

const unauthorized = (): AppError =>
  new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Sessão inválida ou expirada');

/**
 * Access token: JWT curto (HS256). Refresh token: `<id>.<segredo>` aleatório; só o sha256 do
 * segredo fica no banco. A cada refresh o token é rotacionado; o reuso de um token já usado
 * revoga a família inteira (sinal de token roubado).
 */
@Injectable()
export class TokensService {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Cria um par de tokens. Sem `familyId`, abre uma família nova (login). */
  async issue(userId: string, familyId: string = randomUUID()): Promise<AuthTokens> {
    const now = this.clock.now();
    const id = randomUUID();
    const secret = randomBytes(32).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        id,
        userId,
        familyId,
        tokenHash: sha256(secret),
        expiresAt: new Date(now.getTime() + this.env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
      },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      { expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS },
    );
    return {
      accessToken,
      refreshToken: `${id}.${secret}`,
      expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /** Troca um refresh token válido por um par novo (rotação). */
  async rotate(refreshToken: string): Promise<{ userId: string; tokens: AuthTokens }> {
    const [id, secret] = refreshToken.split('.');
    if (!id || !secret || !/^[0-9a-f-]{36}$/.test(id)) throw unauthorized();

    const stored = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (!stored) throw unauthorized();

    const expected = Buffer.from(stored.tokenHash, 'hex');
    const received = Buffer.from(sha256(secret), 'hex');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw unauthorized();
    }

    if (stored.revokedAt) {
      // Reuso de token já rotacionado: derruba a sessão inteira
      await this.revokeFamily(stored.familyId);
      throw unauthorized();
    }
    if (stored.expiresAt <= this.clock.now()) throw unauthorized();

    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: this.clock.now() },
    });
    const tokens = await this.issue(stored.userId, stored.familyId);
    return { userId: stored.userId, tokens };
  }

  /** Logout: revoga a família do refresh token informado. Silencioso se o token for inválido. */
  async revoke(refreshToken: string): Promise<void> {
    const [id] = refreshToken.split('.');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) return;
    const stored = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (stored) await this.revokeFamily(stored.familyId);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: this.clock.now() },
    });
  }
}
