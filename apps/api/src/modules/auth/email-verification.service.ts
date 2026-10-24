import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Mailer } from './mailer.js';

/** Validade do código, tentativas erradas aceitas por código e intervalo mínimo entre e-mails. */
export const VERIFICATION_TTL_MS = 15 * 60_000;
export const VERIFICATION_MAX_ATTEMPTS = 5;
export const VERIFICATION_RESEND_INTERVAL_MS = 60_000;

type Recipient = { id: string; email: string };

/**
 * Código de 6 dígitos que prova a posse do e-mail. Só o hash fica no banco; vale 15 minutos, uma vez,
 * e trava depois de 5 tentativas erradas. O e-mail sai sem a resposta esperar por ele.
 */
@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(Mailer) private readonly mailer: Mailer,
  ) {}

  /** Gera um código novo e envia, a menos que o último e-mail tenha menos de 60 segundos. */
  async sendCode(user: Recipient): Promise<void> {
    const code = await this.reserve(user.id, true);
    if (!code) return;
    this.deliver({
      to: user.email,
      subject: 'Seu código de confirmação do Next Journey',
      text: `Seu código para confirmar o e-mail é ${code}. Ele vale por 15 minutos.\n\nSe você não pediu, ignore este e-mail.`,
    });
  }

  /** Aviso (sem código) para quem tenta cadastrar um e-mail que já tem conta confirmada. */
  async sendNotice(user: Recipient): Promise<void> {
    if (!(await this.reserve(user.id, false))) return;
    this.deliver({
      to: user.email,
      subject: 'Tentativa de cadastro no Next Journey',
      text: 'Alguém tentou criar uma conta no Next Journey com este e-mail, que já tem conta. Se foi você, entre com sua senha ou use "Esqueci a senha". Se não foi, ignore este e-mail.',
    });
  }

  /**
   * Consome o código: certo e dentro da validade devolve true (uso único); errado conta uma tentativa
   * e a quinta errada invalida o código. Nunca diz se o motivo foi expiração, tentativas ou erro.
   * A senha errada não prova nada e não gasta tentativas: assim quem só sabe o e-mail da vítima não
   * consegue invalidar o código dela. A tentativa é reservada num UPDATE condicional, então
   * requisições paralelas não passam do limite.
   */
  async consume(userId: string, code: string, passwordOk: boolean): Promise<boolean> {
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
      // Uso único mesmo sob duas confirmações simultâneas
      const claimed = await this.prisma.emailVerification.updateMany({
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
   * Registra o envio respeitando o intervalo mínimo. Com `withCode`, gera e guarda um código novo e o
   * devolve; sem ele, devolve `true` quando o envio é permitido. Falso/nulo = não enviar agora.
   */
  private async reserve(userId: string, withCode: true): Promise<string | null>;
  private async reserve(userId: string, withCode: false): Promise<boolean>;
  private async reserve(userId: string, withCode: boolean): Promise<string | boolean | null> {
    const now = this.clock.now();
    const earliest = new Date(now.getTime() - VERIFICATION_RESEND_INTERVAL_MS);
    // Um UPDATE condicional reserva o envio: duas chamadas simultâneas não mandam dois e-mails
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
      // Falhou antes de existir código: devolve o intervalo, senão a pessoa fica um minuto sem poder pedir de novo
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

  /** Envio sem esperar: o tempo da resposta não depende de o e-mail existir. Falha não vaza. */
  private deliver(message: { to: string; subject: string; text: string }): void {
    void this.mailer.send(message).catch(() => undefined);
  }
}

const hashCode = (userId: string, code: string): string =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

const sameHash = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
