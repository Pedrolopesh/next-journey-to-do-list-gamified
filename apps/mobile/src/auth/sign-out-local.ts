import type { QueryClient } from '@tanstack/react-query';

import { useFeedbackStore } from '@/features/feedback/feedback-store';

import { useSessionStore } from './session-store';

/**
 * Ends the session on this device only (the API was already notified): clears cached data, the notice
 * queue and the tokens. A single place to sign out, used by account deletion and the session list.
 */
export async function signOutLocally(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
  useFeedbackStore.getState().clear();
  await useSessionStore.getState().clear();
}
