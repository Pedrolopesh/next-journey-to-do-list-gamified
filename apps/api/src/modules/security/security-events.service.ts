import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { Clock } from '../../common/clock.js';
import { ENV, type Env } from '../../config/env.js';

/**
 * Security events with a fixed name. They never carry an email, password, token or request body.
 */
export type SecurityEventType =
  | 'login_failed'
  | 'rate_limited'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'refresh_reuse_detected'
  | 'reauth_failed'
  | 'account_deleted'
  | 'data_exported';

type Context = {
  userId?: string;
  /** IP of the requester; it goes to the log masked (IPv4 without the last number). */
  ip?: string;
  /** Only short, fixed text (e.g. the name of the limit rule), never personal data. */
  scope?: string;
};

/**
 * Abnormal count per type: more than `limit` events in `windowMs` triggers the alert (once per
 * window).
 */
const ALERTS: Partial<Record<SecurityEventType, { limit: number; windowMs: number }>> = {
  login_failed: { limit: 30, windowMs: 5 * 60_000 },
  rate_limited: { limit: 100, windowMs: 5 * 60_000 },
  refresh_reuse_detected: { limit: 5, windowMs: 10 * 60_000 },
  reauth_failed: { limit: 10, windowMs: 10 * 60_000 },
  password_reset_requested: { limit: 30, windowMs: 10 * 60_000 },
};

/**
 * Masks the IP for the log: IPv4 loses the last number and IPv6 keeps only the first two groups.
 */
export function maskIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  const v4 = /^(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.exec(ip);
  if (v4) return `${v4[1]}.x`;
  const groups = ip.split(':').filter(Boolean);
  return groups.length >= 3 ? `${groups[0]}:${groups[1]}::x` : 'x';
}

/**
 * Security event log with sliding-window alerts. Rules and thresholds:
 * docs/api/operacao-e-seguranca.md.
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

  /** Optional webhook notice (URL set by whoever operates). A failure does not affect the API. */
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
