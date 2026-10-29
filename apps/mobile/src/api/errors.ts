import { type ApiError, apiErrorSchema } from '@nextjourney/contracts';
import { isAxiosError } from 'axios';

import { isRetryableStatus } from '../features/offline/check-queue';

/** Extrai o erro padrão da API ({ code, message }) de um erro de rede/HTTP, se houver. */
export function toApiError(error: unknown): ApiError | null {
  if (!isAxiosError(error)) return null;
  const parsed = apiErrorSchema.safeParse(error.response?.data);
  if (parsed.success) return parsed.data;
  // O 429 do proxy vem em HTML, sem o formato da API: vale como RATE_LIMITED em todo lugar
  return error.response?.status === 429
    ? { code: 'RATE_LIMITED', message: 'Muitas requisições' }
    : null;
}

/** Erro sem resposta do servidor: sem internet, timeout ou API fora do ar. */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/** Vale reenviar depois: sem rede, timeout, limite de taxa ou erro do servidor. */
export function isRetryableError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return isRetryableStatus(error.response?.status);
}
