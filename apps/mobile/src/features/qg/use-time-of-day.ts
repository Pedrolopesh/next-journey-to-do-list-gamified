import type { TimeOfDay } from '@nextjourney/contracts';
import { useEffect, useState } from 'react';

import { resolveTime, type TimeMode } from './options';

const CHECK_EVERY_MS = 60_000;

/** QG time of day; in automatic mode it re-reads the clock every minute. */
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
