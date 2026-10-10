import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastMessage = { id: number; kind: ToastKind; message: string };

type ToastState = {
  current: ToastMessage | null;
  show: (kind: ToastKind, message: string) => void;
  hide: (id: number) => void;
};

let nextId = 1;

/** Toast global: toda ação do usuário termina em sucesso ou erro visível (regra de feedback). */
export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (kind, message) => {
    set({ current: { id: nextId++, kind, message } });
  },
  hide: (id) => {
    if (get().current?.id === id) set({ current: null });
  },
}));

export const toast = {
  success: (message: string) => {
    useToastStore.getState().show('success', message);
  },
  error: (message: string) => {
    useToastStore.getState().show('error', message);
  },
  info: (message: string) => {
    useToastStore.getState().show('info', message);
  },
};
