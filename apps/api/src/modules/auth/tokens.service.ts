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

/**
 * Reads the JWT header `kid` without trusting it: it only picks which key to try; the signature
 * decides.
 */
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
 * Access token: short JWT (HS256). Refresh token: random `<id>.<secret>`; only the secret's sha256
 * is stored. Every refresh rotates the token; reusing an already used one revokes the whole family
 * (a sign of a stolen token).
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

  /** Creates a token pair. Without `familyId`, opens a new family (login). */
  async issue(
    userId: string,
    familyId: string = randomUUID(),
    deviceName: string | null = null,
  ): Promise<AuthTokens> {
    const refreshToken = await this.createRefreshToken(this.prisma, userId, familyId, deviceName);
    return { ...(await this.signAccessToken(userId, familyId)), refreshToken };
  }

  /** Stores the new refresh token (inside transaction `db` when rotation must be atomic). */
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

  /**
   * The `sid` (session id = refresh token family) lets the API know which session is the current
   * one.
   */
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
   * Checks the access token: HS256 signature, validity, issuer and audience. The header `kid` picks
   * the key (the current one or the previous one during a secret change); an unknown `kid` uses the
   * current one and is refused if the signature does not match. Returns the user id (and the
   * session id, when the token has one) or throws.
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

  /** Swaps a valid refresh token for a new pair (rotation). */
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
      // Reuse of an already rotated token: ends the whole session.
      this.events.record('refresh_reuse_detected', { userId: stored.userId });
      await this.revokeFamily(stored.familyId);
      throw unauthorized();
    }
    if (stored.expiresAt <= this.clock.now()) throw unauthorized();

    // Revoking the old token and creating the new one is a single operation: the conditional UPDATE
    // (revokedAt null and still valid) lets only ONE of several simultaneous requests with the same
    // token through.
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
      // Transaction conflict under concurrency: deny (fail closed). Any other error (database down)
      // stays a 5xx, otherwise the app would treat a temporary failure as an ended session and sign
      // the person out.
      if ((error as { code?: unknown }).code === 'P2034') throw unauthorized();
      throw error;
    }
    if (!next) {
      // Lost the race: the same token was used twice, treated as reuse (possibly stolen token).
      this.events.record('refresh_reuse_detected', { userId: stored.userId });
      await this.revokeFamily(stored.familyId);
      throw unauthorized();
    }
    return {
      userId: stored.userId,
      tokens: { ...access, refreshToken: next },
    };
  }

  /** Logout: revokes the family of the given refresh token. Silent if the token is invalid. */
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
