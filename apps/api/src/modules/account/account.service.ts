import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { type DeleteAccountRequest, ERROR_CODES } from '@nextjourney/contracts';
import * as argon2 from 'argon2';
import { Logger } from 'nestjs-pino';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IdTokenVerifier } from '../auth/id-token-verifier.js';
import { RateLimitService } from '../auth/rate-limit.service.js';
import { SecurityEvents } from '../security/security-events.service.js';

/** Proof attempts per account: 5 every 15 minutes. */
const REAUTH_LIMIT = { limit: 5, windowMs: 15 * 60_000 };
/**
 * The provider's ID token must have been issued at most 5 minutes ago (the owner is present now).
 */
const REAUTH_MAX_TOKEN_AGE_MS = 5 * 60_000;
const reauthFailed = (): AppError =>
  new AppError(403, ERROR_CODES.REAUTH_FAILED, 'Não foi possível confirmar sua identidade');

const DAY_MS = 24 * 60 * 60 * 1000;
/** Days until an account whose email was never confirmed is deleted. */
const UNVERIFIED_ACCOUNT_DAYS = 7;

/**
 * Account deletion (privacy requirement): anonymizes right away and deletes for good after the
 * retention period.
 */
@Injectable()
export class AccountService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
    @Inject(Logger) private readonly logger: Logger,
    @Inject(IdTokenVerifier) private readonly verifier: IdTokenVerifier,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(SecurityEvents) private readonly events: SecurityEvents,
  ) {}

  /**
   * Removes everything that identifies the person and ends the sessions. The original email is
   * released (the person can sign up again); the rest of the data disappears in the purge.
   */
  async requestDeletion(userId: string, proof: DeleteAccountRequest): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');
    try {
      await this.confirmOwner(user, proof);
    } catch (error) {
      if (error instanceof AppError && error.code === ERROR_CODES.REAUTH_FAILED) {
        this.events.record('reauth_failed', { userId });
      }
      throw error;
    }

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
    this.events.record('account_deleted', { userId });
  }

  /**
   * Second proof before deleting: the current password (password account) or a fresh provider ID
   * token whose identity is linked to the account (social-only account). Counts every attempt; any
   * failure gives the same 403 (never 401, so the app does not treat it as an ended session).
   */
  private async confirmOwner(
    user: { id: string; passwordHash: string | null },
    proof: DeleteAccountRequest,
  ): Promise<void> {
    await this.rateLimit.hit('delete-account', user.id, REAUTH_LIMIT);
    if (user.passwordHash) {
      if (!('password' in proof)) throw reauthFailed();
      const ok = await argon2.verify(user.passwordHash, proof.password).catch(() => false);
      if (!ok) throw reauthFailed();
      await this.rateLimit.reset('delete-account', user.id);
      return;
    }
    if (!('idToken' in proof)) throw reauthFailed();
    const identity = await this.verifier.verify(proof.provider, proof.idToken).catch(() => null);
    if (!identity) throw reauthFailed();
    // An old token (leaked or replayed) does not prove presence now. Without `iat` the provider
    // gave no way to know: refuse.
    const age =
      identity.issuedAt === undefined
        ? Infinity
        : this.clock.now().getTime() - identity.issuedAt * 1000;
    if (age > REAUTH_MAX_TOKEN_AGE_MS) throw reauthFailed();
    const linked = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: { provider: proof.provider, providerUserId: identity.subject },
      },
      select: { userId: true },
    });
    if (linked?.userId !== user.id) throw reauthFailed();
    await this.rateLimit.reset('delete-account', user.id);
  }

  /**
   * Deletes for good the accounts removed more than ACCOUNT_PURGE_DAYS ago (cascades to child
   * tables).
   */
  async purgeExpired(): Promise<number> {
    const limit = new Date(this.clock.now().getTime() - this.env.ACCOUNT_PURGE_DAYS * DAY_MS);
    const result = await this.prisma.user.deleteMany({ where: { deletedAt: { lt: limit } } });
    // Password sign-up that never confirmed its email (the codes go in cascade).
    const pendingLimit = new Date(this.clock.now().getTime() - UNVERIFIED_ACCOUNT_DAYS * DAY_MS);
    const pending = await this.prisma.user.deleteMany({
      where: { emailVerifiedAt: null, identities: { none: {} }, createdAt: { lt: pendingLimit } },
    });
    return result.count + pending.count;
  }

  @Cron('0 3 * * *')
  async purgeJob(): Promise<void> {
    const count = await this.purgeExpired();
    if (count > 0) this.logger.log({ count }, 'contas excluídas removidas de vez');
  }
}
