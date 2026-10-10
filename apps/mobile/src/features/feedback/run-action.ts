export type ActionHooks = {
  /** Mensagem de sucesso. Omitir só quando o próprio resultado já é visível (ex.: a tela muda). */
  success?: string;
  /** Texto do erro. Recebe o erro para escolher a mensagem certa (rede, validação, conflito). */
  error: (error: unknown) => string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onLoading?: (loading: boolean) => void;
  log?: (event: string, data?: unknown) => void;
  name: string;
};

/**
 * Executa uma ação garantindo o ciclo completo: carregando -> sucesso ou erro, sempre com retorno
 * ao usuário. Devolve `true` se deu certo. Nunca lança.
 */
export async function runAction(
  action: () => Promise<unknown>,
  hooks: ActionHooks,
): Promise<boolean> {
  hooks.onLoading?.(true);
  hooks.log?.('action.start', { name: hooks.name });
  try {
    await action();
    hooks.log?.('action.success', { name: hooks.name });
    if (hooks.success) hooks.onSuccess?.(hooks.success);
    return true;
  } catch (error) {
    const message = hooks.error(error);
    hooks.log?.('action.error', { name: hooks.name, message });
    hooks.onError?.(message);
    return false;
  } finally {
    hooks.onLoading?.(false);
  }
}
