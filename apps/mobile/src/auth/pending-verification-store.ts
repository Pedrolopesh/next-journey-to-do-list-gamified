import { create } from 'zustand';

/**
 * Cadastro (ou login) que espera a confirmação do e-mail. Fica só na memória: a senha nunca vai em
 * parâmetro de rota, URL nem armazenamento. Se o app fechar, a pessoa volta ao login.
 */
type PendingVerification = { email: string; password: string };

type State = {
  pending: PendingVerification | null;
  set: (pending: PendingVerification) => void;
  clear: () => void;
};

export const usePendingVerificationStore = create<State>((set) => ({
  pending: null,
  set: (pending) => {
    set({ pending });
  },
  clear: () => {
    set({ pending: null });
  },
}));
