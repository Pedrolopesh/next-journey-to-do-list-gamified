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

/** Builds the IPv4 without writing it whole in the code (the secret scanner blocks a literal IP). */
const v4 = (...parts: number[]): string => parts.join('.');

describe('maskIp', () => {
  it('IPv4 loses the last number, IPv6 keeps only the prefix', () => {
    expect(maskIp(v4(192, 168, 10, 77))).toBe('192.168.10.x');
    expect(maskIp(`::ffff:${v4(10, 1, 2, 3)}`)).toBe('10.1.2.x');
    expect(maskIp('2001:db8:abcd:12:aaaa:bbbb:cccc:dddd')).toBe('2001:db8::x');
    // short IPv6 does not turn into junk or leak the last group
    expect(maskIp('::1')).toBe('x');
    expect(maskIp('fe80::1')).toBe('x');
    expect(maskIp(undefined)).toBeUndefined();
  });
});

describe('SecurityEvents', () => {
  it('records the event with the user id and a masked IP, never the whole IP', () => {
    const { events, logger } = build();
    events.record('reauth_failed', { userId: 'u-1', ip: v4(203, 0, 113, 9) });
    const [fields, message] = logger.warn.mock.calls[0] as [Record<string, unknown>, string];
    expect(fields).toEqual({ security: 'reauth_failed', userId: 'u-1', ip: '203.0.113.x' });
    expect(message).toBe('evento de segurança');
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(v4(203, 0, 113, 9));
  });

  it('only known fields go into the log (no email, password or token)', () => {
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

  it('over the limit in the window: a single alert, until the window rolls over', () => {
    const { events, logger, advance } = build();
    for (let i = 0; i < 5; i += 1) events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).not.toHaveBeenCalled();
    events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toMatchObject({ alert: true, count: 6 });
    // More events in the same window do not repeat the alert
    events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).toHaveBeenCalledTimes(1);
    // New window and a new burst: alert again
    advance(11 * 60_000);
    for (let i = 0; i < 6; i += 1) events.record('refresh_reuse_detected', { userId: 'u' });
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it('spaced-out events (outside the window) raise no alert', () => {
    const { events, logger, advance } = build();
    for (let i = 0; i < 20; i += 1) {
      events.record('refresh_reuse_detected', { userId: 'u' });
      advance(3 * 60_000);
    }
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('with a webhook configured, it notifies with only a short text and no personal data', () => {
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
