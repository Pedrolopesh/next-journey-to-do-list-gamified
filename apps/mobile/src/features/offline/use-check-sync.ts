import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { checkItem } from '@/api/endpoints';
import { refreshGameData } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';

import { backoffMs, flushQueue } from './check-queue';
import { useOfflineStore } from './offline-store';

const statusOf = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined;

/**
 * Reenvia os checks guardados sem rede: ao abrir o app, quando a conexão volta, quando o app volta
 * ao primeiro plano e, enquanto sobrar fila, com espera crescente entre as tentativas.
 */
export function useCheckSync(): void {
  const queryClient = useQueryClient();
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  const queueLength = useOfflineStore((state) => state.queue.length);
  const loaded = useOfflineStore((state) => state.loaded);
  // Muda a cada tentativa que deixou fila, para o efeito agendar a próxima com mais espera
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const attempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(async (): Promise<void> => {
    const { queue, remove } = useOfflineStore.getState();
    if (busy.current || queue.length === 0) return;
    busy.current = true;
    try {
      const result = await flushQueue(
        queue,
        async (entry) => {
          await checkItem(entry.itemId, entry.checkId);
        },
        statusOf,
      );
      remove([...result.sent, ...result.dropped].map((entry) => entry.checkId));
      if (result.sent.length + result.dropped.length > 0) refreshGameData(queryClient);
      attempt.current = result.remaining.length === 0 ? 0 : attempt.current + 1;
      if (result.remaining.length > 0) setRetry((n) => n + 1);
    } finally {
      busy.current = false;
    }
  }, [queryClient]);

  // Carrega a fila salva ao entrar; ao sair da conta, descarta (checks são de outro usuário)
  useEffect(() => {
    if (signedIn) void useOfflineStore.getState().load();
    else useOfflineStore.getState().clear();
  }, [signedIn]);

  // Enquanto houver fila, tenta enviar com espera crescente entre as tentativas
  useEffect(() => {
    if (!signedIn || !loaded || queueLength === 0) return;
    timer.current = setTimeout(() => void flush(), backoffMs(attempt.current));
    return () => {
      clearTimeout(timer.current);
    };
  }, [signedIn, loaded, queueLength, retry, flush]);

  // Conexão voltou ou app voltou ao primeiro plano: tenta já
  useEffect(() => {
    if (!signedIn) return;
    const retryNow = (): void => {
      attempt.current = 0;
      void flush();
    };
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) retryNow();
    });
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') retryNow();
    });
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [signedIn, flush]);
}
