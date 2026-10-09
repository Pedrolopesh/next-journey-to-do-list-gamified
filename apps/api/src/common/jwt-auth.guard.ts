import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES } from '@nextjourney/contracts';
import type { Request } from 'express';

import { AppError } from './app-error.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export type AuthenticatedRequest = Request & { user: { id: string } };

/** Guard global: valida o JWT de acesso (algoritmo fixo HS256) em toda rota não pública. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwt: JwtService,
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

    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token, {
        algorithms: ['HS256'],
      });
      if (!payload.sub) throw new Error('sem sub');
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Não autenticado');
    }
  }
}
