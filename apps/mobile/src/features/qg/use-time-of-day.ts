import type { TimeOfDay } from '@nextjourney/contracts';
import { useEffect, useState } from 'react';

import { resolveTime, type TimeMode } from './options';

const CHECK_EVERY_MS = 60_000;

/** Hora do dia do QG; no modo automático reavalia o relógio a cada minuto. */
export function useTimeOfDay(mode: TimeMode): TimeOfDay {
  const [value, setValue] = useState<TimeOfDay>(() => resolveTime(mode, new Date()));
  useEffect(() => {
    const update = (): void => {
      setValue(resolveTime(mode, new Date()));
    };
    update();
    if (mode !== 'auto') return;
    const timer = setInterval(update, CHECK_EVERY_MS);
    return () => {
      clearInterval(timer);
    };
  }, [mode]);
  return value;
}
