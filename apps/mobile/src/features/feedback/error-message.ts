import { isNetworkError, toApiError } from '@/api/errors';

type Translate = (key: string) => string;

/**
 * Texto de erro para o toast: sem rede, código conhecido da API (`byCode`) ou mensagem genérica.
 * Nunca repassa a mensagem crua do servidor para o usuário.
 */
export function describeError(
  error: unknown,
  t: Translate,
  byCode: Record<string, string> = {},
): string {
  if (isNetworkError(error)) return t('auth.networkError');
  const code = toApiError(error)?.code;
  return (code ? byCode[code] : undefined) ?? t('auth.genericError');
}
