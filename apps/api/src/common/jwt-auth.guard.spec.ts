import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import type { TokensService } from '../modules/auth/tokens.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AppError } from './app-error.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const USER_ID = '5f0f4d4e-6b43-4f5e-9f55-0d1c1b8a8b11';

function build(findFirst: () => Promise<{ id: string } | null>, sub: string = USER_ID) {
  const request: { headers: Record<string, string>; user?: { id: string } } = {
    headers: { authorization: 'Bearer token-de-teste' }, // scan-allow: fake test token
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const guard = new JwtAuthGuard(
    { getAllAndOverride: () => false } as unknown as Reflector,
    { verifyAccessToken: () => Promise.resolve({ userId: sub }) } as unknown as TokensService,
    { user: { findFirst: vi.fn(findFirst) } } as unknown as PrismaService,
  );
  return { guard, context, request };
}

describe('JwtAuthGuard with the account', () => {
  it('an existing account passes and the id comes from the database', async () => {
    const { guard, context, request } = build(() => Promise.resolve({ id: USER_ID }));
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: USER_ID });
  });

  it('deleted or missing account gives 401', async () => {
    const { guard, context } = build(() => Promise.resolve(null));
    await expect(guard.canActivate(context)).rejects.toMatchObject({ status: 401 });
  });

  it('sub that is not a UUID gives 401 without querying the database', async () => {
    const find = vi.fn(() => Promise.resolve({ id: USER_ID }));
    const { guard, context } = build(find, 'nao-e-uuid');
    await expect(guard.canActivate(context)).rejects.toMatchObject({ status: 401 });
    expect(find).not.toHaveBeenCalled();
  });

  it('database failure does NOT become 401 (does not log the app out), but also denies access', async () => {
    const { guard, context } = build(() => Promise.reject(new Error('banco fora')));
    const error = await guard.canActivate(context).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AppError);
  });
});
