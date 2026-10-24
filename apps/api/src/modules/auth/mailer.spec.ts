import type { Logger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../../config/env.js';
import { ResendMailer } from './mailer.js';

const message = { to: 'pessoa@exemplo.com', subject: 'Assunto', text: 'Seu código é 123456.' };

const build = (nodeEnv: Env['NODE_ENV']) => {
  const logger = { warn: vi.fn(), error: vi.fn() };
  const mailer = new ResendMailer({ NODE_ENV: nodeEnv } as Env, logger as unknown as Logger);
  return { mailer, logger };
};

describe('ResendMailer sem chave do Resend', () => {
  it('em desenvolvimento mostra o texto (para testar no emulador), nunca o destinatário', async () => {
    const { mailer, logger } = build('development');
    await mailer.send(message);
    const logged = JSON.stringify(logger.warn.mock.calls);
    expect(logged).toContain('123456');
    expect(logged).not.toContain('pessoa@exemplo.com');
  });

  it.each(['production', 'test'] as const)(
    'em %s não loga destinatário nem conteúdo',
    async (env) => {
      const { mailer, logger } = build(env);
      await mailer.send(message);
      const logged = JSON.stringify(logger.warn.mock.calls);
      expect(logged).not.toContain('123456');
      expect(logged).not.toContain('pessoa@exemplo.com');
    },
  );
});
