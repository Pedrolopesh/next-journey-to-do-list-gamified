export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  /** ISO 8601, device local time in UTC. */
  at: string;
  level: LogLevel;
  /** Event name in the `area.action` format (e.g. `http.response`, `check.start`). */
  event: string;
  data?: unknown;
};

export type LoggerOptions = {
  /** In development includes request/response bodies (always redacted). */
  verbose: boolean;
  sink: (entry: LogEntry) => void;
  now?: () => Date;
  /** How many records stay in memory for lookup (default 300). */
  capacity?: number;
};

/** Fields that never go to the log, under any circumstance. */
const SENSITIVE = /pass|token|secret|authorization|cookie|e-?mail|credential|code|signature/i;
const MAX_STRING = 200;
const MAX_ITEMS = 10;
const MAX_DEPTH = 4;

/** Copies the value swapping secrets for `[REDACTED]` and cutting long texts and lists. */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.length > MAX_STRING
      ? `${value.slice(0, MAX_STRING)}…(+${value.length - MAX_STRING})`
      : value;
  }
  if (typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[…]';
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((item) => redact(item, depth + 1));
    return value.length > MAX_ITEMS ? [...items, `…(+${value.length - MAX_ITEMS})`] : items;
  }
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE.test(key) ? '[REDACTED]' : redact(item, depth + 1);
  }
  return out;
}

export function createLogger({
  verbose,
  sink,
  now = () => new Date(),
  capacity = 300,
}: LoggerOptions) {
  const recent: LogEntry[] = [];

  const write = (level: LogLevel, event: string, data?: unknown): void => {
    const entry: LogEntry = {
      at: now().toISOString(),
      level,
      event,
      ...(data === undefined ? {} : { data: redact(data) }),
    };
    recent.push(entry);
    if (recent.length > capacity) recent.shift();
    sink(entry);
  };

  return {
    verbose,
    debug: (event: string, data?: unknown) => {
      if (verbose) write('debug', event, data);
    },
    info: (event: string, data?: unknown) => {
      write('info', event, data);
    },
    warn: (event: string, data?: unknown) => {
      write('warn', event, data);
    },
    error: (event: string, data?: unknown) => {
      write('error', event, data);
    },
    /** Latest records (oldest first), to display or attach to an error report. */
    recent: (): readonly LogEntry[] => recent,
  };
}

export type Logger = ReturnType<typeof createLogger>;
