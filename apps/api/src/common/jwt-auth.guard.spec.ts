import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../prisma/prisma.service.js';
import { AppError } from './app-error.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const USER_ID = '5f0f4d4e-6b43-4f5e-9f55-0d1c1b8a8b11';

function build(findFirst: () => Promise<{ id: string } | null>) {
  const request: { headers: Record<string, string>; user?: { id: string } } = {
    headers: { authorization: 'Bearer token-de-teste' }, // scan-allow: token falso de teste
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const guard = new JwtAuthGuard(
    { getAllAndOverride: () => false } as unknown as Reflector,
    { verifyAsync: () => Promise.resolve({ sub: USER_ID }) } as unknown as JwtService,
    { user: { findFirst: vi.fn(findFirst) } } as unknown as PrismaService,
  );
  return { guard, context, request };
}

describe('JwtAuthGuard com a conta', () => {
  it('conta existente passa e o id vem do banco', async () => {
    const { guard, context, request } = build(() => Promise.resolve({ id: USER_ID }));
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: USER_ID });
  });

  it('conta excluída ou inexistente dá 401', async () => {
    const { guard, context } = build(() => Promise.resolve(null));
    await expect(guard.canActivate(context)).rejects.toMatchObject({ status: 401 });
  });

  it('falha do banco NÃO vira 401 (não desloga o app), mas também nega o acesso', async () => {
    const { guard, context } = build(() => Promise.reject(new Error('banco fora')));
    const error = await guard.canActivate(context).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AppError);
  });
});
