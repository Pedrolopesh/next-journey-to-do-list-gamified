import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';
export type ToastMessage = { id: number; kind: ToastKind; message: string };

type ToastState = {
  current: ToastMessage | null;
  show: (kind: ToastKind, message: string) => void;
  hide: (id: number) => void;
};

let nextId = 1;

/** Global toast: every user action ends in a visible success or error (feedback rule). */
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
  warning: (message: string) => {
    useToastStore.getState().show('warning', message);
  },
};
