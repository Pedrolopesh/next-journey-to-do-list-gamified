import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './jwt-auth.guard.js';

/** Authenticated user id (comes from the JWT, never from the request body). */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user.id,
);

/** Current session id (refresh token family), when the access token carries it. */
export const CurrentSessionId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user.sessionId,
);
