import { createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import {
  type AuthResponse,
  ERROR_CODES,
  type LoginRequest,
  type RegisterRequest,
  type RegisterResponse,
  type SocialLoginRequest,
  type VerifyEmailRequest,
} from '@nextjourney/contracts';
import * as argon2 from 'argon2';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DEFAULT_CATEGORIES } from '../categories/default-categories.js';
import { StarterItemsService } from '../items/starter-items.service.js';
import { SecurityEvents } from '../security/security-events.service.js';
import { cleanDeviceName } from './device-name.js';
import { EmailVerificationService } from './email-verification.service.js';
import { IdTokenVerifier, type SocialProvider } from './id-token-verifier.js';
import { Mailer } from './mailer.js';
import { LIMITS, RateLimitService } from './rate-limit.service.js';
import { TokensService } from './tokens.service.js';

const invalidVerificationCode = (): AppError =>
  new AppError(400, ERROR_CODES.INVALID_VERIFICATION_CODE, 'Código inválido ou expirado');

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';

const invalidCredentials = (): AppError =>
  new AppError(401, ERROR_CODES.UNAUTHORIZED, 'E-mail ou senha inválidos');

@Injectable()
export class AuthService {
  /** Hash of any password, to spend the same time when the email does not exist. */
  private dummyHash: Promise<string> | undefined;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TokensService) private readonly tokens: TokensService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
    @Inject(Mailer) private readonly mailer: Mailer,
    @Inject(IdTokenVerifier) private readonly verifier: IdTokenVerifier,
    @Inject(EmailVerificationService) private readonly verification: EmailVerificationService,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(SecurityEvents) private readonly events: SecurityEvents,
    @Inject(StarterItemsService) private readonly starterItems: StarterItemsService,
  ) {}

  /**
   * Password sign-up: never returns a session. Answers the same for a new, pending or already
   * confirmed email (no enumeration); the code only reaches the email and the account only counts
   * once confirmed.
   */
  async register(input: RegisterRequest, ip: string): Promise<RegisterResponse> {
    const email = input.email.trim().toLowerCase();
    await this.rateLimit.hitBoth('register', email, ip, LIMITS.register);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const profile = {
      passwordHash,
      name: input.name.trim(),
      timezone: input.timezone,
      termsAcceptedAt: this.clock.now(),
      termsVersion: input.termsVersion,
    };
    const response: RegisterResponse = { status: 'verification_sent' };

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerifiedAt: true, deletedAt: true },
    });
    if (existing) {
      if (existing.deletedAt) return response;
      if (existing.emailVerifiedAt) {
        await this.verification.sendNotice(existing);
      } else {
        // Sign-up still pending: the last sign-up wins; only whoever confirms with the code and the
        // active password gets in.
        await this.prisma.user.update({ where: { id: existing.id }, data: profile });
        await this.verification.sendCode(existing);
      }
      return response;
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          ...profile,
          stats: { create: {} },
          categories: {
            create: DEFAULT_CATEGORIES.map((category, position) => ({ ...category, position })),
          },
        },
        select: { id: true, email: true },
      });
      await this.verification.sendCode(user);
    } catch (error) {
      // Two simultaneous sign-ups with the same email: the other one won the race, the answer is
      // the same.
      if (!isUniqueViolation(error)) throw error;
    }
    return response;
  }

  /**
   * Confirms the email with the code (and the sign-up password) and only then hands out the
   * session.
   */
  async verifyEmail(
    input: VerifyEmailRequest,
    ip: string,
    deviceName?: string,
  ): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    await this.rateLimit.hitBoth('verify-email', email, ip, LIMITS.verifyEmail);
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    const pending = user && !user.emailVerifiedAt && user.passwordHash ? user : null;
    // Same cost and same answer for any failure (no enumeration).
    const hash = pending?.passwordHash ?? (await this.getDummyHash());
    const passwordOk = await argon2.verify(hash, input.password).catch(() => false);
    if (!pending) throw invalidVerificationCode();

    // Confirm and seed together: if anything fails, the account stays pending and the code stays valid
    const now = this.clock.now();
    const confirmed = await this.prisma.$transaction(async (tx) => {
      if (!(await this.verification.consume(pending.id, input.code, passwordOk, tx))) return false;
      await tx.user.update({ where: { id: pending.id }, data: { emailVerifiedAt: now } });
      await this.starterItems.seed(tx, { userId: pending.id, timezone: pending.timezone, now });
      return true;
    });
    if (!confirmed) throw invalidVerificationCode();
    return {
      tokens: await this.tokens.issue(pending.id, undefined, cleanDeviceName(deviceName)),
      user: {
        id: pending.id,
        name: pending.name,
        email: pending.email,
        timezone: pending.timezone,
      },
    };
  }

  /**
   * Resends the code: always answers the same; only sends to a pending account outside the minimum
   * interval.
   */
  async resendVerification(emailInput: string, ip: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    await this.rateLimit.hitBoth('resend-verification', email, ip, LIMITS.resendVerification);
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (user && !user.emailVerifiedAt && user.passwordHash) await this.verification.sendCode(user);
  }

  async login(input: LoginRequest, ip: string, deviceName?: string): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    // Count the attempt BEFORE checking the password: parallel attempts count too.
    await this.rateLimit.hitBoth('login', email, ip, LIMITS.login);
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });

    // Same answer and same cost for an unknown email and a wrong password (no enumeration).
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, input.password).catch(() => false);
    if (!user || !valid) {
      this.events.record('login_failed', { ip, ...(user ? { userId: user.id } : {}) });
      throw invalidCredentials();
    }
    await this.rateLimit.reset('login:email-ip', `${email}|${ip}`);
    if (!user.emailVerifiedAt) {
      // Only someone who knows the password gets here: the notice does not reveal the account to
      // third parties.
      await this.verification.sendCode(user).catch(() => undefined);
      throw new AppError(403, ERROR_CODES.EMAIL_NOT_VERIFIED, 'Confirme seu e-mail para entrar');
    }

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
    if (!user) throw invalidCredentials();
    return { tokens, user };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }

  /**
   * "Forgot password": ALWAYS answers the same, whether or not the email exists (no enumeration).
   * The link carries a single-use secret valid for 30 minutes; only its sha256 is stored.
   */
  async forgotPassword(emailInput: string, ip: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    await this.rateLimit.hitBoth('forgot-password', email, ip, LIMITS.forgotPassword);
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) {
      await this.getDummyHash(); // spends a similar amount of time
      return;
    }
    this.events.record('password_reset_requested', { userId: user.id, ip });
    const secret = randomBytes(32).toString('base64url');
    const now = this.clock.now();
    await this.prisma.$transaction([
      this.prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: createHash('sha256').update(secret).digest('hex'),
          expiresAt: new Date(now.getTime() + this.env.PASSWORD_RESET_TTL_MINUTES * 60_000),
        },
      }),
    ]);
    // Do not wait for the send: the response time must not depend on the email provider.
    this.mailer.sendInBackground({
      to: user.email,
      subject: 'Recuperação de senha do Next Journey',
      text: `Para criar uma nova senha, abra o link no celular em até ${this.env.PASSWORD_RESET_TTL_MINUTES} minutos:\n\n${this.env.PASSWORD_RESET_URL}?token=${secret}\n\nSe você não pediu, ignore este e-mail.`,
    });
  }

  /** Sets a new password with the single-use link and ends every open session. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const reset = await this.prisma.passwordReset.findUnique({ where: { tokenHash } });
    const now = this.clock.now();
    if (!reset || reset.usedAt || reset.expiresAt <= now) {
      throw new AppError(400, 'INVALID_RESET_TOKEN', 'Link inválido ou expirado');
    }
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: now } }),
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    this.events.record('password_reset_completed', { userId: reset.userId });
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
              passwordHash: null,
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
   * provider). If the password account never confirmed its email, whoever created it did not prove
   * ownership: the account is confirmed, the old password disappears and open sessions and codes
   * stop working.
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
        data: { emailVerifiedAt: now, passwordHash: null },
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

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash('senha-que-nunca-sera-usada', { type: argon2.argon2id });
    return this.dummyHash;
  }
}
