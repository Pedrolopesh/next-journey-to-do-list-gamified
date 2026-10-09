import { Inject, Injectable } from '@nestjs/common';
import {
  type AuthResponse,
  ERROR_CODES,
  type LoginRequest,
  type RegisterRequest,
} from '@nextjourney/contracts';
import * as argon2 from 'argon2';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import { PrismaService } from '../../prisma/prisma.service.js';
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

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash('senha-que-nunca-sera-usada', { type: argon2.argon2id });
    return this.dummyHash;
  }
}
