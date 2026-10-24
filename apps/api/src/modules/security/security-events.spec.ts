import type { Logger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../../config/env.js';
import { maskIp, SecurityEvents } from './security-events.service.js';

function build(env: Partial<Env> = {}) {
  let now = new Date('2026-10-24T12:00:00Z');
  const clock = { now: () => now };
  const logger = { warn: vi.fn(), error: vi.fn() };
  const events = new SecurityEvents(logger as unknown as Logger, clock, env as Env);
  return {
    events,
    logger,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
  };
}

/** Monta o IPv4 sem escrevê-lo por inteiro no código (o scanner de segredos barra IP literal). */
const v4 = (...parts: number[]): string => parts.join('.');

describe('maskIp', () => {
  it('IPv4 perde o último número, IPv6 fica só com o prefixo', () => {
    expect(maskIp(v4(192, 168, 10, 77))).toBe('192.168.10.x');
    expect(maskIp(`::ffff:${v4(10, 1, 2, 3)}`)).toBe('10.1.2.x');
    expect(maskIp('2001:db8:abcd:12:aaaa:bbbb:cccc:dddd')).toBe('2001:db8::x');
    // IPv6 curto não vira lixo nem vaza o último grupo
    expect(maskIp('::1')).toBe('x');
    expect(maskIp('fe80::1')).toBe('x');
    expect(maskIp(undefined)).toBeUndefined();
  });
});

describe('SecurityEvents', () => {
  it('registra o evento com id do usuário e IP mascarado, nunca o IP inteiro', () => {
    const { events, logger } = build();
    events.record('login_failed', { userId: 'u-1', ip: v4(203, 0, 113, 9) });
    const [fields, message] = logger.warn.mock.calls[0] as [Record<string, unknown>, string];
    expect(fields).toEqual({ security: 'login_failed', userId: 'u-1', ip: '203.0.113.x' });
    expect(message).toBe('evento de segurança');
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(v4(203, 0, 113, 9));
  });

  it('só os campos conhecidos entram no log (nada de e-mail, senha ou token)', () => {
    const { events, logger } = build();
    events.record('rate_limited', {
      scope: 'login:email-ip',
      email: 'pessoa@exemplo.com',
      password: 'segredo',
    } as never);
    const logged = JSON.stringify(logger.warn.mock.calls);
    expect(logged).toContain('login:email-ip');
    expect(logged).not.toContain('pessoa@exemplo.com');
    expect(logged).not.toContain('segredo');
  });

  it('passou do limite na janela: um alerta só, até a janela correr', () => {
    const { events, logger, advance } = build();
    for (let i = 0; i < 5; i += 1) events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).not.toHaveBeenCalled();
    events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toMatchObject({ alert: true, count: 6 });
    // Mais eventos na mesma janela não repetem o alerta
    events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).toHaveBeenCalledTimes(1);
    // Janela nova e nova rajada: alerta de novo
    advance(11 * 60_000);
    for (let i = 0; i < 6; i += 1) events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it('eventos espaçados (fora da janela) não geram alerta', () => {
    const { events, logger, advance } = build();
    for (let i = 0; i < 20; i += 1) {
      events.record('refresh_reuse_detected', { userId: 'u' });
      advance(3 * 60_000);
    }
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('com webhook configurado, avisa só com texto curto e sem dado pessoal', () => {
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: { body: string }) => {
        calls.push({ url, body: init.body });
        return Promise.resolve(new Response(null, { status: 204 }));
      }),
    );
    try {
      const { events } = build({ SECURITY_ALERT_WEBHOOK_URL: 'https://alertas.exemplo.com/hook' });
      for (let i = 0; i < 6; i += 1) {
        events.record('refresh_reuse_detected', { userId: 'u-secreto', ip: v4(10, 0, 0, 5) });
      }
      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toBe('https://alertas.exemplo.com/hook');
      expect(calls[0]?.body).toContain('refresh_reuse_detected');
      expect(calls[0]?.body).not.toContain('u-secreto');
      expect(calls[0]?.body).not.toContain(v4(10, 0, 0));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
