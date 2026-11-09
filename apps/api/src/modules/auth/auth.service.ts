import { Inject, Injectable } from '@nestjs/common';
import {
  type AuthResponse,
  type EmailConfirmRequest,
  type EmailStartRequest,
  ERROR_CODES,
  type SocialLoginRequest,
} from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DEFAULT_CATEGORIES } from '../categories/default-categories.js';
import { StarterItemsService } from '../items/starter-items.service.js';
import { cleanDeviceName } from './device-name.js';
import { EmailVerificationService } from './email-verification.service.js';
import { IdTokenVerifier, type SocialProvider } from './id-token-verifier.js';
import { LIMITS, RateLimitService } from './rate-limit.service.js';
import { TokensService } from './tokens.service.js';

const invalidVerificationCode = (): AppError =>
  new AppError(400, ERROR_CODES.INVALID_VERIFICATION_CODE, 'Código inválido ou expirado');

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';

/** Placeholder profile name for accounts created by email: the part before the "@". */
const displayNameOf = (email: string): string => email.split('@')[0]?.slice(0, 80) || 'Aventureiro';

const invalidSession = (): AppError =>
  new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Sessão inválida');

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TokensService) private readonly tokens: TokensService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(IdTokenVerifier) private readonly verifier: IdTokenVerifier,
    @Inject(EmailVerificationService) private readonly verification: EmailVerificationService,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(StarterItemsService) private readonly starterItems: StarterItemsService,
  ) {}

  /**
   * Passwordless entry, step 1: always answers the same. An unknown email gets a pending account
   * (no password); every email gets a code, subject to the minimum interval between sends.
   */
  async emailStart(input: EmailStartRequest, ip: string): Promise<void> {
    const email = input.email.trim().toLowerCase();
    await this.rateLimit.hitBoth('email-start', email, ip, LIMITS.emailStart);
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, deletedAt: true },
    });
    if (existing) {
      if (!existing.deletedAt) await this.verification.sendCode(existing);
      return;
    }
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          name: displayNameOf(email),
          timezone: input.timezone ?? 'America/Sao_Paulo',
          termsAcceptedAt: this.clock.now(),
          termsVersion: input.termsVersion ?? 'unknown',
          stats: { create: {} },
          categories: {
            create: DEFAULT_CATEGORIES.map((category, position) => ({ ...category, position })),
          },
        },
        select: { id: true, email: true },
      });
      await this.verification.sendCode(user);
    } catch (error) {
      // Two simultaneous requests for the same new email: the other one won the race.
      if (!isUniqueViolation(error)) throw error;
    }
  }

  /**
   * Passwordless entry, step 2: trades the code for a session. The first confirmation marks the
   * email as confirmed and creates the starter items, in the same transaction as the code.
   */
  async emailConfirm(
    input: EmailConfirmRequest,
    ip: string,
    deviceName?: string,
  ): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    await this.rateLimit.hitBoth('verify-email', email, ip, LIMITS.verifyEmail);
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) throw invalidVerificationCode();

    const now = this.clock.now();
    const confirmed = await this.prisma.$transaction(async (tx) => {
      if (!(await this.verification.consume(user.id, input.code, tx))) return false;
      if (!user.emailVerifiedAt) {
        await tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now } });
        await this.starterItems.seed(tx, { userId: user.id, timezone: user.timezone, now });
      }
      return true;
    });
    if (!confirmed) throw invalidVerificationCode();
    return {
      tokens: await this.tokens.issue(user.id, undefined, cleanDeviceName(deviceName)),
      user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { userId, tokens } = await this.tokens.rotate(refreshToken);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, email: true, timezone: true },
    });
    if (!user) throw invalidSession();
    return { tokens, user };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }

  /**
   * Social login: the app sends only the ID token and the API validates it with the provider. Links
   * to the same user when the verified email matches; creates the account on the first sign-in
   * (requires accepting the terms).
   */
  async socialLogin(
    provider: SocialProvider,
    input: SocialLoginRequest,
    deviceName?: string,
  ): Promise<AuthResponse> {
    const identity = await this.verifier.verify(provider, input.idToken);
    const email = identity.email?.trim().toLowerCase() ?? null;

    const linked = await this.prisma.authIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: identity.subject } },
      include: { user: true },
    });
    let user = linked?.user && !linked.user.deletedAt ? linked.user : null;

    if (!user) {
      if (!email) {
        throw new AppError(400, 'EMAIL_REQUIRED', 'O provedor não informou um e-mail');
      }
      // Without an email verified by the provider, ownership cannot be proven: never create or
      // link.
      if (!identity.emailVerified) {
        throw new AppError(
          400,
          ERROR_CODES.EMAIL_NOT_VERIFIED_BY_PROVIDER,
          'O provedor não confirmou o seu e-mail',
        );
      }
      const existing = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
      if (existing) {
        user = await this.linkIdentity(existing, provider, identity.subject);
      } else {
        if (!input.termsVersion) {
          throw new AppError(
            400,
            'TERMS_REQUIRED',
            'É preciso aceitar os Termos e a Política de Privacidade',
          );
        }
        const { termsVersion } = input;
        const now = this.clock.now();
        user = await this.prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              email,
              name: identity.name?.trim() || email.split('@')[0] || 'Aventureiro',
              timezone: input.timezone ?? 'UTC',
              termsAcceptedAt: now,
              termsVersion,
              emailVerifiedAt: now,
              stats: { create: {} },
              categories: {
                create: DEFAULT_CATEGORIES.map((category, position) => ({
                  ...category,
                  position,
                })),
              },
              identities: { create: { provider, providerUserId: identity.subject } },
            },
          });
          await this.starterItems.seed(tx, { userId: created.id, timezone: created.timezone, now });
          return created;
        });
      }
    }

    return {
      tokens: await this.tokens.issue(user.id, undefined, cleanDeviceName(deviceName)),
      user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
    };
  }

  /**
   * Links the social login to an account that already has the same email (verified by the
   * provider). If the account never confirmed its email (it was created by a code request), whoever
   * asked for the code did not prove ownership: the account is confirmed and open sessions and
   * codes stop working.
   */
  private async linkIdentity(
    existing: { id: string; emailVerifiedAt: Date | null },
    provider: SocialProvider,
    providerUserId: string,
  ) {
    try {
      return await this.linkIdentityOnce(existing, provider, providerUserId);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Two simultaneous sign-ins: the other one already linked the identity. If it was to this
      // account, carry on.
      const linked = await this.prisma.authIdentity.findUnique({
        where: { provider_providerUserId: { provider, providerUserId } },
        include: { user: true },
      });
      if (linked?.userId !== existing.id) throw error;
      return linked.user;
    }
  }

  private async linkIdentityOnce(
    existing: { id: string; emailVerifiedAt: Date | null },
    provider: SocialProvider,
    providerUserId: string,
  ) {
    const now = this.clock.now();
    const data = { userId: existing.id, provider, providerUserId };
    if (existing.emailVerifiedAt) {
      await this.prisma.authIdentity.create({ data });
      return this.prisma.user.findUniqueOrThrow({ where: { id: existing.id } });
    }
    // The account was pending and becomes valid here: confirm and seed together
    return this.prisma.$transaction(async (tx) => {
      await tx.authIdentity.create({ data });
      const user = await tx.user.update({
        where: { id: existing.id },
        data: { emailVerifiedAt: now },
      });
      await tx.emailVerification.updateMany({
        where: { userId: existing.id, usedAt: null },
        data: { usedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.starterItems.seed(tx, { userId: existing.id, timezone: user.timezone, now });
      return user;
    });
  }
}
