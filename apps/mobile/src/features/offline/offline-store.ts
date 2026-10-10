import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { log } from '@/logging';

import { enqueue, type QueuedCheck, removeByCheckId } from './check-queue';

const KEY = 'nj.check-queue.v1';
const ITEM_TYPES = new Set(['daily', 'todo', 'habit']);

function isQueuedCheck(value: unknown): value is QueuedCheck {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.itemId === 'string' &&
    typeof v.checkId === 'string' &&
    typeof v.queuedAt === 'number' &&
    typeof v.type === 'string' &&
    ITEM_TYPES.has(v.type)
  );
}

type OfflineState = {
  queue: QueuedCheck[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (entry: QueuedCheck) => void;
  remove: (checkIds: string[]) => void;
  clear: () => void;
};

async function persist(queue: QueuedCheck[]): Promise<void> {
  try {
    if (queue.length === 0) await AsyncStorage.removeItem(KEY);
    else await AsyncStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // sem armazenamento: a fila segue só na memória
  }
}

/** Fila de checks feitos sem rede. Persistida no aparelho para sobreviver a fechar o app. */
export const useOfflineStore = create<OfflineState>((set, get) => ({
  queue: [],
  loaded: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const stored = Array.isArray(parsed) ? parsed.filter(isQueuedCheck) : [];
      // O que entrou na memória antes do carregamento termina depois do que já estava salvo
      set({ queue: stored.reduce(enqueue, get().queue).sort((a, b) => a.queuedAt - b.queuedAt) });
    } catch {
      // arquivo corrompido: começa vazio
    }
    set({ loaded: true });
  },
  add: (entry) => {
    log.info('offline.enqueue', { checkId: entry.checkId, itemId: entry.itemId, type: entry.type });
    const queue = enqueue(get().queue, entry);
    set({ queue });
    void persist(queue);
  },
  remove: (checkIds) => {
    let queue = get().queue;
    for (const id of checkIds) queue = removeByCheckId(queue, id);
    set({ queue });
    void persist(queue);
  },
  clear: () => {
    set({ queue: [] });
    void persist([]);
  },
}));
