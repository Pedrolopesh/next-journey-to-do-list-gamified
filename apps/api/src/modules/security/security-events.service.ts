import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';

/** Eventos de segurança com nome fixo. Nunca carregam e-mail, senha, token nem corpo de requisição. */
export type SecurityEventType =
  | 'login_failed'
  | 'rate_limited'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'refresh_reuse_detected'
  | 'reauth_failed'
  | 'account_deleted';

type Context = {
  userId?: string;
  /** IP de quem fez o pedido; vai para o log mascarado (IPv4 sem o último número). */
  ip?: string;
  /** Só texto curto e fixo (ex.: o nome da regra de limite), nunca dado da pessoa. */
  scope?: string;
};

/** Contagem anormal por tipo: passou de `limit` eventos em `windowMs`, dispara o alerta (uma vez por janela). */
const ALERTS: Partial<Record<SecurityEventType, { limit: number; windowMs: number }>> = {
  login_failed: { limit: 30, windowMs: 5 * 60_000 },
  rate_limited: { limit: 100, windowMs: 5 * 60_000 },
  refresh_reuse_detected: { limit: 5, windowMs: 10 * 60_000 },
  reauth_failed: { limit: 10, windowMs: 10 * 60_000 },
  password_reset_requested: { limit: 30, windowMs: 10 * 60_000 },
};

/** Mascara o IP para o log: IPv4 perde o último número e IPv6 fica só com os dois primeiros grupos. */
export function maskIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  const v4 = /^(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.exec(ip);
  if (v4) return `${v4[1]}.x`;
  const groups = ip.split(':').filter(Boolean);
  return groups.length >= 3 ? `${groups[0]}:${groups[1]}::x` : 'x';
}

/**
 * Registro de eventos de segurança: uma linha estruturada por evento no log da API (campo `security`),
 * contagem em janela deslizante por tipo e alerta quando passa do limite. O alerta sai no log em nível
 * `error` com `alert: true` e, se `SECURITY_ALERT_WEBHOOK_URL` estiver definido, num POST com texto curto
 * (tipo, quantidade, janela), sem nenhum dado pessoal. A contagem é por instância.
 */
@Injectable()
export class SecurityEvents {
  private readonly seen = new Map<SecurityEventType, number[]>();
  private readonly alertedAt = new Map<SecurityEventType, number>();

  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
  ) {}

  record(type: SecurityEventType, context: Context = {}): void {
    const ip = maskIp(context.ip);
    this.logger.warn(
      {
        security: type,
        ...(context.userId ? { userId: context.userId } : {}),
        ...(ip ? { ip } : {}),
        ...(context.scope ? { scope: context.scope } : {}),
      },
      'evento de segurança',
    );
    this.count(type);
  }

  private count(type: SecurityEventType): void {
    const rule = ALERTS[type];
    if (!rule) return;
    const now = this.clock.now().getTime();
    const recent = (this.seen.get(type) ?? []).filter((at) => now - at < rule.windowMs);
    recent.push(now);
    this.seen.set(type, recent);

    const last = this.alertedAt.get(type);
    if (recent.length <= rule.limit || (last !== undefined && now - last < rule.windowMs)) return;
    this.alertedAt.set(type, now);
    const minutes = rule.windowMs / 60_000;
    this.logger.error(
      { security: type, alert: true, count: recent.length, windowMinutes: minutes },
      'ALERTA de segurança: contagem anormal de eventos',
    );
    this.notify(`Next Journey: ${recent.length} eventos "${type}" em ${minutes} min`);
  }

  /** Aviso opcional por webhook (URL definida por quem opera). Falha não afeta a API. */
  private notify(text: string): void {
    const url = this.env.SECURITY_ALERT_WEBHOOK_URL;
    if (!url) return;
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => {
      this.logger.error('falha ao enviar o alerta de segurança pelo webhook');
    });
  }
}
