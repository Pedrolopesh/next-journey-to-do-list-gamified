import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { ENV, type Env } from '../../config/env.js';

/** Envio de e-mail transacional. Trocável nos testes por um fake que captura a mensagem. */
export abstract class Mailer {
  abstract send(message: { to: string; subject: string; text: string }): Promise<void>;
}

/** Resend (https://resend.com). Sem RESEND_API_KEY nada é enviado (desenvolvimento). */
@Injectable()
export class ResendMailer extends Mailer {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    super();
  }

  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    if (!this.env.RESEND_API_KEY) {
      // Nunca loga destinatário nem conteúdo (pode ter link com token)
      this.logger.warn('RESEND_API_KEY ausente: e-mail não enviado (desenvolvimento)');
      return;
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.env.MAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      this.logger.error({ status: response.status }, 'Falha ao enviar e-mail pelo Resend');
    }
  }
}
