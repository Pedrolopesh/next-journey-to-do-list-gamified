import { useRef, useState } from 'react';

import { log } from '@/logging';

import { runAction } from './run-action';
import { toast } from './toast-store';

type Options = {
  name: string;
  success?: string;
  error: (error: unknown) => string;
};

/**
 * The app's feedback rule: every user action shows the button loading and ends with a
 * success or error toast. Ignores repeated taps while the action runs.
 * Use `loading` in `<Button loading>` and call `run(() => ...)` in `onPress`.
 */
export function useAction({ name, success, error }: Options) {
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    try {
      return await runAction(action, {
        name,
        ...(success ? { success } : {}),
        error,
        onSuccess: toast.success,
        onError: toast.error,
        onLoading: setLoading,
        log: (event, data) => {
          if (event === 'action.error') log.warn(event, data);
          else log.info(event, data);
        },
      });
    } finally {
      busy.current = false;
    }
  };

  return { run, loading };
}
