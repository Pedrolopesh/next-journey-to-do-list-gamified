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
 * Guard global: valida o JWT de acesso (algoritmo fixo HS256) em toda rota não pública e confere que a
 * conta ainda existe (busca por chave primária, sem cache): conta excluída perde o acesso na hora, sem
 * esperar os 15 minutos do token.
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
      // O id é um UUID: qualquer outra coisa nem chega ao banco (que rejeitaria com erro 500)
      if (!UUID.test(verified.userId)) throw new Error('sub inválido');
      userId = verified.userId;
      // O id da sessão também é um UUID (e vai para a consulta abaixo)
      if (verified.sessionId !== undefined && !UUID.test(verified.sessionId)) {
        throw new Error('sid inválido');
      }
      sessionId = verified.sessionId;
    } catch {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Não autenticado');
    }

    // Erro de banco aqui NÃO vira 401 (nega o acesso com erro 500): uma falha temporária não pode
    // deslogar o app, que trata 401 como sessão encerrada
    const user = await this.prisma.user.findFirst({
      // Com `sid`, a sessão precisa continuar ativa: encerrar um aparelho (ou trocar a senha, ou sair) derruba
      // o token de acesso na hora, na mesma consulta. Token antigo sem `sid` só confere a conta.
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
