import { createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import {
  type AuthResponse,
  ERROR_CODES,
  type LoginRequest,
  type RegisterRequest,
  type SocialLoginRequest,
} from '@nextjourney/contracts';
import * as argon2 from 'argon2';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
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
  ) {}

  async register(input: RegisterRequest): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Sem verificação de e-mail ainda (Fase 5), não há como esconder a existência da conta.
      throw new AppError(409, 'EMAIL_UNAVAILABLE', 'Não foi possível concluir o cadastro');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name.trim(),
        timezone: input.timezone,
        termsAcceptedAt: this.clock.now(),
        termsVersion: input.termsVersion,
        stats: { create: {} },
        categories: {
          create: DEFAULT_CATEGORIES.map((category, position) => ({ ...category, position })),
        },
      },
      select: { id: true, name: true, email: true, timezone: true },
    });

    return { tokens: await this.tokens.issue(user.id), user };
  }

  async login(input: LoginRequest): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });

    // Mesma resposta e mesmo custo para e-mail inexistente e senha errada (sem enumeração)
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, input.password).catch(() => false);
    if (!user || !valid) throw invalidCredentials();

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

    if (!user && email && identity.emailVerified) {
      const existing = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
      if (existing) {
        await this.prisma.authIdentity.create({
          data: { userId: existing.id, provider, providerUserId: identity.subject },
        });
        user = existing;
      }
    }

    if (!user) {
      if (!input.termsVersion) {
        throw new AppError(
          400,
          'TERMS_REQUIRED',
          'É preciso aceitar os Termos e a Política de Privacidade',
        );
      }
      if (!email) {
        throw new AppError(400, 'EMAIL_REQUIRED', 'O provedor não informou um e-mail');
      }
      // E-mail já cadastrado mas NÃO verificado pelo provedor: não vincula (evita tomada de conta)
      const taken = await this.prisma.user.findFirst({
        where: { email, deletedAt: null },
        select: { id: true },
      });
      if (taken)
        throw new AppError(409, 'EMAIL_UNAVAILABLE', 'Não foi possível concluir o cadastro');
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: null,
          name: identity.name?.trim() || email.split('@')[0] || 'Aventureiro',
          timezone: input.timezone ?? 'UTC',
          termsAcceptedAt: this.clock.now(),
          termsVersion: input.termsVersion,
          stats: { create: {} },
          categories: {
            create: DEFAULT_CATEGORIES.map((category, position) => ({ ...category, position })),
          },
          identities: { create: { provider, providerUserId: identity.subject } },
        },
      });
    }

    return {
      tokens: await this.tokens.issue(user.id),
      user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
    };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash('senha-que-nunca-sera-usada', { type: argon2.argon2id });
    return this.dummyHash;
  }
}
