import type { QueryClient } from '@tanstack/react-query';

import { useFeedbackStore } from '@/features/feedback/feedback-store';

import { useSessionStore } from './session-store';

/**
 * Encerra a sessão só neste aparelho (a API já foi avisada antes): limpa os dados em cache, a fila de
 * avisos e os tokens. Um único lugar para sair, usado na exclusão da conta e na lista de sessões.
 */
export async function signOutLocally(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
  useFeedbackStore.getState().clear();
  await useSessionStore.getState().clear();
}
