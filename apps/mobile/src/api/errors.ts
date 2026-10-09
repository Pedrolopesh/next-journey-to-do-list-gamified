import { type ApiError, apiErrorSchema } from '@nextjourney/contracts';
import { isAxiosError } from 'axios';

/** Extrai o erro padrão da API ({ code, message }) de um erro de rede/HTTP, se houver. */
export function toApiError(error: unknown): ApiError | null {
  if (!isAxiosError(error)) return null;
  const parsed = apiErrorSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data : null;
}

/** Erro sem resposta do servidor: sem internet, timeout ou API fora do ar. */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}
