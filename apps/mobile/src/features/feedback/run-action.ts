export type ActionHooks = {
  /** Success message. Omit only when the result is already visible (e.g. the screen changes). */
  success?: string;
  /** Error text. Receives the error to pick the right message (network, validation, conflict). */
  error: (error: unknown) => string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onLoading?: (loading: boolean) => void;
  log?: (event: string, data?: unknown) => void;
  name: string;
};

/**
 * Runs an action guaranteeing the full cycle: loading -> success or error, always with feedback
 * to the user. Returns `true` on success. Never throws.
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
