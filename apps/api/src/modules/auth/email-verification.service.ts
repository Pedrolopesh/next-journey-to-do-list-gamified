import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { Clock } from '../../common/clock.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Mailer } from './mailer.js';

/** Code validity, wrong attempts allowed per code and minimum interval between emails. */
export const VERIFICATION_TTL_MS = 15 * 60_000;
export const VERIFICATION_MAX_ATTEMPTS = 5;
export const VERIFICATION_RESEND_INTERVAL_MS = 60_000;

type Recipient = { id: string; email: string };

/**
 * 6-digit code that proves ownership of the email. Only its hash is stored; it is valid for 15
 * minutes, once, and locks after 5 wrong attempts. The email is sent without the response waiting
 * for it.
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(Mailer) private readonly mailer: Mailer,
  ) {}

  /** Generates a new code and sends it, unless the last email was sent less than 60 seconds ago. */
  async sendCode(user: Recipient): Promise<void> {
    const code = await this.reserve(user.id, true);
    if (!code) return;
    this.mailer.sendInBackground({
      to: user.email,
      subject: 'Seu código de confirmação do Next Journey',
      text: `Seu código para confirmar o e-mail é ${code}. Ele vale por 15 minutos.\n\nSe você não pediu, ignore este e-mail.`,
    });
  }

  /**
   * Notice (no code) for someone who tries to sign up with an email that already has a confirmed
   * account.
   */
  async sendNotice(user: Recipient): Promise<void> {
    if (!(await this.reserve(user.id, false))) return;
    this.mailer.sendInBackground({
      to: user.email,
      subject: 'Tentativa de cadastro no Next Journey',
      text: 'Alguém tentou criar uma conta no Next Journey com este e-mail, que já tem conta. Se foi você, entre com sua senha ou use "Esqueci a senha". Se não foi, ignore este e-mail.',
    });
  }

  /**
   * Consumes the code: right and within its validity returns true (single use); wrong counts an
   * attempt and the fifth wrong one invalidates the code. It never says whether the reason was
   * expiry, attempts or a wrong code. A wrong password proves nothing and does not spend attempts,
   * so someone who only knows the victim's email cannot invalidate their code. The attempt is
   * reserved in a conditional UPDATE, so parallel requests cannot exceed the limit. With `tx`, the
   * "used" mark joins the caller's transaction: if it rolls back (for example, seeding fails) the
   * code stays valid. Attempts stay outside the transaction on purpose, so they count even when it
   * rolls back.
   */
  async consume(
    userId: string,
    code: string,
    passwordOk: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    if (!passwordOk) return false;
    const now = this.clock.now();
    const current = await this.prisma.emailVerification.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!current) return false;

    const attempt = await this.prisma.emailVerification.updateMany({
      where: { id: current.id, usedAt: null, attempts: { lt: VERIFICATION_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (attempt.count !== 1) return false;

    if (sameHash(current.codeHash, hashCode(userId, code))) {
      // Single use even under two simultaneous confirmations.
      const claimed = await (tx ?? this.prisma).emailVerification.updateMany({
        where: { id: current.id, usedAt: null },
        data: { usedAt: now },
      });
      return claimed.count === 1;
    }
    await this.prisma.emailVerification.updateMany({
      where: { id: current.id, usedAt: null, attempts: { gte: VERIFICATION_MAX_ATTEMPTS } },
      data: { usedAt: now },
    });
    return false;
  }

  /**
   * Records the send, respecting the minimum interval. With `withCode`, generates and stores a new
   * code and returns it; without it, returns `true` when sending is allowed. False or null means do
   * not send now.
   */
  private async reserve(userId: string, withCode: true): Promise<string | null>;
  private async reserve(userId: string, withCode: false): Promise<boolean>;
  private async reserve(userId: string, withCode: boolean): Promise<string | boolean | null> {
    const now = this.clock.now();
    const earliest = new Date(now.getTime() - VERIFICATION_RESEND_INTERVAL_MS);
    // A conditional UPDATE reserves the send: two simultaneous calls never send two emails.
    const slot = await this.prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ verificationMailSentAt: null }, { verificationMailSentAt: { lte: earliest } }],
      },
      data: { verificationMailSentAt: now },
    });
    if (slot.count !== 1) return withCode ? null : false;
    if (!withCode) return true;

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    try {
      await this.storeCode(userId, code, now);
    } catch (error) {
      // Failed before a code existed: give the interval back, or the person cannot ask again for a
      // minute.
      await this.prisma.user
        .update({ where: { id: userId }, data: { verificationMailSentAt: null } })
        .catch(() => undefined);
      throw error;
    }
    return code;
  }

  private async storeCode(userId: string, code: string, now: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.emailVerification.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.emailVerification.create({
        data: {
          userId,
          codeHash: hashCode(userId, code),
          expiresAt: new Date(now.getTime() + VERIFICATION_TTL_MS),
        },
      }),
    ]);
  }
}

const hashCode = (userId: string, code: string): string =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

const sameHash = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
