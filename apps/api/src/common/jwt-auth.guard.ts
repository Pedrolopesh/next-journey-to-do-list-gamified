import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_CODES } from '@nextjourney/contracts';
import type { Request } from 'express';

import { TokensService } from '../modules/auth/tokens.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AppError } from './app-error.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AuthenticatedRequest = Request & { user: { id: string; sessionId?: string } };

/**
 * Global guard: validates the access JWT and that the account and session still exist. Rules:
 * docs/api/operacao-e-seguranca.md.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokensService) private readonly tokens: TokensService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Não autenticado');

    let userId: string;
    let sessionId: string | undefined;
    try {
      const verified = await this.tokens.verifyAccessToken(token);
      // The id is a UUID: anything else never reaches the database (which would reject it with a
      // 500).
      if (!UUID.test(verified.userId)) throw new Error('sub inválido');
      userId = verified.userId;
      // The session id is also a UUID (and goes into the query below).
      if (verified.sessionId !== undefined && !UUID.test(verified.sessionId)) {
        throw new Error('sid inválido');
      }
      sessionId = verified.sessionId;
    } catch {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Não autenticado');
    }

    // A database error here must not become a 401: a temporary failure would sign the app out.
    const user = await this.prisma.user.findFirst({
      // With `sid`, the session must still be active, so ending a device drops the token at once.
      // Rules: docs/api/operacao-e-seguranca.md.
      where: {
        id: userId,
        deletedAt: null,
        ...(sessionId ? { refreshTokens: { some: { familyId: sessionId, revokedAt: null } } } : {}),
      },
      select: { id: true },
    });
    if (!user) throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Não autenticado');
    request.user = { id: user.id, ...(sessionId ? { sessionId } : {}) };
    return true;
  }
}
