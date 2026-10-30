import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { ENV, type Env } from '../../config/env.js';

/** Sends transactional email. Swappable in tests by a fake that captures the message. */
export abstract class Mailer {
  abstract send(message: { to: string; subject: string; text: string }): Promise<void>;

  /**
   * Sends without waiting: the route response does not depend on the provider. A failure never
   * reaches the requester.
   */
  sendInBackground(message: { to: string; subject: string; text: string }): void {
    void Promise.resolve()
      .then(() => this.send(message))
      .catch(() => undefined);
  }
}

/** Resend (https://resend.com). Without RESEND_API_KEY nothing is sent (development). */
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
      // Never logs the recipient. The text (with code or link) only shows in development without a
      // Resend key, where no email goes out anyway.
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
      // Only the error class (network, timeout): never the recipient or the content.
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
