/* eslint-disable no-console -- this file is the only place that writes to the console */
import { createLogger, type LogEntry } from './logger';

/** In the Metro console: `[time] level event {data}`. In production only warn and error come out. */
function toConsole(entry: LogEntry): void {
  const line = `${entry.at.slice(11, 23)} ${entry.level.toUpperCase()} ${entry.event}`;
  const method = entry.level === 'debug' ? 'log' : entry.level;
  if (entry.data === undefined) console[method](line);
  else console[method](line, JSON.stringify(entry.data));
}

export const log = createLogger({
  verbose: __DEV__,
  sink: (entry) => {
    if (__DEV__ || entry.level === 'warn' || entry.level === 'error') toConsole(entry);
  },
});

export { redact } from './logger';
