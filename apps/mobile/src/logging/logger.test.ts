import { describe, expect, it } from 'vitest';

import { createLogger, type LogEntry, redact } from './logger';

describe('redact', () => {
  it('hides password, token, email and authorization header at any level', () => {
    const result = redact({
      email: 'a@b.com',
      password: 'x',
      nested: { refreshToken: 't', Authorization: 'Bearer y', ok: 1 },
      list: [{ idToken: 'z' }],
    });
    expect(JSON.stringify(result)).not.toMatch(/a@b|Bearer|"x"|"t"|"z"/);
    expect(result).toMatchObject({ nested: { ok: 1 } });
  });

  it('cuts long texts, big lists and deep structures', () => {
    const long = 'a'.repeat(500);
    expect((redact(long) as string).length).toBeLessThan(260);
    expect((redact(Array.from({ length: 50 }, (_, i) => i)) as unknown[]).length).toBe(11);
    expect(redact({ a: { b: { c: { d: { e: 1 } } } } })).toEqual({ a: { b: { c: { d: '[…]' } } } });
  });
});

describe('createLogger', () => {
  const setup = (verbose: boolean) => {
    const out: LogEntry[] = [];
    const log = createLogger({
      verbose,
      sink: (entry) => out.push(entry),
      now: () => new Date('2026-10-10T12:00:00.000Z'),
      capacity: 3,
    });
    return { log, out };
  };

  it('records an event with time, level and redacted data', () => {
    const { log, out } = setup(true);
    log.info('auth.login', { password: 'x', n: 1 });
    expect(out[0]).toEqual({
      at: '2026-10-10T12:00:00.000Z',
      level: 'info',
      event: 'auth.login',
      data: { password: '[REDACTED]', n: 1 }, // scan-allow: masked value, not a password
    });
  });

  it('debug only shows in verbose mode', () => {
    const quiet = setup(false);
    quiet.log.debug('http.body', { a: 1 });
    expect(quiet.out).toHaveLength(0);
    const loud = setup(true);
    loud.log.debug('http.body', { a: 1 });
    expect(loud.out).toHaveLength(1);
  });

  it('keeps only the latest records', () => {
    const { log } = setup(true);
    for (let i = 0; i < 5; i++) log.info(`e${i}`);
    expect(log.recent().map((entry) => entry.event)).toEqual(['e2', 'e3', 'e4']);
  });
});
