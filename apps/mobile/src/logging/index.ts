/* eslint-disable no-console -- este arquivo é o único ponto que escreve no console */
import { createLogger, type LogEntry } from './logger';

/** No console do Metro: `[hora] nivel evento {dados}`. Em produção só warn e error saem. */
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
