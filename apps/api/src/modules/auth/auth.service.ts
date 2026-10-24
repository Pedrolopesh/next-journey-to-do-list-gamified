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
import { EmailVerificationService } from './email-verification.service.js';
import { IdTokenVerifier, type SocialProvider } from './id-token-verifier.js';
import { Mailer } from './mailer.js';
import { TokensService } from './tokens.service.js';

/** Categorias padrão criadas no cadastro (RF-23), com cores do design system. */
const DEFAULT_CATEGORIES = [
  { name: 'Trabalho', color: '#7c3aed' },
  { name: 'Saúde', color: '#10b981' },
  { name: 'Estudo', color: '#3b82f6' },
  { name: 'Freela', color: '#f59e0b' },
  { name: 'Pessoal', color: '#ef4444' },
] as const;

const invalidVerificationCode = (): AppError =>
  new AppError(400, ERROR_CODES.INVALID_VERIFICATION_CODE, 'Código inválido ou expirado');

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';

const invalidCredentials = (): AppError =>
  new AppError(401, ERROR_CODES.UNAUTHORIZED, 'E-mail ou senha inválidos');

@Injectable()
export class AuthService {
  /** Hash de uma senha qualquer, para gastar o mesmo tempo quando o e-mail não existe. */
  private dummyHash: Promise<string> | undefined;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TokensService) private readonly tokens: TokensService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
    @Inject(Mailer) private readonly mailer: Mailer,
    @Inject(IdTokenVerifier) private readonly verifier: IdTokenVerifier,
    @Inject(EmailVerificationService) private readonly verification: EmailVerificationService,
  ) {}

  /**
   * Cadastro por senha: nunca devolve sessão. Responde igual para e-mail novo, pendente ou já
   * confirmado (sem enumeração); o código só chega ao e-mail e a conta só vale depois de confirmar.
   */
  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const email = input.email.trim().toLowerCase();
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
        // Cadastro ainda pendente: o último cadastro vence; só quem confirma com o código e a senha ativa
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
      // Dois cadastros simultâneos do mesmo e-mail: o outro venceu a corrida, a resposta é a mesma
      if (!isUniqueViolation(error)) throw error;
    }
    return response;
  }

  /** Confirma o e-mail com o código (e a senha do cadastro) e só então entrega a sessão. */
  async verifyEmail(input: VerifyEmailRequest): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    const pending = user && !user.emailVerifiedAt && user.passwordHash ? user : null;
    // Mesmo custo e mesma resposta para qualquer falha (sem enumeração)
    const hash = pending?.passwordHash ?? (await this.getDummyHash());
    const passwordOk = await argon2.verify(hash, input.password).catch(() => false);
    if (!pending) throw invalidVerificationCode();

    if (!(await this.verification.consume(pending.id, input.code, passwordOk))) {
      throw invalidVerificationCode();
    }
    await this.prisma.user.update({
      where: { id: pending.id },
      data: { emailVerifiedAt: this.clock.now() },
    });
    return {
      tokens: await this.tokens.issue(pending.id),
      user: {
        id: pending.id,
        name: pending.name,
        email: pending.email,
        timezone: pending.timezone,
      },
    };
  }

  /** Reenvio do código: responde sempre igual; só envia para conta pendente e fora do intervalo mínimo. */
  async resendVerification(emailInput: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (user && !user.emailVerifiedAt && user.passwordHash) await this.verification.sendCode(user);
  }

  async login(input: LoginRequest): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });

    // Mesma resposta e mesmo custo para e-mail inexistente e senha errada (sem enumeração)
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, input.password).catch(() => false);
    if (!user || !valid) throw invalidCredentials();
    if (!user.emailVerifiedAt) {
      // Só quem sabe a senha chega aqui: o aviso não revela a conta a terceiros
      await this.verification.sendCode(user);
      throw new AppError(403, ERROR_CODES.EMAIL_NOT_VERIFIED, 'Confirme seu e-mail para entrar');
    }

    return {
      tokens: await this.tokens.issue(user.id),
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
   * "Esqueci a senha": responde SEMPRE igual, exista ou não o e-mail (sem enumeração). O link tem o
   * segredo de uso único, válido por 30 minutos; só o sha256 dele fica no banco.
   */
  async forgotPassword(emailInput: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) {
      await this.getDummyHash(); // gasta um tempo parecido
      return;
    }
    const secret = randomBytes(32).toString('base64url');
    const now = this.clock.now();
    await this.prisma.$transaction([
      // Só o link mais recente vale
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
    await this.mailer
      .send({
        to: user.email,
        subject: 'Recuperação de senha do Next Journey',
        text: `Para criar uma nova senha, abra o link no celular em até ${this.env.PASSWORD_RESET_TTL_MINUTES} minutos:\n\n${this.env.PASSWORD_RESET_URL}?token=${secret}\n\nSe você não pediu, ignore este e-mail.`,
      })
      .catch(() => undefined);
  }

  /** Troca a senha com o link de uso único e derruba todas as sessões abertas. */
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
  }

  /**
   * Login social: o app manda só o ID token; a API o valida com o provedor. Vincula ao mesmo usuário
   * quando o e-mail verificado coincide; cria a conta no primeiro acesso (exige o aceite dos termos).
   */
  async socialLogin(provider: SocialProvider, input: SocialLoginRequest): Promise<AuthResponse> {
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
      // Sem e-mail verificado pelo provedor não há como provar a posse: nunca cria nem vincula
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
        user = await this.prisma.user.create({
          data: {
            email,
            passwordHash: null,
            name: identity.name?.trim() || email.split('@')[0] || 'Aventureiro',
            timezone: input.timezone ?? 'UTC',
            termsAcceptedAt: this.clock.now(),
            termsVersion: input.termsVersion,
            emailVerifiedAt: this.clock.now(),
            stats: { create: {} },
            categories: {
              create: DEFAULT_CATEGORIES.map((category, position) => ({ ...category, position })),
            },
            identities: { create: { provider, providerUserId: identity.subject } },
          },
        });
      }
    }

    return {
      tokens: await this.tokens.issue(user.id),
      user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
    };
  }

  /**
   * Liga o login social a uma conta que já existe com o mesmo e-mail (verificado pelo provedor). Se a
   * conta por senha nunca confirmou o e-mail, quem a criou não provou ser dono dele: a conta é
   * confirmada, a senha antiga some e as sessões e códigos abertos deixam de valer.
   */
  private async linkIdentity(
    existing: { id: string; emailVerifiedAt: Date | null },
    provider: SocialProvider,
    providerUserId: string,
  ) {
    const now = this.clock.now();
    const identity = this.prisma.authIdentity.create({
      data: { userId: existing.id, provider, providerUserId },
    });
    if (existing.emailVerifiedAt) {
      await identity;
      return this.prisma.user.findUniqueOrThrow({ where: { id: existing.id } });
    }
    const [, user] = await this.prisma.$transaction([
      identity,
      this.prisma.user.update({
        where: { id: existing.id },
        data: { emailVerifiedAt: now, passwordHash: null },
      }),
      this.prisma.emailVerification.updateMany({
        where: { userId: existing.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    return user;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash('senha-que-nunca-sera-usada', { type: argon2.argon2id });
    return this.dummyHash;
  }
}
