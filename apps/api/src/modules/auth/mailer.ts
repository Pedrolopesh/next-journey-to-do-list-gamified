import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { ENV, type Env } from '../../config/env.js';

/** Envio de e-mail transacional. Trocável nos testes por um fake que captura a mensagem. */
export abstract class Mailer {
  abstract send(message: { to: string; subject: string; text: string }): Promise<void>;

  /** Envio sem esperar: a resposta da rota não depende do provedor. Falha não vaza para quem pediu. */
  sendInBackground(message: { to: string; subject: string; text: string }): void {
    void Promise.resolve()
      .then(() => this.send(message))
      .catch(() => undefined);
  }
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
      // Nunca loga o destinatário. O texto (com código ou link) só aparece em desenvolvimento sem chave
      // do Resend, onde nenhum e-mail sai de qualquer forma
      if (this.env.NODE_ENV === 'development') {
        this.logger.warn(
          `RESEND_API_KEY ausente: e-mail não enviado (desenvolvimento)\n${message.text}`,
        );
      } else {
        this.logger.warn('RESEND_API_KEY ausente: e-mail não enviado');
      }
      return;
    }
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
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
    } catch (error) {
      // Só a classe do erro (rede, tempo esgotado): nunca destinatário nem conteúdo
      this.logger.error(
        { error: error instanceof Error ? error.name : 'desconhecido' },
        'Falha de rede ao enviar e-mail pelo Resend',
      );
      return;
    }
    if (!response.ok) {
      this.logger.error({ status: response.status }, 'Falha ao enviar e-mail pelo Resend');
    }
  }
}
