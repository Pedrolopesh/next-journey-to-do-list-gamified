import { type ApiError, apiErrorSchema } from '@nextjourney/contracts';
import { isAxiosError } from 'axios';

import { isRetryableStatus } from '../features/offline/check-queue';

/** Extracts the API's standard error ({ code, message }) from a network/HTTP error, if any. */
export function toApiError(error: unknown): ApiError | null {
  if (!isAxiosError(error)) return null;
  const parsed = apiErrorSchema.safeParse(error.response?.data);
  if (parsed.success) return parsed.data;
  // The proxy's 429 comes as HTML, without the API format: it counts as RATE_LIMITED everywhere
  return error.response?.status === 429
    ? { code: 'RATE_LIMITED', message: 'Muitas requisições' }
    : null;
}

/** Error without a server response: no internet, timeout or API down. */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/** Worth resending later: no network, timeout, rate limit or server error. */
export function isRetryableError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return isRetryableStatus(error.response?.status);
}
