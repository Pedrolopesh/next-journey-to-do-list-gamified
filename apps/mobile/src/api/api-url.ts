type Options = {
  /** Valor de EXPO_PUBLIC_API_URL, se houver. */
  configured: string | undefined;
  /** Build de produção (variante `production` do app). */
  isProduction: boolean;
  platform: string;
};

// Emulador Android enxerga o localhost do computador em 10.0.2.2
const LOCAL_ANDROID = 'http://10.0.2.2:3000';
const LOCAL_DEFAULT = 'http://localhost:3000';
// https com host (esquema sem diferenciar maiúscula); "https://" sozinho não vale
const HTTPS_WITH_HOST = /^https:\/\/[^\s/?#]+/i;

/**
 * Escolhe a URL base da API. Em desenvolvimento cai no servidor local quando nada foi configurado.
 * Em produção não há padrão: sem URL, ou sem https, o app se recusa a iniciar em vez de falar com
 * o lugar errado ou trafegar token em texto puro.
 */
export function resolveApiUrl({ configured, isProduction, platform }: Options): string {
  const value = configured?.trim();
  if (isProduction) {
    if (!value || !HTTPS_WITH_HOST.test(value)) {
      throw new Error('EXPO_PUBLIC_API_URL precisa ser uma URL https no build de produção');
    }
    return value.replace(/\/+$/, '');
  }
  const fallback = platform === 'android' ? LOCAL_ANDROID : LOCAL_DEFAULT;
  return (value || fallback).replace(/\/+$/, '');
}
