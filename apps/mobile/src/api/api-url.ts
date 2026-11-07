type Options = {
  /** Value of EXPO_PUBLIC_API_URL, if set. */
  configured: string | undefined;
  /** Production build (the app's `production` variant). */
  isProduction: boolean;
  platform: string;
};

// Android emulator reaches the computer's localhost at 10.0.2.2
const LOCAL_ANDROID = 'http://10.0.2.2:3000';
const LOCAL_DEFAULT = 'http://localhost:3000';
// https with a host (scheme is case-insensitive); a bare "https://" does not count
const HTTPS_WITH_HOST = /^https:\/\/[^\s/?#]+/i;

/**
 * Picks the API base URL. In development it falls back to the local server when nothing is set.
 * In production there is no default: without a URL, or without https, the app refuses to start instead of
 * talking to the wrong place or sending the token in plain text.
 */
export function resolveApiUrl({ configured, isProduction, platform }: Options): string {
  const value = configured?.trim();
  if (isProduction) {
    if (!value || !HTTPS_WITH_HOST.test(value)) {
      throw new Error('EXPO_PUBLIC_API_URL must be an https URL in the production build');
    }
    return value.replace(/\/+$/, '');
  }
  const fallback = platform === 'android' ? LOCAL_ANDROID : LOCAL_DEFAULT;
  return (value || fallback).replace(/\/+$/, '');
}
