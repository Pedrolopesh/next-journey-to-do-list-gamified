import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './jwt-auth.guard.js';

/** Id do usuário autenticado (vem do JWT, nunca do corpo da requisição). */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user.id,
);

/** Id da sessão atual (família do refresh token), quando o token de acesso o traz. */
export const CurrentSessionId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user.sessionId,
);
