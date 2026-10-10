import { describe, expect, it } from 'vitest';

import { createLogger, type LogEntry, redact } from './logger';

describe('redact', () => {
  it('esconde senha, token, e-mail e cabeçalho de autorização em qualquer nível', () => {
    const result = redact({
      email: 'a@b.com',
      password: 'x',
      nested: { refreshToken: 't', Authorization: 'Bearer y', ok: 1 },
      list: [{ idToken: 'z' }],
    });
    expect(JSON.stringify(result)).not.toMatch(/a@b|Bearer|"x"|"t"|"z"/);
    expect(result).toMatchObject({ nested: { ok: 1 } });
  });

  it('corta textos longos, listas grandes e estruturas profundas', () => {
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

  it('registra evento com hora, nível e dados redigidos', () => {
    const { log, out } = setup(true);
    log.info('auth.login', { password: 'x', n: 1 });
    expect(out[0]).toEqual({
      at: '2026-10-10T12:00:00.000Z',
      level: 'info',
      event: 'auth.login',
      data: { password: '[REDACTED]', n: 1 }, // scan-allow: valor mascarado, não é senha
    });
  });

  it('debug só aparece no modo verboso', () => {
    const quiet = setup(false);
    quiet.log.debug('http.body', { a: 1 });
    expect(quiet.out).toHaveLength(0);
    const loud = setup(true);
    loud.log.debug('http.body', { a: 1 });
    expect(loud.out).toHaveLength(1);
  });

  it('guarda só os últimos registros', () => {
    const { log } = setup(true);
    for (let i = 0; i < 5; i++) log.info(`e${i}`);
    expect(log.recent().map((entry) => entry.event)).toEqual(['e2', 'e3', 'e4']);
  });
});
