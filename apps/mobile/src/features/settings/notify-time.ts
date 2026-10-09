const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Aceita "8:30", "08:30" e "0830"; devolve HH:MM ou nulo se inválido. Vazio = lembrete desligado. */
export function parseNotifyTime(input: string): { ok: true; value: string | null } | { ok: false } {
  const text = input.trim();
  if (text === '') return { ok: true, value: null };
  const withColon = /^\d{3,4}$/.test(text) ? `${text.slice(0, -2)}:${text.slice(-2)}` : text;
  const padded = /^\d:\d{2}$/.test(withColon) ? `0${withColon}` : withColon;
  return HHMM.test(padded) ? { ok: true, value: padded } : { ok: false };
}
