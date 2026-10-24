import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AuthTokens, ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SecurityEvents } from '../security/security-events.service.js';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

/** Lê o `kid` do cabeçalho do JWT sem confiar nele: só escolhe qual chave tentar; a assinatura decide. */
function readKeyId(token: string): string | undefined {
  try {
    const header = JSON.parse(
      Buffer.from(token.split('.')[0] ?? '', 'base64url').toString('utf8'),
    ) as {
      kid?: unknown;
    };
    return typeof header.kid === 'string' ? header.kid : undefined;
  } catch {
    return undefined;
  }
}

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
    @Inject(SecurityEvents) private readonly events: SecurityEvents,
  ) {}

  /** Cria um par de tokens. Sem `familyId`, abre uma família nova (login). */
  async issue(
    userId: string,
    familyId: string = randomUUID(),
    deviceName: string | null = null,
  ): Promise<AuthTokens> {
    const refreshToken = await this.createRefreshToken(this.prisma, userId, familyId, deviceName);
    return { ...(await this.signAccessToken(userId, familyId)), refreshToken };
  }

  /** Grava o refresh token novo (na transação `db`, quando a rotação precisa ser atômica). */
  private async createRefreshToken(
    db: Pick<Prisma.TransactionClient, 'refreshToken'>,
    userId: string,
    familyId: string,
    deviceName: string | null,
  ): Promise<string> {
    const now = this.clock.now();
    const id = randomUUID();
    const secret = randomBytes(32).toString('base64url');
    await db.refreshToken.create({
      data: {
        id,
        userId,
        familyId,
        deviceName,
        tokenHash: sha256(secret),
        expiresAt: new Date(now.getTime() + this.env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
      },
    });
    return `${id}.${secret}`;
  }

  /** O `sid` (id da sessão = família do refresh token) deixa a API saber qual é a sessão atual. */
  private async signAccessToken(
    userId: string,
    familyId: string,
  ): Promise<Omit<AuthTokens, 'refreshToken'>> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, sid: familyId },
      {
        expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
        issuer: this.env.JWT_ISSUER,
        audience: this.env.JWT_AUDIENCE,
        keyid: this.env.JWT_KEY_ID,
      },
    );
    return { accessToken, expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS };
  }

  /**
   * Confere o token de acesso: assinatura HS256, validade, emissor e audiência. O `kid` do cabeçalho
   * escolhe a chave (a atual ou a anterior durante a troca do segredo); `kid` desconhecido usa a atual
   * e, se a assinatura não bater, é recusado. Devolve o id do usuário (e da sessão, quando o token tem) ou lança erro.
   */
  async verifyAccessToken(token: string): Promise<{ userId: string; sessionId?: string }> {
    const payload = await this.jwt.verifyAsync<{ sub?: string; sid?: string }>(token, {
      secret: this.secretFor(token),
      algorithms: ['HS256'],
      issuer: this.env.JWT_ISSUER,
      audience: this.env.JWT_AUDIENCE,
    });
    if (!payload.sub) throw new Error('sem sub');
    return {
      userId: payload.sub,
      ...(typeof payload.sid === 'string' ? { sessionId: payload.sid } : {}),
    };
  }

  private secretFor(token: string): string {
    const { JWT_PREVIOUS_KEY_ID: previousId, JWT_ACCESS_SECRET_PREVIOUS: previousSecret } =
      this.env;
    if (previousId && previousSecret) {
      const kid = readKeyId(token);
      if (kid === previousId) return previousSecret;
    }
    return this.env.JWT_ACCESS_SECRET;
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
      this.events.record('refresh_reuse_detected', { userId: stored.userId });
      await this.revokeFamily(stored.familyId);
      throw unauthorized();
    }
    if (stored.expiresAt <= this.clock.now()) throw unauthorized();

    // Revogar o antigo e criar o novo é uma operação só: o UPDATE condicional (revokedAt nulo e ainda
    // válido) deixa passar apenas UMA de várias requisições simultâneas com o mesmo token
    const now = this.clock.now();
    const access = await this.signAccessToken(stored.userId, stored.familyId);
    let next: string | null;
    try {
      next = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.refreshToken.updateMany({
          where: { id, revokedAt: null, expiresAt: { gt: now } },
          data: { revokedAt: now },
        });
        if (claimed.count !== 1) return null;
        return this.createRefreshToken(tx, stored.userId, stored.familyId, stored.deviceName);
      });
    } catch (error) {
      // Conflito de transação sob concorrência: nega (falha fechada). Outro erro (banco fora) segue como
      // 5xx, senão o app trataria uma falha temporária como sessão encerrada e deslogaria a pessoa
      if ((error as { code?: unknown }).code === 'P2034') throw unauthorized();
      throw error;
    }
    if (!next) {
      // Perdeu a corrida: o mesmo token foi usado duas vezes, tratado como reuso (token possivelmente roubado)
      this.events.record('refresh_reuse_detected', { userId: stored.userId });
      await this.revokeFamily(stored.familyId);
      throw unauthorized();
    }
    return {
      userId: stored.userId,
      tokens: { ...access, refreshToken: next },
    };
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
