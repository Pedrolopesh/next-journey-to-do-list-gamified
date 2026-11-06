import { isNetworkError, toApiError } from '@/api/errors';

type Translate = (key: string) => string;

/**
 * Error text for the toast: no network, a known API code (`byCode`) or a generic message.
 * Never passes the server's raw message on to the user.
 */
export function describeError(
  error: unknown,
  t: Translate,
  byCode: Record<string, string> = {},
): string {
  if (isNetworkError(error)) return t('auth.networkError');
  const code = toApiError(error)?.code;
  if (code === 'RATE_LIMITED') return t('auth.rateLimited');
  return (code ? byCode[code] : undefined) ?? t('auth.genericError');
}
