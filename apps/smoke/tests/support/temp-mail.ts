import { randomBytes } from 'node:crypto';

const API = 'https://api.guerrillamail.com/ajax.php';
const POLL_INTERVAL_MS = 4000;
const CODE = /\b(\d{6})\b/;

interface InboxItem {
  mail_id: string;
  mail_from: string;
  mail_subject: string;
}

interface Inbox {
  address: string;
  /** Waits for a login code mail that was not read before and returns its 6 digits. */
  nextCode(options?: { timeoutMs?: number }): Promise<string>;
}

async function call<T>(params: Record<string, string>, sid?: string): Promise<T> {
  const query = new URLSearchParams({ ...params, ...(sid ? { sid_token: sid } : {}) });
  const response = await fetch(`${API}?${query.toString()}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`temp mail answered ${response.status}`);
  return (await response.json()) as T;
}

function stripTags(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Opens a throwaway inbox at a temporary mail provider (Guerrilla Mail; sharklasers.com is one of
 * its domains). The address is random, public and disposable: use it only for test accounts.
 */
export async function openInbox(): Promise<Inbox> {
  const user = `njsmoke${randomBytes(5).toString('hex')}`;
  const { sid_token: sid } = await call<{ sid_token: string }>({ f: 'get_email_address' });
  await call({ f: 'set_email_user', email_user: user }, sid);
  const seen = new Set<string>();

  return {
    address: `${user}@sharklasers.com`,
    async nextCode({ timeoutMs = 150_000 } = {}) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const { list = [] } = await call<{ list?: InboxItem[] }>(
          { f: 'check_email', seq: '0' },
          sid,
        );
        for (const item of list) {
          if (seen.has(item.mail_id) || /guerrillamail/i.test(item.mail_from)) continue;
          seen.add(item.mail_id);
          const mail = await call<{ mail_body?: string }>(
            { f: 'fetch_email', email_id: item.mail_id },
            sid,
          );
          const code = CODE.exec(stripTags(mail.mail_body ?? ''))?.[1];
          if (code) return code;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      throw new Error('no login code mail arrived in time');
    },
  };
}
